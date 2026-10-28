import * as THREE from "three";
import { TextDecoder, TextEncoder } from "util";

Object.defineProperty(globalThis, "TextDecoder", { value: TextDecoder, configurable: true });
Object.defineProperty(globalThis, "TextEncoder", { value: TextEncoder, configurable: true });
import { CACHE_RENDER_PAYLOAD_VERSION, type CacheRenderPayload } from "../src/cache-render-format";
import { CacheRender, type CacheRenderBundle } from "../src/sdk/rendering/CacheRenderBundle";
import { CacheRenderInstancedModel } from "../src/sdk/rendering/CacheRenderInstancedModel";
import { CacheRenderReferences } from "../src/sdk/rendering/CacheRenderReference";
import type { Renderable } from "../src/sdk/Renderable";

jest.mock("three", () => jest.requireActual("three"));

const FACE_POSITIONS = [0, 0, 0, 1, 0, 0, 0, 1, 0, 2, 0, 0, 3, 0, 0, 2, 1, 0];
const TEXTURE_PIXEL = 0xff112233;

function payload(textured: boolean): CacheRenderPayload {
  const positions = FACE_POSITIONS.slice();
  const body: CacheRenderPayload = {
    version: CACHE_RENDER_PAYLOAD_VERSION,
    positions,
    indices: [0, 1, 2, 3, 4, 5],
    colors: [0xffffff, 0xffffff, 0xffffff, 0xffffff, 0xffffff, 0xffffff],
    uvs: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
    spotAnim: { id: 7, animationId: 3 },
    animations: { "3": { frames: [positions.slice()], lengths: [30] } },
    poseMap: { "0": 3 },
  };
  if (!textured) return body;
  return {
    ...body,
    textureIds: [-1, -1, -1, 215, 215, 215],
    textures: { "215": { width: 1, height: 1, pixels: [TEXTURE_PIXEL] } },
  };
}

function encode(value: CacheRenderPayload): ArrayBuffer {
  const json = new TextEncoder().encode(JSON.stringify(value));
  const bytes = new Uint8Array(8 + json.length);
  bytes.set([79, 83, 82, 66]);
  new DataView(bytes.buffer).setUint32(4, json.length, true);
  bytes.set(json, 8);
  return bytes.buffer;
}

let bundleVersion = 0;

function serve(body: CacheRenderPayload): void {
  const id = "spotanim-7";
  const bundle = {
    manifest: { bundleVersion: `instanced-texture-${bundleVersion}` },
    assetIds: () => [] as string[],
    sharedAssetIds: () => [] as string[],
    spotAnimIds: () => [id],
    fetchAsset: async (assetId: string) => {
      if (assetId !== id) throw new Error(`unexpected asset ${assetId}`);
      return encode(body);
    },
  } as unknown as CacheRenderBundle;
  bundleVersion += 1;
  jest.spyOn(CacheRender, "bundle").mockResolvedValue(bundle);
}

function materialOf(mesh: THREE.InstancedMesh): THREE.MeshBasicMaterial {
  const material = mesh.material;
  if (Array.isArray(material) || !(material instanceof THREE.MeshBasicMaterial)) {
    throw new Error("instanced mesh has no MeshBasicMaterial");
  }
  return material;
}

function indexValues(mesh: THREE.InstancedMesh): number[] {
  const index = mesh.geometry.getIndex();
  if (!index) throw new Error("instanced mesh has no index");
  return Array.from(index.array);
}

async function drawn(body: CacheRenderPayload): Promise<THREE.InstancedMesh[]> {
  serve(body);
  const model = new CacheRenderInstancedModel({ size: 1 } as Renderable, CacheRenderReferences.spotAnim([{ id: 7 }]));
  await model.preload();
  const scene = new THREE.Scene();
  model.draw(scene, 0, 0, { x: 0, y: 0, z: 0 }, 0, 0, true, []);
  await new Promise((resolve) => setTimeout(resolve, 0));
  const meshes: THREE.InstancedMesh[] = [];
  scene.traverse((object) => {
    if (object instanceof THREE.InstancedMesh) meshes.push(object);
  });
  return meshes;
}

afterEach(() => {
  jest.restoreAllMocks();
});

test("draws a textured spotanim face on a mesh that carries the texture", async () => {
  const meshes = await drawn(payload(true));
  const mapped = meshes.filter((mesh) => materialOf(mesh).map !== null);
  const plain = meshes.filter((mesh) => materialOf(mesh).map === null);
  if (mapped.length !== 1) {
    throw new Error(`textured face drew without a map; instanced meshes ${meshes.length}`);
  }
  const map = materialOf(mapped[0]).map;
  if (!(map instanceof THREE.DataTexture) || !(map.image.data instanceof Uint8Array)) {
    throw new Error("textured material map is not a decoded texture");
  }
  expect(map.image.width).toBe(1);
  expect(map.image.height).toBe(1);
  expect(Array.from(map.image.data)).toEqual([0x11, 0x22, 0x33, 0xff]);
  expect(indexValues(mapped[0])).toEqual([3, 4, 5]);
  expect(plain).toHaveLength(1);
  expect(indexValues(plain[0])).toEqual([0, 1, 2]);
  expect(mapped[0].geometry.getAttribute("position")).toBe(plain[0].geometry.getAttribute("position"));
  expect(mapped[0].geometry.getAttribute("color")).toBe(plain[0].geometry.getAttribute("color"));
});

test("guard: an untextured spotanim draws without a texture map", async () => {
  const meshes = await drawn(payload(false));
  expect(meshes).toHaveLength(1);
  expect(materialOf(meshes[0]).map).toBeNull();
});

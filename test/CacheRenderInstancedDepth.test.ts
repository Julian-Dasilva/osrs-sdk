import * as THREE from "three";
import { TextDecoder, TextEncoder } from "util";

Object.defineProperty(globalThis, "TextDecoder", { value: TextDecoder, configurable: true });
import type { CacheRenderPayload } from "../src/cache-render-format";
import { CacheRender, CacheRenderBundle } from "../src/sdk/rendering/CacheRenderBundle";
import { CacheRenderInstancedModel } from "../src/sdk/rendering/CacheRenderInstancedModel";
import { CacheRenderReferences } from "../src/sdk/rendering/CacheRenderReference";
import type { Renderable } from "../src/sdk/Renderable";

jest.mock("three", () => jest.requireActual("three"));

const triangle = [0, 0, 0, 1, 0, 0, 0, 1, 0];

function payload(alphas?: number[]): CacheRenderPayload {
  return {
    version: 2,
    positions: triangle,
    indices: [0, 1, 2],
    colors: [0xffffff, 0xffffff, 0xffffff],
    alphas,
    spotAnim: { id: 7, animationId: 3 },
    animations: { "3": { frames: [triangle], lengths: [30] } },
    poseMap: { "0": 3 },
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

type DrawnKind = "spotAnim" | "asset";

function serve(kind: DrawnKind, alphas?: number[]): void {
  const id = kind === "spotAnim" ? "spotanim-7" : "floor-asset";
  const body = payload(alphas);
  const bundle = {
    manifest: { bundleVersion: `instanced-depth-${bundleVersion}` },
    assetIds: () => (kind === "asset" ? [id] : []),
    sharedAssetIds: () => [] as string[],
    spotAnimIds: () => (kind === "spotAnim" ? [id] : []),
    fetchAsset: async (assetId: string) => {
      if (assetId !== id) throw new Error(`unexpected asset ${assetId}`);
      return encode(body);
    },
  } as unknown as CacheRenderBundle;
  bundleVersion += 1;
  jest.spyOn(CacheRender, "bundle").mockResolvedValue(bundle);
}

async function drawn(kind: DrawnKind, alphas?: number[]) {
  serve(kind, alphas);
  const reference =
    kind === "spotAnim" ? CacheRenderReferences.spotAnim([{ id: 7 }]) : CacheRenderReferences.asset("floor-asset");
  const model = new CacheRenderInstancedModel({ size: 1 } as Renderable, reference);
  await model.preload();
  const scene = new THREE.Scene();
  model.draw(scene, 0, 0, { x: 0, y: 0, z: 0 }, 0, 0, true, []);
  await new Promise((resolve) => setTimeout(resolve, 0));
  const meshes: THREE.InstancedMesh[] = [];
  scene.traverse((object) => {
    if (object instanceof THREE.InstancedMesh) meshes.push(object);
  });
  if (meshes.length !== 1) throw new Error(`expected one instanced mesh, saw ${meshes.length}`);
  const material = meshes[0].material;
  if (Array.isArray(material) || !(material instanceof THREE.MeshBasicMaterial)) {
    throw new Error("expected one MeshBasicMaterial");
  }
  return { transparent: material.transparent, depthWrite: material.depthWrite };
}

afterEach(() => {
  jest.restoreAllMocks();
});

test("a fading spotanim does not write depth, and every other instanced material does", async () => {
  expect(await drawn("spotAnim", [0, 128, 0])).toEqual({ transparent: true, depthWrite: false });
  expect(await drawn("spotAnim")).toEqual({ transparent: false, depthWrite: true });
  expect(await drawn("asset", [0, 128, 0])).toEqual({ transparent: true, depthWrite: true });
});

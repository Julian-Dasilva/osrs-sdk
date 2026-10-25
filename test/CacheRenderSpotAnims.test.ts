import * as THREE from "three";
import { TextDecoder, TextEncoder } from "util";
import { CacheRenderModel } from "../src/sdk/rendering/CacheRenderModel";
import { CacheRender } from "../src/sdk/rendering/CacheRenderBundle";
import {
  CacheRenderReference,
  CacheRenderReferences,
  CacheRenderSpotAnim,
} from "../src/sdk/rendering/CacheRenderReference";
import { SoundCache } from "../src/sdk/utils/SoundCache";
import type { CacheRenderPayload } from "../src/cache-render-format";

(global as any).TextDecoder = TextDecoder;
// The shared test setup replaces three.js with a stub; these tests build real meshes.
jest.mock("three", () => jest.requireActual("three"));

const triangle = [0, 0, 0, 1, 0, 0, 0, 1, 0];

const body: CacheRenderPayload = {
  version: 2,
  positions: triangle,
  indices: [0, 1, 2],
  sourceVertices: [0, 1, 2],
  colors: [0xffffff, 0xffffff, 0xffffff],
  poseMap: { 0: 100 },
  animations: { 100: { frames: [triangle, triangle], lengths: [4, 4] } },
};

function effect(id: number): CacheRenderPayload {
  return {
    version: 2,
    positions: triangle,
    indices: [0, 1, 2],
    colors: [0xffffff, 0xffffff, 0xffffff],
    spotAnim: { id, animationId: 300 + id },
    animations: { [300 + id]: { frames: [triangle, triangle], lengths: [4, 4] } },
  };
}

function encode(value: unknown) {
  const json = new TextEncoder().encode(JSON.stringify(value));
  const bytes = new Uint8Array(8 + json.length);
  bytes.set([79, 83, 82, 66]);
  new DataView(bytes.buffer).setUint32(4, json.length, true);
  bytes.set(json, 8);
  return bytes.buffer;
}

let bundleVersion = 0;
// The bundle is the asset boundary: it serves the actor payload and every spotanim the bundle holds.
function serveBundle(effects: CacheRenderPayload[]) {
  const assets: Record<string, CacheRenderPayload> = { body };
  effects.forEach((payload) => (assets[`spotanim-${payload.spotAnim!.id}`] = payload));
  jest.spyOn(CacheRender, "bundle").mockResolvedValue({
    manifest: { bundleVersion: `spotanims-${bundleVersion++}` },
    assetIds: (reference: CacheRenderReference) => (reference.kind === "spotAnim" ? [] : ["body"]),
    sharedAssetIds: () => [],
    spotAnimIds: (reference: CacheRenderReference) =>
      reference.kind === "spotAnim" ? reference.spotAnims.map((spotAnim) => `spotanim-${spotAnim.id}`) : [],
    allSpotAnimIds: () => effects.map((payload) => `spotanim-${payload.spotAnim!.id}`),
    fetchAsset: async (id: string) => encode(assets[id]),
  } as any);
}

async function fixture(
  effects: CacheRenderPayload[],
  reference: CacheRenderReference = CacheRenderReferences.player(["body"]),
) {
  serveBundle(effects);
  const renderable = {
    size: 1,
    selectable: true,
    drawOutline: true,
    outlineRenderOrder: null,
    clickboxRadius: 0.5,
    clickboxHeight: 1,
    drawTrueTile: true,
    trueTileRenderOrder: null,
    spotAnims: [] as CacheRenderSpotAnim[],
    animationIndex: 0,
    shouldBlendAnimationWithPose: false,
    setAnimationListener: jest.fn(),
    clearAnimationListener: jest.fn(),
    getTrueLocation: () => ({ x: 0, y: 0 }),
    // A gear change hands the live model a freshly created one to read the new loadout from.
    get3dModel: () => new CacheRenderModel(renderable as any, CacheRenderReferences.player(["body"])),
  };
  const model = new CacheRenderModel(renderable as any, reference);
  await model.preload();
  const scene = new THREE.Scene();
  const draw = () => model.draw(scene, 1 / 120, 0, { x: 0, y: 0, z: 0 }, 0, 0, true, [], 0);
  const cycle = () => {
    model.clientTick();
    draw();
  };
  const attach = (spotAnim: CacheRenderSpotAnim) => {
    renderable.spotAnims = renderable.spotAnims.filter((attached) => attached.id !== spotAnim.id).concat(spotAnim);
    model.spotAnimChanged(renderable.spotAnims);
  };
  const root = () => (model as any).root as THREE.Group;
  const spotMeshes = () => root().children.filter((child) => child.userData.spotAnimId !== undefined) as THREE.Mesh[];
  return { model, scene, draw, cycle, attach, root, spotMeshes };
}

afterEach(() => {
  jest.restoreAllMocks();
});

test("an actor builds no spotanim meshes until one is attached", async () => {
  const { spotMeshes } = await fixture([effect(1), effect(2), effect(3)]);
  expect(spotMeshes()).toEqual([]);
});

test("attaching a spotanim builds its mesh alone, once", async () => {
  const { attach, cycle, spotMeshes } = await fixture([effect(1), effect(2), effect(3)]);
  attach({ id: 2 });
  const [mesh] = spotMeshes();
  expect(spotMeshes().map((spot) => spot.userData.spotAnimId)).toEqual([2]);
  cycle();
  expect(mesh.visible).toBe(true);
  attach({ id: 2, height: 1 });
  expect(spotMeshes()).toHaveLength(1);
  expect(spotMeshes()[0]).toBe(mesh);
});

test("a spotanim-only renderable builds the graphics it references", async () => {
  const { spotMeshes } = await fixture([effect(1), effect(2)], CacheRenderReferences.spotAnim([{ id: 2 }]));
  expect(spotMeshes().map((spot) => spot.userData.spotAnimId)).toEqual([2]);
});

test("a model change rebuilds the actor's mesh and keeps its spotanim meshes", async () => {
  const { model, attach, cycle, root, spotMeshes } = await fixture([effect(1), effect(2)]);
  attach({ id: 2 });
  cycle();
  const [spot] = spotMeshes();
  const actorMesh = (model as any).mesh;
  model.modelChanged();
  await model.preload();
  expect((model as any).mesh).not.toBe(actorMesh);
  expect(spotMeshes()).toHaveLength(1);
  expect(spotMeshes()[0]).toBe(spot);
  // Model offsets apply to the root's children by index, so the actor's mesh stays first.
  expect(root().children[0]).toBe((model as any).mesh);
  cycle();
  expect(spot.visible).toBe(true);
});

test("a model change does not replay the sounds of a playing spotanim", async () => {
  const sounding = effect(2);
  sounding.animations![302].frameSounds = { 0: [{ id: 902, loops: 0, location: 0, retain: 0, weight: 1 }] };
  const { model, attach, cycle } = await fixture([sounding]);
  const play = jest.spyOn(SoundCache, "play");
  attach({ id: 2 });
  cycle();
  expect(play).toHaveBeenCalledTimes(1);
  model.modelChanged();
  await model.preload();
  cycle();
  expect(play).toHaveBeenCalledTimes(1);
});

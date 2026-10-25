import { Location } from "../../src/sdk/Location";
import { Player } from "../../src/sdk/Player";
import { Settings } from "../../src/sdk/Settings";
import { Viewport } from "../../src/sdk/Viewport";
import { World } from "../../src/sdk/World";
import { TestRegion } from "../../src/sdk/testing/TestRegion";

// jsdom has no OffscreenCanvas.
const context = new Proxy({}, { get: (_, key) => (key === "measureText" ? () => ({ width: 0 }) : () => undefined), set: () => true });
class SizedCanvas {
  constructor(public width: number, public height: number) {}
  getContext() {
    return context;
  }
}
Object.defineProperty(globalThis, "OffscreenCanvas", { configurable: true, value: SizedCanvas });

function draw2d(regionSize: { width: number; height: number }, at: Location, zoomScale: number) {
  Settings.readFromStorage();
  Settings.zoomScale = zoomScale;
  const region = new TestRegion(regionSize.width, regionSize.height);
  const world = new World();
  region.world = world;
  world.addRegion(region);
  Viewport.setupViewport(region, document.createElement("canvas"), document.createElement("div"), true);
  const player = new Player(region, at);
  region.addPlayer(player);
  Viewport.viewport.setPlayer(player);
  Viewport.viewport.resize(800, 600);
  const { canvas, offsetX, offsetY } = Viewport.viewport.getDelegate().draw(world, region);
  return { canvas: [canvas.width, canvas.height], farthestShown: [800 - offsetX, 600 - offsetY] };
}

describe("2D backing canvas", () => {
  afterEach(() => {
    Settings.zoomScale = 1;
  });

  test.each([
    [{ width: 40, height: 40 }, 1, [1190, 1090]],
    [{ width: 40, height: 40 }, 2, [1980, 1880]],
    [{ width: 40, height: 40 }, 0.5, [795, 695]],
    [{ width: 40, height: 60 }, 1, [1190, 1490]],
  ] as const)("a %j arena at zoom %d gets a %j canvas", (regionSize, zoomScale, size) => {
    expect(draw2d(regionSize, { x: 20, y: 20 }, zoomScale).canvas).toEqual(size);
  });

  test.each([
    [{ width: 40, height: 40 }, 1],
    [{ width: 40, height: 40 }, 2],
    [{ width: 40, height: 60 }, 1],
  ] as const)("with the player on the far corner of a %j arena at zoom %d, the screen shows the canvas to its last pixel", (regionSize, zoomScale) => {
    const { canvas, farthestShown } = draw2d(regionSize, { x: regionSize.width - 1, y: regionSize.height - 1 }, zoomScale);

    expect(farthestShown).toEqual(canvas);
  });
});

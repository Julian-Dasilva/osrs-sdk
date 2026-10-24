import { Location } from "../../src/sdk/Location";
import { Player } from "../../src/sdk/Player";
import { Settings } from "../../src/sdk/Settings";
import { Viewport } from "../../src/sdk/Viewport";
import { World } from "../../src/sdk/World";
import { TestNpc } from "../../src/sdk/testing/TestNpc";
import { TestRegion } from "../../src/sdk/testing/TestRegion";

describe("Control-click movement", () => {
  let world: World;
  let player: Player;

  beforeEach(() => {
    Settings.readFromStorage();
    const region = new TestRegion(40, 40);
    world = new World();
    region.world = world;
    world.addRegion(region);
    Viewport.setupViewport(region, document.createElement("canvas"), document.createElement("div"), true);
    player = new Player(region, { x: 14, y: 14 });
    region.addPlayer(player);
    Viewport.viewport.setPlayer(player);
    Viewport.viewport.resize(800, 600);
    Settings.rotated = "north";
  });

  afterEach(() => jest.restoreAllMocks());

  // jsdom's MouseEvent has no layout, so the canvas offset a browser would compute is set by hand.
  async function press(tile: Location, init: MouseEventInit) {
    const { x, y } = Viewport.viewport.projectTile(tile, world);
    const event = new MouseEvent("mousedown", init);
    Object.defineProperty(event, "offsetX", { value: x });
    Object.defineProperty(event, "offsetY", { value: y });
    Viewport.viewport.canvas.dispatchEvent(event);
    await new Promise((resolve) => setTimeout(resolve, Settings.inputDelay));
  }

  function tilesOverTicks(ticks: number) {
    return Array.from({ length: ticks }, () => {
      world.tickWorld();
      return { ...player.location };
    });
  }

  test.each([
    ["a plain click runs two tiles a tick", false, [{ x: 16, y: 14 }, { x: 18, y: 14 }, { x: 20, y: 14 }]],
    ["a Control-click walks one tile a tick", true, [{ x: 15, y: 14 }, { x: 16, y: 14 }, { x: 17, y: 14 }]],
  ])("%s with run on", async (_name, ctrlKey, tiles) => {
    await press({ x: 20, y: 14 }, { button: 0, ctrlKey });

    expect(tilesOverTicks(3)).toEqual(tiles);
    expect(player.running).toBe(true);
  });

  test.each([
    ["MacIntel", true, { x: 15, y: 14 }, false],
    ["MacIntel", false, { x: 14, y: 14 }, true],
    ["Win32", true, { x: 14, y: 14 }, true],
  ])("on %s, a secondary press with Control %p moves to %p and opens the menu: %p", async (platform, ctrlKey, tile, menu) => {
    jest.spyOn(navigator, "platform", "get").mockReturnValue(platform);

    await press({ x: 20, y: 14 }, { button: 2, ctrlKey });

    expect([tilesOverTicks(1)[0], Viewport.viewport.contextMenu.isActive]).toEqual([tile, menu]);
  });

  test("an attack after a Control-click walk runs to the target", async () => {
    await press({ x: 20, y: 14 }, { button: 0, ctrlKey: true });
    tilesOverTicks(1);

    player.setAggro(new TestNpc(player.region, { x: 30, y: 14 }, { aggro: player }));

    expect(tilesOverTicks(1)).toEqual([{ x: 17, y: 14 }]);
  });

  test("the pace names the order: walk after a Control-click, the run setting after an attack or a plain click", async () => {
    const paceAfter = async (order: () => Promise<void> | void) => {
      await order();
      tilesOverTicks(1);
      return player.pace;
    };

    expect([
      await paceAfter(() => press({ x: 20, y: 14 }, { button: 0, ctrlKey: true })),
      await paceAfter(() => player.setAggro(new TestNpc(player.region, { x: 30, y: 14 }, { aggro: player }))),
      await paceAfter(() => press({ x: 20, y: 16 }, { button: 0, ctrlKey: true })),
      await paceAfter(() => press({ x: 20, y: 18 }, { button: 0 })),
    ]).toEqual(["walk", "run-setting", "walk", "run-setting"]);
  });
});

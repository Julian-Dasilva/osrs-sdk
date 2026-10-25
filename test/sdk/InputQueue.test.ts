import { Location } from "../../src/sdk/Location";
import { Player } from "../../src/sdk/Player";
import { Settings } from "../../src/sdk/Settings";
import { Viewport } from "../../src/sdk/Viewport";
import { World } from "../../src/sdk/World";
import { TestRegion } from "../../src/sdk/testing/TestRegion";

describe("clicks queued for the world tick", () => {
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

  // jsdom's MouseEvent has no layout, so the canvas offset a browser would compute is set by hand.
  function press(tile: Location) {
    const { x, y } = Viewport.viewport.projectTile(tile, world);
    const event = new MouseEvent("mousedown", { button: 0 });
    Object.defineProperty(event, "offsetX", { value: x });
    Object.defineProperty(event, "offsetY", { value: y });
    Viewport.viewport.canvas.dispatchEvent(event);
  }

  function tilesOverTicks(ticks: number) {
    return Array.from({ length: ticks }, () => {
      world.tickWorld();
      return { ...player.location };
    });
  }

  test("a second click before the tick replaces the first, and the tick right after it runs it", () => {
    press({ x: 20, y: 14 });
    press({ x: 14, y: 20 });

    expect(tilesOverTicks(2)).toEqual([{ x: 14, y: 16 }, { x: 14, y: 18 }]);
  });

  test("a click after a tick has run waits for the next tick", () => {
    press({ x: 20, y: 14 });
    tilesOverTicks(1);
    press({ x: 16, y: 20 });
    const beforeTheNextTick = { ...player.location };

    expect([beforeTheNextTick, ...tilesOverTicks(2)]).toEqual([{ x: 16, y: 14 }, { x: 16, y: 16 }, { x: 16, y: 18 }]);
  });
});

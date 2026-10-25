import { InputController } from "../../src/sdk/Input";
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
    jest.useFakeTimers();
    Settings.readFromStorage();
    InputController.controller = new InputController();
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

  afterEach(() => {
    jest.useRealTimers();
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

  test("with an input delay, each click registers on the first tick after its delay", () => {
    Settings.inputDelay = 80;
    press({ x: 20, y: 14 });
    jest.advanceTimersByTime(20);
    press({ x: 14, y: 20 });
    jest.advanceTimersByTime(59);
    const at79 = tilesOverTicks(1)[0];
    jest.advanceTimersByTime(1);
    const at80 = tilesOverTicks(1)[0];
    jest.advanceTimersByTime(20);
    const at100 = tilesOverTicks(1)[0];

    expect([at79, at80, at100]).toEqual([{ x: 14, y: 14 }, { x: 16, y: 14 }, { x: 16, y: 16 }]);
  });

  test("a correction registers while eight earlier clicks still wait out the input delay", () => {
    Settings.inputDelay = 600;
    jest.advanceTimersByTime(50);
    for (let click = 1; click <= 8; click++) {
      press({ x: 20, y: 14 });
      if (click < 8) jest.advanceTimersByTime(65);
    }
    jest.advanceTimersByTime(95);
    world.tickWorld();
    jest.advanceTimersByTime(50);
    press({ x: 14, y: 20 });
    jest.advanceTimersByTime(550);
    world.tickWorld();
    jest.advanceTimersByTime(600);
    world.tickWorld();

    expect(player.destinationLocation).toEqual({ x: 14, y: 20 });
  });
});

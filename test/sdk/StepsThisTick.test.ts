import { InvisibleMovementBlocker } from "../../src/content/MovementBlocker";
import { Player } from "../../src/sdk/Player";
import { Settings } from "../../src/sdk/Settings";
import { Viewport } from "../../src/sdk/Viewport";
import { World } from "../../src/sdk/World";
import { TestRegion } from "../../src/sdk/testing/TestRegion";

describe("steps this tick", () => {
  let world: World;
  let region: TestRegion;
  let player: Player;

  beforeEach(() => {
    Settings.readFromStorage();
    region = new TestRegion(40, 40);
    world = new World();
    region.world = world;
    world.addRegion(region);
    Viewport.setupViewport(region, document.createElement("canvas"), document.createElement("div"), true);
    player = new Player(region, { x: 14, y: 14 });
    region.addPlayer(player);
    Viewport.viewport.setPlayer(player);
  });

  function stepsOverTicks(ticks: number) {
    return Array.from({ length: ticks }, () => {
      world.tickWorld();
      return player.stepsThisTick;
    });
  }

  test.each([
    ["a walk steps one tile a tick", false, { x: 16, y: 14 }, [[{ x: 15, y: 14 }], [{ x: 16, y: 14 }], []]],
    [
      "a run steps both tiles in order, then the one tile left",
      true,
      { x: 17, y: 14 },
      [[{ x: 15, y: 14 }, { x: 16, y: 14 }], [{ x: 17, y: 14 }], []],
    ],
  ])("%s, and steps none once it arrives", (_name, running, destination, steps) => {
    player.running = running;
    player.moveTo(destination.x, destination.y);

    expect(stepsOverTicks(3)).toEqual(steps);
  });

  test("a boxed-in player steps no tile until the way east opens", () => {
    player.running = true;
    const blockers = [
      [13, 13], [14, 13], [15, 13],
      [13, 14], [15, 14],
      [13, 15], [14, 15], [15, 15],
    ].map(([x, y]) => new InvisibleMovementBlocker(region, { x, y }));
    blockers.forEach((blocker) => region.addEntity(blocker));
    player.moveTo(18, 14);

    const boxedIn = stepsOverTicks(1);
    region.removeEntity(blockers[4]);

    expect([...boxedIn, ...stepsOverTicks(1)]).toEqual([[], [{ x: 15, y: 14 }, { x: 16, y: 14 }]]);
  });
});

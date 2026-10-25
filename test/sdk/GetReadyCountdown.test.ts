import { DelayedAction } from "../../src/sdk/DelayedAction";
import { Player } from "../../src/sdk/Player";
import { TestNpc } from "../../src/sdk/testing/TestNpc";
import { TestRegion } from "../../src/sdk/testing/TestRegion";
import { Viewport } from "../../src/sdk/Viewport";
import { World } from "../../src/sdk/World";

class WalkingNpc extends TestNpc {
  override get attackRange() {
    return 0;
  }
}

class CountdownRegion extends TestRegion {
  override initialiseRegion() {
    const player = new Player(this, { x: 20, y: 20 });
    this.addPlayer(player);
    this.addMob(new WalkingNpc(this, { x: 10, y: 20 }, {}));
    return { player };
  }
}

describe("GET READY countdown", () => {
  let region: CountdownRegion;
  let world: World;

  beforeEach(() => {
    DelayedAction.reset();
    region = new CountdownRegion(40, 40);
    world = new World();
    region.world = world;
    world.addRegion(region);
    Viewport.viewport = {
      reset: jest.fn(),
      setPlayer: jest.fn(),
      tick: jest.fn(),
      draw: jest.fn(),
      clientTick: jest.fn(),
    } as never;
    jest.spyOn(window, "requestAnimationFrame").mockReturnValue(0);
  });

  afterEach(() => jest.restoreAllMocks());

  function startFight(startWorld: boolean) {
    const { player } = region.reset(startWorld);
    const [mob] = region.newMobs;
    mob.stunned = 0;
    mob.setAggro(player);
    player.attackDelay = 3;
    return { player, mob };
  }

  test.each([
    ["tickWorld", false, () => world.tickWorld()],
    ["the browser loop", true, () => world.browserLoop(world.nextTickTimer + 1)],
  ] as const)(
    "after a reset, %s holds units through five ticks of GET READY, steps them from the sixth and stays at 0",
    (_driver, startWorld, advance) => {
      const { player, mob } = startFight(startWorld);

      const trace = Array.from({ length: 8 }, () => {
        advance();
        return [world.getReadyTimer, mob.location.x, player.attackDelay];
      });

      expect([world.globalTickCounter, trace]).toEqual([
        8,
        [
          [5, 10, 3],
          [4, 10, 3],
          [3, 10, 3],
          [2, 10, 3],
          [1, 10, 3],
          [0, 11, 2],
          [0, 12, 1],
          [0, 13, 0],
        ],
      ]);
    },
  );

  test("tickWorld(n) counts GET READY down once for each of its n ticks", () => {
    const { mob } = startFight(false);

    world.tickWorld(3);
    const afterThree = [world.getReadyTimer, mob.location.x];
    world.tickWorld(3);

    expect([afterThree, [world.getReadyTimer, mob.location.x]]).toEqual([
      [3, 10],
      [0, 11],
    ]);
  });
});

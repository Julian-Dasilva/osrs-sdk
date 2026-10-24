import { DelayedAction } from "../../src/sdk/DelayedAction";
import { Player } from "../../src/sdk/Player";
import { TestNpc } from "../../src/sdk/testing/TestNpc";
import { TestRegion } from "../../src/sdk/testing/TestRegion";
import { Viewport } from "../../src/sdk/Viewport";
import { World } from "../../src/sdk/World";
import { Projectile } from "../../src/sdk/weapons/Projectile";

describe("hits this tick", () => {
  let region: TestRegion;
  let world: World;
  let player: Player;
  let mob: TestNpc;

  beforeEach(() => {
    DelayedAction.reset();
    region = new TestRegion(40, 40);
    world = new World();
    region.world = world;
    world.addRegion(region);
    Viewport.viewport = { tick: jest.fn() } as never;
    player = new Player(region, { x: 20, y: 20 });
    mob = new TestNpc(region, { x: 10, y: 10 }, {});
    mob.stunned = 0;
    region.addPlayer(player);
    region.addMob(mob);
  });

  function hitsOverTicks(ticks: number) {
    return Array.from({ length: ticks }, () => {
      world.tickWorld();
      return mob.hitsThisTick;
    });
  }

  test("a hit appears once, with its damage, style and source, on the tick it lands", () => {
    mob.addProjectile(new Projectile(null, 20, player, mob, "stab", { setDelay: 2 }));

    expect(hitsOverTicks(3)).toEqual([[], [{ damage: 20, attackStyle: "stab", from: player }], []]);
  });

  test("a hit whose damage is set to 0 before it lands reports 0", () => {
    const hit = new Projectile(null, 20, player, mob, "stab", { setDelay: 2 });
    mob.addProjectile(hit);
    world.tickWorld();
    hit.damage = 0;

    expect([hitsOverTicks(1), mob.currentStats.hitpoint]).toEqual([[[{ damage: 0, attackStyle: "stab", from: player }]], 125]);
  });

  test("two hits landing on one tick both appear, in landing order", () => {
    mob.addProjectile(new Projectile(null, 20, player, mob, "stab", { setDelay: 1 }));
    mob.addProjectile(new Projectile(null, 7, player, mob, "range", { setDelay: 1 }));

    expect(hitsOverTicks(1)).toEqual([[{ damage: 20, attackStyle: "stab", from: player }, { damage: 7, attackStyle: "range", from: player }]]);
  });

  test("a hit cancelled because its source died reports nothing, beside one that lands", () => {
    const dyingSource = new TestNpc(region, { x: 30, y: 30 }, {});
    dyingSource.dying = 3;
    mob.addProjectile(new Projectile(null, 20, dyingSource, mob, "stab", { setDelay: 1, cancelOnDeath: true }));
    mob.addProjectile(new Projectile(null, 7, player, mob, "range", { setDelay: 1, cancelOnDeath: true }));

    expect(hitsOverTicks(1)).toEqual([[{ damage: 7, attackStyle: "range", from: player }]]);
  });

  test("the hits clear on the next tick even when the countdown keeps the unit from stepping", () => {
    mob.addProjectile(new Projectile(null, 20, player, mob, "stab", { setDelay: 1 }));
    const landed = hitsOverTicks(1);
    world.getReadyTimer = 3;

    expect([...landed, ...hitsOverTicks(1)]).toEqual([[{ damage: 20, attackStyle: "stab", from: player }], []]);
  });
});

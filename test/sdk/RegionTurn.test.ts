import { InvisibleMovementBlocker } from "../../src/content/MovementBlocker";
import { DelayedAction } from "../../src/sdk/DelayedAction";
import { Player } from "../../src/sdk/Player";
import { TestNpc } from "../../src/sdk/testing/TestNpc";
import { TestRegion } from "../../src/sdk/testing/TestRegion";
import { Viewport } from "../../src/sdk/Viewport";
import { World } from "../../src/sdk/World";

describe("region turn", () => {
  let region: TestRegion;
  let world: World;
  let player: Player;
  let mob: TestNpc;
  let blocker: InvisibleMovementBlocker;

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
    blocker = new InvisibleMovementBlocker(region, { x: 30, y: 30 });
    region.addPlayer(player);
    region.addMob(mob);
    region.addEntity(blocker);
  });

  afterEach(() => jest.restoreAllMocks());

  function callOrder(spies: Readonly<Record<string, jest.SpyInstance>>) {
    const calls = Object.entries(spies).map(([name, spy]) => spy.mock.invocationCallOrder.map((at) => [at, name] as const));
    return ([] as (readonly [number, string])[]).concat(...calls)
      .sort(([a], [b]) => a - b)
      .map(([, name]) => name);
  }

  test("opens after player pretick and entity ticks, before any NPC timer, and once per tick", () => {
    const spies = {
      "player.pretick": jest.spyOn(player, "pretick"),
      "entity.tick": jest.spyOn(blocker, "tick"),
      "region.beforeNpcTurns": jest.spyOn(region, "beforeNpcTurns"),
      "npc.timerStep": jest.spyOn(mob, "timerStep"),
      "npc.queueStep": jest.spyOn(mob, "queueStep"),
      "player.queueStep": jest.spyOn(player, "queueStep"),
      "region.postTick": jest.spyOn(region, "postTick"),
    };
    world.tickWorld(2);
    const tick = ["player.pretick", "entity.tick", "region.beforeNpcTurns", "npc.timerStep", "npc.queueStep", "player.queueStep", "region.postTick"];
    expect(callOrder(spies)).toEqual([...tick, ...tick]);
  });

  test("GET READY holds the region turn with the NPC turns", () => {
    world.getReadyTimer = 3;
    const spies = { "region.beforeNpcTurns": jest.spyOn(region, "beforeNpcTurns"), "npc.queueStep": jest.spyOn(mob, "queueStep") };
    const perTick = Array.from({ length: 4 }, () => {
      jest.clearAllMocks();
      world.tickWorld();
      return [world.getReadyTimer, callOrder(spies)];
    });
    expect(perTick).toEqual([
      [2, []],
      [1, []],
      [0, ["region.beforeNpcTurns", "npc.queueStep"]],
      [0, ["region.beforeNpcTurns", "npc.queueStep"]],
    ]);
  });
});

import { SDK_ITEM_CATALOG, BastionPotion, Karambwan, SaradominBrew } from "../../src/content";
import { Food } from "../../src/sdk/gear/Food";
import { Potion } from "../../src/sdk/gear/Potion";
import { Player } from "../../src/sdk/Player";
import { TestRegion } from "../../src/sdk/testing/TestRegion";
import { Viewport } from "../../src/sdk/Viewport";
import { World } from "../../src/sdk/World";

function fight() {
  const region = new TestRegion(10, 10);
  const world = new World();
  region.world = world;
  world.addRegion(region);
  const player = new Player(region, { x: 2, y: 2 });
  region.addPlayer(player);
  Viewport.setupViewport(region, document.createElement("canvas"), document.createElement("div"), true);
  Viewport.viewport.setPlayer(player);
  return { player, world };
}

function carry(player: Player, id: number, slot = 0) {
  const entry = SDK_ITEM_CATALOG.get(id);
  expect(entry).toBeDefined();
  if (!entry) throw new Error(`Missing supply ${id}`);
  const item = entry.build();
  player.inventory[slot] = item;
  return item;
}

const POTIONS = [
  { name: "prayer four-dose", id: 2434, next: 139, doses: 3, stat: "prayer", initial: 20, expected: 51 },
  { name: "prayer two-dose", id: 141, next: 143, doses: 1, stat: "prayer", initial: 20, expected: 51 },
  { name: "ranging four-dose", id: 2444, next: 169, doses: 3, stat: "range", initial: 99, expected: 112 },
  { name: "ranging two-dose", id: 171, next: 173, doses: 1, stat: "range", initial: 99, expected: 112 },
  { name: "super combat two-dose", id: 12699, next: 12701, doses: 1, stat: "attack", initial: 99, expected: 118 },
  { name: "divine super combat", id: 23685, next: 23688, doses: 3, stat: "strength", initial: 99, expected: 118 },
  { name: "Sanfew serum", id: 10925, next: 10927, doses: 3, stat: "prayer", initial: 20, expected: 53 },
] as const;

for (const { name, id, next, doses, stat, initial, expected } of POTIONS) {
  test(`${name} applies the wiki effect next tick and waits three ticks between doses`, () => {
    const { player, world } = fight();
    const potion = carry(player, id);
    player.currentStats[stat] = initial;
    potion.inventoryLeftClick(player);
    expect(player.currentStats[stat]).toBe(initial);
    expect(potion).toBeInstanceOf(Potion);
    if (!(potion instanceof Potion)) throw new Error("Expected potion");
    expect(potion.doses).toBe(doses);
    expect(potion.itemId).toBe(next);
    expect(potion.weight).toBe(id === 141 || id === 171 ? 0.02 : 0.03);
    expect(player.attackDelay).toBe(0);
    world.tickWorld(1);
    expect(player.currentStats[stat]).toBe(expected);
    potion.inventoryLeftClick(player);
    expect(potion.doses).toBe(doses);
    world.tickWorld(2);
    potion.inventoryLeftClick(player);
    expect(potion.doses).toBe(doses - 1);
  });
}

for (const { id, name, heal, delay } of [
  { id: 391, name: "manta ray", heal: 22, delay: 3 },
  { id: 32336, name: "halibut", heal: 20, delay: 2 },
  { id: 32312, name: "giant krill", heal: 17, delay: 3 },
  { id: 34730, name: "leftovers", heal: 5, delay: 3 },
]) {
  test(`${name} heals next tick, is consumed, and sets the wiki attack delay`, () => {
    const { player, world } = fight();
    const food = carry(player, id);
    const next = carry(player, id, 1);
    player.currentStats.hitpoint = 40;
    player.attackDelay = 1;
    food.inventoryLeftClick(player);
    expect(player.inventory[0]).toBeNull();
    expect(player.currentStats.hitpoint).toBe(40);
    world.tickWorld(1);
    expect(player.currentStats.hitpoint).toBe(40 + heal);
    expect(player.attackDelay).toBe(delay);
    next.inventoryLeftClick(player);
    expect(player.inventory[1]).toBe(next);
    world.tickWorld(2);
    next.inventoryLeftClick(player);
    world.tickWorld(1);
    expect(player.currentStats.hitpoint).toBe(40 + heal * 2);
    expect(player.inventory[1]).toBeNull();
  });
}

test("halibut follows food and brew in one tick, but blocks another halibut and reverse-order food", () => {
  const { player, world } = fight();
  const manta = carry(player, 391);
  const halibut = carry(player, 32336, 1);
  const second = carry(player, 32336, 2);
  const brew = new SaradominBrew();
  player.inventory[3] = brew;
  player.currentStats.hitpoint = 20;
  player.attackDelay = 1;
  manta.inventoryLeftClick(player);
  brew.inventoryLeftClick(player);
  halibut.inventoryLeftClick(player);
  second.inventoryLeftClick(player);
  world.tickWorld(1);
  expect(player.currentStats.hitpoint).toBe(78);
  expect(player.attackDelay).toBe(5);
  expect(player.inventory[2]).toBe(second);
  world.tickWorld(2);
  second.inventoryLeftClick(player);
  const blocked = carry(player, 391, 4);
  blocked.inventoryLeftClick(player);
  world.tickWorld(1);
  expect(player.currentStats.hitpoint).toBe(98);
  expect(player.inventory[4]).toBe(blocked);
});

test("foods cap healing at the base hitpoints level", () => {
  const { player, world } = fight();
  player.currentStats.hitpoint = 95;
  carry(player, 391).inventoryLeftClick(player);
  world.tickWorld(1);
  expect(player.currentStats.hitpoint).toBe(99);
});

test("Sanfew restores drained combat stats without removing a boost or healing", () => {
  const { player, world } = fight();
  Object.assign(player.currentStats, { attack: 60, strength: 60, defence: 118, range: 98, magic: 60, hitpoint: 40 });
  carry(player, 10925).inventoryLeftClick(player);
  world.tickWorld(1);
  expect([
    player.currentStats.attack,
    player.currentStats.strength,
    player.currentStats.defence,
    player.currentStats.range,
    player.currentStats.magic,
    player.currentStats.hitpoint,
  ]).toEqual([93, 93, 118, 99, 93, 40]);
});

test("prayer restoration caps at base prayer and an exhausted bottle leaves the inventory", () => {
  const { player, world } = fight();
  player.currentStats.prayer = 90;
  const last = carry(player, 143);
  last.inventoryLeftClick(player);
  world.tickWorld(1);
  expect(player.currentStats.prayer).toBe(99);
  expect(player.inventory[0]).toBeNull();
  expect(last.itemId).toBe(229);
});

test("divine refuses a dose at ten HP without consuming it or blocking a normal potion", () => {
  const { player, world } = fight();
  const divine = carry(player, 23685);
  player.currentStats.hitpoint = 10;
  divine.inventoryLeftClick(player);
  expect(divine).toBeInstanceOf(Potion);
  if (!(divine instanceof Potion)) throw new Error("Expected potion");
  expect(divine.doses).toBe(4);
  player.currentStats.prayer = 20;
  carry(player, 2434, 1).inventoryLeftClick(player);
  world.tickWorld(1);
  expect(player.currentStats.hitpoint).toBe(10);
  expect(player.currentStats.strength).toBe(99);
  expect(player.currentStats.prayer).toBe(51);
});

test("divine damages ten HP and expires after five minutes even when its last dose is gone", () => {
  const { player, world } = fight();
  carry(player, 23694).inventoryLeftClick(player);
  world.tickWorld(1);
  expect(player.inventory[0]).toBeNull();
  expect(player.currentStats.hitpoint).toBe(89);
  expect([player.currentStats.attack, player.currentStats.strength, player.currentStats.defence]).toEqual([
    118, 118, 118,
  ]);
  world.tickWorld(499);
  expect(player.currentStats.attack).toBe(118);
  world.tickWorld(1);
  expect([player.currentStats.attack, player.currentStats.strength, player.currentStats.defence]).toEqual([99, 99, 99]);
});

test("Alliance log is carried without an eat or drink action or a combat effect", () => {
  const { player, world } = fight();
  const log = carry(player, 34729);
  expect(log.itemName).toBe("Alliance log");
  expect(log instanceof Food || log instanceof Potion).toBe(false);
  expect(log.hasInventoryLeftClick).toBe(false);
  log.inventoryLeftClick(player);
  world.tickWorld(1);
  expect(player.inventory[0]).toBe(log);
  expect([player.currentStats.hitpoint, player.currentStats.prayer]).toEqual([99, 99]);
  expect(player.attackDelay).toBeLessThanOrEqual(0);
});

for (const { id, stat, boosted, decayed } of [
  { id: 2444, stat: "range", boosted: 112, decayed: 111 },
  { id: 12699, stat: "attack", boosted: 118, decayed: 117 },
] as const) {
  test(`${id} boost decays by one after a minute`, () => {
    const { player, world } = fight();
    carry(player, id).inventoryLeftClick(player);
    world.tickWorld(99);
    expect(player.currentStats[stat]).toBe(boosted);
    world.tickWorld(1);
    expect(player.currentStats[stat]).toBe(decayed);
  });
}

test("Preserve extends ordinary boosts by thirty seconds after its activation time", () => {
  const { player, world } = fight();
  player.prayerController.findPrayerByName("Preserve").activate(player);
  carry(player, 2444).inventoryLeftClick(player);
  world.tickWorld(149);
  expect(player.currentStats.range).toBe(112);
  world.tickWorld(1);
  expect(player.currentStats.range).toBe(111);
});

test("karambwan shares the two-tick combo-food attack delay", () => {
  const { player, world } = fight();
  const food = new Karambwan();
  player.inventory[0] = food;
  player.currentStats.hitpoint = 40;
  player.attackDelay = 1;
  food.inventoryLeftClick(player);
  world.tickWorld(1);
  expect(player.currentStats.hitpoint).toBe(58);
  expect(player.attackDelay).toBe(2);
  expect(player.inventory[0]).toBeNull();
});

for (const { name, potion, stat, boosted, decayed } of [
  { name: "Saradomin brew", potion: SaradominBrew, stat: "defence", boosted: 120, decayed: 119 },
  { name: "Bastion potion", potion: BastionPotion, stat: "range", boosted: 112, decayed: 111 },
] as const) {
  test(`${name} alone decays on the shared 100-tick timer`, () => {
    const { player, world } = fight();
    const item = new potion();
    player.inventory[0] = item;
    item.inventoryLeftClick(player);
    world.tickWorld(1);
    expect(player.currentStats[stat]).toBe(boosted);
    world.tickWorld(99);
    expect(player.currentStats[stat]).toBe(decayed);
  });
}

test("guard: a super combat dose followed by a brew decays 120 Defence to 119", () => {
  const { player, world } = fight();
  carry(player, 12695).inventoryLeftClick(player);
  world.tickWorld(3);
  const brew = new SaradominBrew();
  player.inventory[1] = brew;
  brew.inventoryLeftClick(player);
  world.tickWorld(1);
  expect(player.currentStats.defence).toBe(120);
  world.tickWorld(96);
  expect(player.currentStats.defence).toBe(119);
});

for (const { id, stat, cap } of [
  { id: 2444, stat: "range", cap: 112 },
  { id: 12695, stat: "attack", cap: 118 },
  { id: 23685, stat: "strength", cap: 118 },
] as const) {
  test(`${id} cannot raise a boost above its cap with another dose`, () => {
    const { player, world } = fight();
    const potion = carry(player, id);
    potion.inventoryLeftClick(player);
    world.tickWorld(3);
    expect(player.currentStats[stat]).toBe(cap);
    potion.inventoryLeftClick(player);
    world.tickWorld(1);
    expect(player.currentStats[stat]).toBe(cap);
  });
}

for (const { activeTicks, activateAfter, decayAt } of [
  { activeTicks: 24, activateAfter: 76, decayAt: 100 },
  { activeTicks: 25, activateAfter: 75, decayAt: 150 },
]) {
  test(`Preserve with ${activeTicks} active ticks before decay drains at tick ${decayAt}`, () => {
    const { player, world } = fight();
    carry(player, 2444).inventoryLeftClick(player);
    world.tickWorld(activateAfter);
    player.prayerController.findPrayerByName("Preserve").activate(player);
    world.tickWorld(decayAt - activateAfter - 1);
    expect(player.currentStats.range).toBe(112);
    world.tickWorld(1);
    expect(player.currentStats.range).toBe(111);
  });
}

const { test } = require("node:test");
const assert = require("node:assert/strict");
require("tsx/cjs");
const { JSDOM } = require("jsdom");
const dom = new JSDOM("<!DOCTYPE html>", { url: "http://localhost" });
for (const key of [
  "window",
  "document",
  "Image",
  "localStorage",
  "HTMLElement",
  "HTMLCanvasElement",
  "navigator",
  "Audio",
]) {
  Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true });
}
const context = new Proxy(
  { measureText: () => ({ width: 0 }), canvas: { width: 800, height: 600 } },
  { get: (object, key) => object[key] ?? (() => {}) },
);
globalThis.OffscreenCanvas = class {
  getContext() {
    return context;
  }
};
dom.window.HTMLCanvasElement.prototype.getContext = () => context;
globalThis.fetch = async () => new Response(new ArrayBuffer(0));
for (const extension of [".png", ".jpg", ".glb", ".ogg", ".wav", ".mp3", ".svg", ".css"])
  require.extensions[extension] = (module, filename) => {
    module.exports = filename;
  };
const { SDK_ITEM_CATALOG } = require("../../src/content/SdkItemCatalog.ts");
const { AttackStyle, AttackStylesController } = require("../../src/sdk/AttackStylesController.ts");
const { Player } = require("../../src/sdk/Player.ts");
const { TestRegion } = require("../../src/sdk/testing/TestRegion.ts");
const { TestNpc } = require("../../src/sdk/testing/TestNpc.ts");
const { Random } = require("../../src/sdk/Random.ts");
const { Settings } = require("../../src/sdk/Settings.ts");
Settings.readFromStorage();

const cases = [
  [13576, "Dragon warhammer", [-4, -4, 95, -4, 0], [0, 0, 0, 0, 0], [85, 0, 0, 0], 6, 1, 50],
  [28035, "Dragon warhammer (cr)", [-4, -4, 95, -4, 0], [0, 0, 0, 0, 0], [85, 0, 0, 0], 6, 1, 50],
  [29589, "Emberlight", [63, 70, 0, 0, 0], [0, 3, 2, 5, 0], [13, 0, 0, 0], 4, 1, 50],
  [25739, "Sanguine scythe of Vitur", [70, 125, 30, -6, 0], [-2, 8, 10, 0, 0], [75, 0, 0, 0], 5, 1, null],
  [26374, "Zaryte crossbow", [0, 0, 0, 0, 110], [14, 14, 12, 15, 16], [0, 0, 0, 1], 5, 8, 75],
  [21902, "Dragon crossbow", [0, 0, 0, 0, 94], [0, 0, 0, 0, 0], [0, 0, 0, 0], 5, 7, 60],
  [29591, "Scorching bow", [0, 0, 0, 0, 124], [0, 0, 0, 0, 0], [0, 40, 0, 0], 4, 10, 25],
  [25975, "Lightbearer", [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0]],
  [24780, "Amulet of blood fury", [10, 10, 10, 10, 10], [15, 15, 15, 15, 15], [8, 0, 0, 5]],
  [28955, "Blessed Dizana's quiver", [0, 0, 0, 0, 18], [0, 0, 0, 0, 0], [0, 3, 0, 0]],
  [28338, "Soulreaper axe", [28, 134, 66, 0, 0], [0, 0, 0, 0, 0], [125, 0, 0, 0], 5, 1, 0],
  [33335, "Soulreaper axe (o)", [28, 134, 66, 0, 0], [0, 0, 0, 0, 0], [125, 0, 0, 0], 5, 1, 0],
  [34681, "Ascension crossbows", [0, 0, 0, 3, 34], [-7, -5, 0, 10, 0], [0, 0, 0, 0], 2, 6, null],
  [34715, "Obligator", [22, -8, 120, 0, 0], [0, 16, 0, 3, 8], [40, 0, 0, 3], 5, 1, null],
  [34684, "Ascension bolts", [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 53, 0, 0]],
  [34696, "Diamond ascension bolts (e)", [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 58, 0, 0]],
];
const stances = {
  13576: [
    ["ACCURATE", 6, 1],
    ["AGGRESSIVE (CRUSH)", 6, 1],
    ["DEFENSIVE", 6, 1],
  ],
  28035: [
    ["ACCURATE", 6, 1],
    ["AGGRESSIVE (CRUSH)", 6, 1],
    ["DEFENSIVE", 6, 1],
  ],
  29589: [
    ["ACCURATE", 4, 1],
    ["AGGRESSIVE (SLASH)", 4, 1],
    ["STAB", 4, 1],
    ["DEFENSIVE", 4, 1],
  ],
  25739: [
    ["REAP", 5, 1],
    ["AGGRESSIVE (SLASH)", 5, 1],
    ["AGGRESSIVE (CRUSH)", 5, 1],
    ["DEFENSIVE", 5, 1],
  ],
  26374: [
    ["ACCURATE", 6, 8],
    ["RAPID", 5, 8],
    ["LONGRANGE", 6, 10],
  ],
  21902: [
    ["ACCURATE", 6, 7],
    ["RAPID", 5, 7],
    ["LONGRANGE", 6, 9],
  ],
  29591: [
    ["ACCURATE", 5, 10],
    ["RAPID", 4, 10],
    ["LONGRANGE", 5, 10],
  ],
  28338: [
    ["ACCURATE", 5, 1],
    ["AGGRESSIVE (SLASH)", 5, 1],
    ["AGGRESSIVE (CRUSH)", 5, 1],
    ["DEFENSIVE", 5, 1],
  ],
  33335: [
    ["ACCURATE", 5, 1],
    ["AGGRESSIVE (SLASH)", 5, 1],
    ["AGGRESSIVE (CRUSH)", 5, 1],
    ["DEFENSIVE", 5, 1],
  ],
  34681: [
    ["ACCURATE", 3, 6],
    ["RAPID", 2, 6],
    ["LONGRANGE", 3, 8],
  ],
  34715: [
    ["ACCURATE", 5, 1],
    ["AGGRESSIVE (CRUSH)", 5, 1],
    ["SMASH", 3, 1],
  ],
};
const weights = {
  13576: 2,
  28035: 2,
  29589: 0.907,
  25739: 3.175,
  26374: 6.001,
  21902: 6,
  29591: 1.814,
  25975: 0.05,
  24780: 0.02,
  28955: 0.453,
  28338: 2.825,
  33335: 2.825,
  34681: 6,
  34715: 4.989,
  34684: 0,
  34696: 0,
};
function item(id) {
  const entry = SDK_ITEM_CATALOG.get(id);
  assert.ok(entry, `public catalog must construct wiki item ${id}`);
  return entry.build();
}
for (const [id, name, attack, defence, other, speed, range, cost] of cases) {
  test(`${name} exposes the wiki combat contract`, () => {
    AttackStylesController.controller = new AttackStylesController();
    const built = item(id);
    assert.equal(built.itemName.toLowerCase(), name.toLowerCase());
    assert.equal(built.weight, weights[id]);
    for (const [index, key] of ["stab", "slash", "crush", "magic", "range"].entries()) {
      assert.equal(built.bonuses.attack[key], attack[index], `attack ${key}`);
      assert.equal(built.bonuses.defence[key], defence[index], `defence ${key}`);
    }
    for (const [index, key] of ["meleeStrength", "rangedStrength", "magicDamage", "prayer"].entries())
      assert.equal(built.bonuses.other[key], other[index], key);
    if (speed !== undefined) {
      assert.equal(built.attackSpeed, speed);
      assert.equal(built.attackRange, range);
      assert.equal(built.hasSpecialAttack(), cost !== null);
      if (cost !== null) assert.equal(built.specialAttackDrain(), cost);
      assert.deepEqual(
        built.attackStyles().map(String),
        stances[id].map(([style]) => style),
      );
      assert.deepEqual(
        built.attackStyles().map((style) => {
          AttackStylesController.controller.setWeaponAttackStyle(built, style);
          return [String(style), built.attackSpeed, built.attackRange];
        }),
        stances[id],
      );
    }
  });
}
class MaxTarget extends TestNpc {
  incomingAttackRollModifiers() {
    return { guaranteedHit: true, maxDamage: true };
  }
}
class Demon extends MaxTarget {
  get demonbaneMultiplier() {
    return 1;
  }
}
function fight(id, demon = false) {
  AttackStylesController.controller = new AttackStylesController();
  const weapon = item(id);
  const region = new TestRegion(24, 24);
  const player = new Player(region, { x: 4, y: 7 });
  const target = new (demon ? Demon : MaxTarget)(region, { x: 7, y: 7 }, {});
  target.stats.hitpoint = 2000;
  target.currentStats.hitpoint = 2000;
  target.stats.defence = 250;
  target.currentStats.defence = 250;
  region.addPlayer(player);
  region.addMob(target);
  player.equipment.weapon = weapon;
  player.equipment.ammo = item(9242);
  player.equipmentChanged();
  return { region, player, target, weapon };
}
function land(target, ticks = 1) {
  for (let i = 0; i < ticks; i++) target.processIncomingAttacks();
}

test("Smash deals 150 percent damage and drains 30 percent of current Defence on landing", () => {
  const { player, target, weapon } = fight(13576);
  weapon.attack(player, target);
  const normal = weapon.damage;
  target.incomingProjectiles.length = 0;
  weapon.specialAttack(player, target);
  assert.equal(weapon.damage, Math.floor(normal * 1.5));
  assert.equal(target.currentStats.defence, 250);
  land(target);
  assert.equal(target.currentStats.defence, 175);
  weapon.specialAttack(player, target);
  land(target);
  assert.equal(target.currentStats.defence, 123);
});
test("Weaken drains base stats by 15 percent plus one on demons and 5 percent plus one otherwise", () => {
  for (const demon of [false, true]) {
    const { player, target, weapon } = fight(29589, demon);
    const before = target.currentStats.attack;
    weapon.specialAttack(player, target);
    land(target);
    assert.equal(target.currentStats.defence, demon ? 212 : 237);
    assert.equal(target.currentStats.attack, before - (demon ? 22 : 8));
    assert.equal(target.currentStats.strength, demon ? 152 : 170);
  }
});
test("Emberlight applies 70 percent demonbane damage only to demons", () => {
  const normal = fight(29589);
  normal.weapon.attack(normal.player, normal.target);
  const demon = fight(29589, true);
  demon.weapon.attack(demon.player, demon.target);
  assert.equal(demon.weapon.damage, Math.floor(normal.weapon.damage * 1.7));
});
test("Evoke guarantees the enhanced ruby effect for 22 percent HP capped at 110 and costs 75 energy", () => {
  const { player, target, weapon } = fight(26374);
  weapon.specialAttack(player, target);
  assert.equal(weapon.damage, 110);
  assert.equal(weapon.specialAttackDrain(), 75);
  land(player, 6);
  assert.equal(player.currentStats.hitpoint, 90);
});
test("ruby procs cap at 100 and diamond procs bypass defence with 115 or 126 percent max damage", () => {
  const previous = Random.randomFn;
  try {
    Random.setRandom(() => 0);
    const ruby = fight(21902);
    ruby.weapon.attack(ruby.player, ruby.target);
    assert.equal(ruby.weapon.damage, 100);
    for (const [id, factor] of [
      [21902, 1.15],
      [26374, 1.26],
    ]) {
      const f = fight(id);
      f.player.equipment.ammo = item(9243);
      f.player.equipmentChanged();
      Random.setRandom(() => 0.9);
      f.weapon.attack(f.player, f.target);
      const normal = f.weapon.damage;
      Random.setRandom(() => 0);
      f.weapon.attack(f.player, f.target);
      assert.equal(f.weapon.damage, Math.floor(normal * factor));
    }
  } finally {
    Random.setRandom(previous);
  }
});
test("Annihilate deals 120 percent primary damage and excludes enchanted bolt effects", () => {
  const previous = Random.randomFn;
  try {
    const f = fight(21902);
    Random.setRandom(() => 0.9);
    f.weapon.attack(f.player, f.target);
    const normal = f.weapon.damage;
    Random.setRandom(() => 0);
    f.weapon.specialAttack(f.player, f.target);
    assert.equal(f.weapon.damage, Math.floor(normal * 1.2));
  } finally {
    Random.setRandom(previous);
  }
});
test("Scorching shackles requires a demon, binds for 20 ticks and burns five times four ticks apart", () => {
  const normal = fight(29591);
  assert.equal(normal.weapon.specialAttack(normal.player, normal.target), false);
  const f = fight(29591, true);
  f.player.equipment.ammo = item(11212);
  f.player.equipmentChanged();
  f.weapon.specialAttack(f.player, f.target);
  assert.equal(f.target.frozen, 20);
  const burns = f.target.incomingProjectiles.filter((p) => p.attackStyle === "burn");
  assert.deepEqual(
    burns.map((p) => [p.damage, p.remainingDelay]),
    [
      [1, 1],
      [1, 5],
      [1, 9],
      [1, 13],
      [1, 17],
    ],
  );
  const plain = fight(29591);
  plain.player.equipment.ammo = item(11212);
  plain.player.equipmentChanged();
  plain.weapon.attack(plain.player, plain.target);
  assert.equal(f.weapon.damage, Math.floor(plain.weapon.damage * 1.3));
});
test("Lightbearer restores ten energy every 25 ticks and resets the timer on removal", () => {
  const { player } = fight(13576);
  player.currentStats.specialAttack = 0;
  item(25975).assignToPlayer(player);
  for (let i = 0; i < 24; i++) player.regenTimer.specRegen();
  assert.equal(player.currentStats.specialAttack, 0);
  player.regenTimer.specRegen();
  assert.equal(player.currentStats.specialAttack, 10);
  player.equipment.ring.unassignToPlayer(player);
  for (let i = 0; i < 49; i++) player.regenTimer.specRegen();
  assert.equal(player.currentStats.specialAttack, 10);
  player.regenTimer.specRegen();
  assert.equal(player.currentStats.specialAttack, 20);
});
test("blood fury heals 30 percent at a 20 percent melee proc chance and never heals ranged hits", () => {
  const previous = Random.randomFn;
  try {
    const f = fight(13576);
    f.player.currentStats.hitpoint = 50;
    f.player.equipment.necklace = item(24780);
    Random.setRandom(() => 0.199);
    f.weapon.attack(f.player, f.target);
    const damage = f.weapon.damage;
    land(f.target);
    assert.equal(f.player.currentStats.hitpoint, 50 + Math.floor(damage * 0.3));
    f.player.currentStats.hitpoint = 50;
    Random.setRandom(() => 0.2);
    f.weapon.attack(f.player, f.target);
    land(f.target);
    assert.equal(f.player.currentStats.hitpoint, 50);
    const ranged = fight(26374);
    ranged.player.currentStats.hitpoint = 50;
    ranged.player.equipment.necklace = item(24780);
    Random.setRandom(() => 0.9);
    ranged.weapon.attack(ranged.player, ranged.target);
    Random.setRandom(() => 0);
    land(ranged.target, 6);
    assert.equal(ranged.player.currentStats.hitpoint, 50);
  } finally {
    Random.setRandom(previous);
  }
});
test("blessed quiver adds ten accuracy and one strength for arrows and bolts, but not a blowpipe", () => {
  const quiver = item(28955);
  for (const id of [26374, 21902, 29591]) {
    quiver.updateBonuses([item(id), item(id === 29591 ? 11212 : 9242)]);
    assert.equal(quiver.bonuses.attack.range, 28);
    assert.equal(quiver.bonuses.other.rangedStrength, 4);
  }
  quiver.updateBonuses([item(12926)]);
  assert.equal(quiver.bonuses.attack.range, 18);
  assert.equal(quiver.bonuses.other.rangedStrength, 3);
});

test("Evoke doubles accuracy and Emberlight boosts accuracy only against demons", () => {
  class OrdinaryTarget extends TestNpc {}
  const previous = Random.randomFn;
  try {
    for (const special of [false, true]) {
      const f = fight(26374);
      const target = new OrdinaryTarget(f.region, { x: 7, y: 7 }, {});
      target.currentStats.defence = 250;
      target.currentStats.hitpoint = 2000;
      Random.setRandom(() => 0.65);
      if (special) f.weapon.specialAttack(f.player, target);
      else f.weapon.attack(f.player, target);
      assert.equal(f.weapon.damage, special ? 110 : 0);
    }
    for (const demon of [false, true]) {
      const f = fight(29589);
      class Target extends OrdinaryTarget {
        get demonbaneMultiplier() {
          return demon ? 1 : 0;
        }
      }
      const target = new Target(f.region, { x: 7, y: 7 }, {});
      target.currentStats.defence = 250;
      Random.setRandom(() => 0.55);
      f.weapon.attack(f.player, target);
      assert.equal(f.weapon.lastHitHit, demon);
    }
  } finally {
    Random.setRandom(previous);
  }
});
test("sanguine scythe retains the charged scythe three hit damage split", () => {
  const f = fight(25739);
  f.weapon.attack(f.player, f.target);
  assert.deepEqual(
    f.target.incomingProjectiles.map((p) => p.damage),
    [24, 12, 6],
  );
});
test("Smash cannot drain Defence when the encounter rejects its damage", () => {
  const f = fight(13576);
  f.weapon.specialAttack(f.player, f.target);
  f.target.incomingProjectiles[0].damage = 0;
  land(f.target);
  assert.equal(f.target.currentStats.defence, 250);
});
test("Lightbearer preserves an imminent natural restore and caps energy at 100", () => {
  const { player } = fight(13576);
  player.currentStats.specialAttack = 95;
  player.regenTimer.spec = 1;
  item(25975).assignToPlayer(player);
  player.regenTimer.specRegen();
  assert.equal(player.currentStats.specialAttack, 100);
  assert.equal(player.regenTimer.spec, 25);
});
test("Annihilate hits nearby enemies with successively reduced damage and leaves distant targets alone", () => {
  const f = fight(21902);
  const near = new MaxTarget(f.region, { x: 8, y: 7 }, {});
  const far = new MaxTarget(f.region, { x: 12, y: 7 }, {});
  f.region.addMob(near);
  f.region.addMob(far);
  f.weapon.specialAttack(f.player, f.target);
  assert.equal(near.incomingProjectiles[0].damage, Math.floor(f.weapon.damage * 0.8));
  assert.equal(far.incomingProjectiles.length, 0);
});

test("Annihilate rolls one through the ordinary maximum before its damage bonus", () => {
  const f = fight(21902);
  class Target extends TestNpc {
    incomingAttackRollModifiers() {
      return { guaranteedHit: true };
    }
  }
  const target = new Target(f.region, { x: 7, y: 7 }, {});
  const previous = Random.randomFn;
  try {
    Random.setRandom(() => 0.5);
    f.weapon.specialAttack(f.player, target);
    assert.equal(f.weapon.damage, 18);
  } finally {
    Random.setRandom(previous);
  }
});

test("a blood fury heal never lowers Hitpoints boosted above base by a Saradomin brew", () => {
  const { player, target, weapon } = fight(13576);
  player.equipment.necklace = item(24780);
  player.stats.hitpoint = 99;
  player.currentStats.hitpoint = 110;
  const previous = Random.randomFn;
  try {
    Random.setRandom(() => 0);
    weapon.attack(player, target);
    assert.ok(weapon.damage > 0, "the hammer hit");
    for (let i = 0; i < 4; i++) target.processIncomingAttacks();
    assert.equal(target.incomingProjectiles.length, 0, "the hit landed");
    assert.equal(player.currentStats.hitpoint, 110, "boosted Hitpoints after a blood fury proc");
  } finally {
    Random.setRandom(previous);
  }
});

for (const id of [21902, 26374]) {
  test(`crossbow ${id} uses ruby bolts from a carried quiver while arrows stay worn`, () => {
    const { player, target, weapon } = fight(id);
    const { BlessedDizanasQuiver } = require("../../src/content/equipment/BlessedDizanasQuiver.ts");
    player.equipment.ammo = item(11212);
    player.inventory[0] = new BlessedDizanasQuiver(item(9242));
    player.equipmentChanged();
    player.setAggro(target);
    const previous = Random.randomFn;
    try {
      Random.setRandom(() => 0);
      assert.equal(player.attack(), true);
      assert.equal(weapon.damage, id === 26374 ? 110 : 100);
      player.useSpecialAttack = true;
      assert.equal(player.attack(), true);
      assert.equal(player.currentStats.specialAttack, id === 26374 ? 25 : 40);
      assert.equal(player.equipment.ammo.itemId, 11212);
    } finally {
      Random.setRandom(previous);
    }
  });
}

test("a worn blessed quiver supplies ruby dragon bolts and their charged bonuses", () => {
  const { player, target, weapon } = fight(26374);
  const { BlessedDizanasQuiver } = require("../../src/content/equipment/BlessedDizanasQuiver.ts");
  const quiver = new BlessedDizanasQuiver(item(21944));
  player.equipment.ammo = item(11212);
  quiver.assignToPlayer(player);
  player.equipmentChanged();
  assert.equal(player.bonuses.attack.range, 138);
  assert.equal(player.bonuses.other.rangedStrength, 126);
  assert.equal(weapon.attack(player, target), true);
  player.equipment.ammo = item(9243);
  player.equipmentChanged();
  assert.equal(player.ammunitionFor(weapon).itemId, 9243);
  assert.equal(player.bonuses.other.rangedStrength, 109);
});

test("guard: rune crossbow retains its base ruby rate, arbitrary ammo and self-hit timing", () => {
  const previous = Random.randomFn;
  try {
    const ruby = fight(9185);
    Random.setRandom(() => 0.065);
    assert.equal(ruby.weapon.attack(ruby.player, ruby.target), true);
    assert.equal(ruby.weapon.damage, 100);
    assert.equal(ruby.player.currentStats.hitpoint, 99);
    ruby.player.processIncomingAttacks();
    assert.equal(ruby.player.currentStats.hitpoint, 90);
    const arrows = fight(9185);
    arrows.player.equipment.ammo = item(11212);
    arrows.player.equipmentChanged();
    assert.equal(arrows.weapon.attack(arrows.player, arrows.target), true);
    assert.equal(arrows.weapon.damage, 14);
  } finally {
    Random.setRandom(previous);
  }
});

test("guard: rune crossbow retains its base eleven percent diamond proc", () => {
  const { player, region, weapon } = fight(9185);
  class ArmouredTarget extends TestNpc {
    incomingAttackRollModifiers() {
      return { maxDamage: true };
    }
  }
  const target = new ArmouredTarget(region, { x: 7, y: 7 }, {});
  target.currentStats.defence = 1000000000;
  player.equipment.ammo = item(9243);
  player.equipmentChanged();
  const previous = Random.randomFn;
  try {
    Random.setRandom(() => 0.105);
    assert.equal(weapon.attack(player, target), true);
    assert.equal(weapon.damage, 32);
  } finally {
    Random.setRandom(previous);
  }
});

function withRandom(values, body) {
  const previous = Random.randomFn;
  const queue = Array.isArray(values) ? [...values] : null;
  Random.setRandom(() => (queue ? (queue.length > 1 ? queue.shift() : queue[0]) : values));
  try {
    return body();
  } finally {
    Random.setRandom(previous);
  }
}
function wield(id, ammo, demon = false) {
  const f = fight(id, demon);
  f.player.equipment.ammo = ammo === null ? null : item(ammo);
  f.player.equipmentChanged();
  f.player.setAggro(f.target);
  return f;
}
function recordAnimations(unit) {
  const played = [];
  unit.setAnimationListener({ animationChanged: (id) => played.push(id), spotAnimChanged: () => {} });
  return played;
}
function landAll(target) {
  for (let i = 0; i < 12 && target.incomingProjectiles.length; i++) target.processIncomingAttacks();
}

test("soul stacks add six percent Strength per earlier axe attack, hit or miss, up to five", () => {
  const { player, target, weapon } = fight(28338);
  assert.equal(player.currentStats.strength, 99, "base Strength");
  const hits = [];
  for (let i = 0; i < 7; i++) {
    weapon.attack(player, target);
    hits.push(weapon.damage);
  }
  assert.deepEqual(hits, [32, 34, 36, 38, 39, 41, 41]);
  class Dodger extends TestNpc {
    incomingAttackRollModifiers() {
      return {};
    }
  }
  const missed = fight(28338);
  const dodger = new Dodger(missed.region, { x: 7, y: 7 }, {});
  dodger.currentStats.defence = 1000000;
  withRandom(0.99, () => {
    for (let i = 0; i < 5; i++) missed.weapon.attack(missed.player, dodger);
  });
  missed.weapon.attack(missed.player, missed.target);
  assert.equal(missed.weapon.damage, 41, "five misses still built five stacks");
});

test("soul stacks decay one per 50 ticks without an axe attack", () => {
  const { player, target, weapon, region } = fight(28338);
  region.world = { globalTickCounter: 0 };
  for (let i = 0; i < 5; i++) weapon.attack(player, target);
  region.world.globalTickCounter = 100;
  weapon.attack(player, target);
  assert.equal(weapon.damage, 38, "three stacks left after 100 idle ticks");
});

test("Behead costs no energy, consumes every stack, and scales accuracy, max and min hit per stack", () => {
  const max = fight(28338);
  for (let i = 0; i < 5; i++) max.weapon.attack(max.player, max.target);
  max.player.useSpecialAttack = true;
  max.player.setAggro(max.target);
  assert.equal(max.player.attack(), true);
  assert.equal(max.weapon.damage, 41, "32 base max hit raised 30 percent");
  assert.equal(max.player.currentStats.specialAttack, 100);
  max.weapon.attack(max.player, max.target);
  assert.equal(max.weapon.damage, 32, "no stacks left after Behead");

  class Sure extends TestNpc {
    incomingAttackRollModifiers() {
      return { guaranteedHit: true };
    }
  }
  const low = fight(28338);
  const sure = new Sure(low.region, { x: 7, y: 7 }, {});
  sure.currentStats.hitpoint = 2000;
  for (let i = 0; i < 5; i++) low.weapon.attack(low.player, low.target);
  withRandom(0, () => low.weapon.specialAttack(low.player, sure));
  assert.equal(low.weapon.damage, 12, "minimum hit of 30 percent of 41");

  class Ordinary extends TestNpc {}
  for (const special of [false, true]) {
    const f = fight(28338);
    const target = new Ordinary(f.region, { x: 7, y: 7 }, {});
    target.currentStats.defence = 250;
    target.currentStats.hitpoint = 2000;
    withRandom(0.7, () => {
      for (let i = 0; i < 5; i++) f.weapon.attack(f.player, target);
      if (special) f.weapon.specialAttack(f.player, target);
      else f.weapon.attack(f.player, target);
    });
    assert.equal(f.weapon.lastHitHit, special, "a 0.7 roll misses at 61 percent and hits at 76 percent");
  }
});

test("the Obligator's charged thrust keeps the best of two rolls, three past a softer stab or slash, plus 40 percent on a 3x3", () => {
  class Sure extends TestNpc {
    incomingAttackRollModifiers() {
      return { guaranteedHit: true };
    }
  }
  class SlashSoft extends Sure {
    get bonuses() {
      const bonuses = super.bonuses;
      return { ...bonuses, defence: { ...bonuses.defence, slash: 10 } };
    }
  }
  const run = (Target, rolls, style) => {
    const f = fight(34715);
    if (style) AttackStylesController.controller.setWeaponAttackStyle(f.weapon, style);
    const target = new Target(f.region, { x: 7, y: 7 }, {});
    target.currentStats.hitpoint = 2000;
    withRandom(rolls, () => f.weapon.attack(f.player, target));
    return f.weapon.damage;
  };
  assert.equal(run(Sure, [0.1, 0.9]), 23, "best of 1 and 17, times 1.4");
  assert.equal(run(Sure, [0.1, 0.2, 0.95]), 4, "two rolls of 1 and 3 when crush is the softest");
  assert.equal(run(SlashSoft, [0.1, 0.2, 0.95]), 25, "a third roll of 18 when slash defence beats crush");
  assert.equal(run(Sure, [0.9, 0.1], AttackStyle.SMASH), 17, "smash makes one plain roll");
});

test("ascension crossbows fire only ascension bolts, alternate hands, and halve the diamond proc chance", () => {
  assert.equal(wield(34681, 9242).player.attack(), false, "ruby bolts (e) do not fit");
  const f = wield(34681, 34684);
  const played = recordAnimations(f.player);
  for (let i = 0; i < 2; i++) {
    assert.equal(f.player.attack(), true);
    f.player.didAttack();
  }
  assert.deepEqual(played, [15114, 15116]);
  assert.equal(f.target.incomingProjectiles[0].options.visuals.spotAnim.id, 4437);
  for (const [roll, procs] of [
    [0.04, true],
    [0.06, false],
  ]) {
    const d = wield(34681, 34696);
    withRandom(roll, () => d.player.attack());
    assert.equal(d.target.incomingProjectiles[0].options.visuals.spotAnim.id, 4439);
    landAll(d.target);
    assert.deepEqual(
      d.target.spotAnims.map(({ id }) => id),
      procs ? [758] : [],
    );
  }
});

test("enchanted bolts fly their own bolt and show their effect on the target only when it procs", () => {
  for (const [weapon, ammo, roll, travel, effect] of [
    [21902, 9242, 0, 27, 754],
    [21902, 9243, 0, 27, 758],
    [21902, 9242, 0.9, 27, null],
    [26374, 21944, 0.9, 1468, null],
  ]) {
    const f = wield(weapon, ammo);
    withRandom(roll, () => f.player.attack());
    const projectile = f.target.incomingProjectiles[0];
    assert.equal(projectile.options.visuals.hidden, undefined, `${weapon} bolt is drawn`);
    assert.equal(projectile.options.visuals.spotAnim.id, travel);
    landAll(f.target);
    assert.deepEqual(
      f.target.spotAnims.map(({ id }) => id),
      effect === null ? [] : [effect],
    );
  }
});

const SPECIALS = [
  [26374, 21944, false, 75, { animation: 9168, cast: null, projectile: 1995, impact: 754 }],
  [21902, 9242, false, 60, { animation: 7552, cast: null, projectile: 27, impact: null }],
  [13576, null, false, 50, { animation: 1378, cast: 1292, projectile: null, impact: null }],
  [28338, null, false, 0, { animation: 10173, cast: 2430, projectile: null, impact: null }],
  [33335, null, false, 0, { animation: 10173, cast: 4008, projectile: null, impact: null }],
  [29589, null, true, 50, { animation: 11138, cast: null, projectile: null, impact: 2810 }],
  [29591, 11212, true, 25, { animation: 11133, cast: 2806, projectile: 2807, impact: 2908 }],
  [12926, null, false, 50, { animation: 5061, cast: null, projectile: 1043, impact: null }],
];
for (const [id, ammo, demon, cost, graphics] of SPECIALS) {
  test(`special attack of ${id} spends ${cost} energy, lands, and plays its own cache graphics`, () => {
    const f = wield(id, ammo, demon);
    const played = recordAnimations(f.player);
    f.player.useSpecialAttack = true;
    withRandom(0, () => {
      assert.equal(f.player.attack(), true, "the special fired");
      f.player.didAttack();
    });
    assert.equal(f.player.currentStats.specialAttack, 100 - cost);
    assert.equal(played.at(-1), graphics.animation);
    assert.deepEqual(
      f.player.spotAnims.map(({ id: spotAnim }) => spotAnim),
      graphics.cast === null ? [] : [graphics.cast],
    );
    const [projectile] = f.target.incomingProjectiles;
    if (graphics.projectile === null) assert.equal(projectile.options.visuals.hidden, true);
    else assert.equal(projectile.options.visuals.spotAnim.id, graphics.projectile);
    const before = f.target.currentStats.hitpoint;
    withRandom(0, () => landAll(f.target));
    assert.ok(f.target.currentStats.hitpoint < before, "the special's hit landed");
    assert.ok(
      f.target.spotAnims.map(({ id: spotAnim }) => spotAnim).includes(graphics.impact) || graphics.impact === null,
      `impact ${graphics.impact} shown on the target`,
    );
    if (graphics.impact === null)
      assert.deepEqual(
        f.target.spotAnims.map(({ id: spotAnim }) => spotAnim),
        [],
      );
  });
}

test("the Scorching bow fires and specials with worn seeking dragon arrows", () => {
  const f = wield(29591, 33595, true);
  assert.equal(f.player.equipment.ammo.itemName, "Seeking dragon arrow");
  assert.equal(f.player.attack(), true, "an ordinary shot");
  f.player.useSpecialAttack = true;
  assert.equal(f.player.attack(), true, "Burning Shackles");
  assert.equal(f.player.currentStats.specialAttack, 75);
});

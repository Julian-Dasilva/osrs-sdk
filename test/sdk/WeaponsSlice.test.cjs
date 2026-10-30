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
// Node supplies combat, while the browser's canvas and asset transport are inert.
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
];
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
      assert.ok(built.attackStyles().includes(built.defaultStyle()));
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

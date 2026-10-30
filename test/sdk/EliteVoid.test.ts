import { SDK_ITEM_CATALOG, ScytheOfVitur, Blowpipe } from "../../src/content";
import { Equipment } from "../../src/sdk/Equipment";
import { Player } from "../../src/sdk/Player";
import { TestRegion } from "../../src/sdk/testing/TestRegion";
import { TestNpc } from "../../src/sdk/testing/TestNpc";
import { AttackBonuses } from "../../src/sdk/gear/Weapon";
import { AttackStyle, AttackStylesController } from "../../src/sdk/AttackStylesController";

function setup(helmet: number) {
  const region = new TestRegion(10, 10);
  const player = new Player(region, { x: 2, y: 2 });
  const target = new TestNpc(region, { x: 3, y: 2 }, {});
  for (const id of [helmet, 13072, 13073, 8842]) {
    const item = SDK_ITEM_CATALOG.get(id)?.build();
    if (!(item instanceof Equipment)) throw new Error(`Missing equipment ${id}`);
    item.assignToPlayer(player);
  }
  player.equipmentChanged();
  return { player, target };
}

const bonuses = (): AttackBonuses => ({
  effectivePrayers: {},
  styleBonus: 0,
  voidMultiplier: 1,
  gearMeleeMultiplier: 1,
  gearRangeMultiplier: 1,
  overallMultiplier: 1,
  attackStyle: "slash",
});

test("elite melee void multiplies attack and strength by 1.1 and loses both when a piece is removed", () => {
  const { player, target } = setup(11665);
  const weapon = new ScytheOfVitur();
  weapon.assignToPlayer(player);
  AttackStylesController.controller.setWeaponAttackStyle(weapon, AttackStyle.AGGRESSIVESLASH);
  player.equipmentChanged();
  expect(weapon._attackRoll(player, target, bonuses())).toBe(22113);
  expect(weapon._maxHit(player, target, bonuses())).toBe(26);
  player.equipment.gloves = null;
  player.equipmentChanged();
  expect(weapon._attackRoll(player, target, bonuses())).toBe(20223);
  expect(weapon._maxHit(player, target, bonuses())).toBe(24);
});

test("elite ranged void uses 1.1 accuracy and 1.125 damage with effective-level rounding", () => {
  const { player, target } = setup(11664);
  player.currentStats.range = 91;
  const weapon = new Blowpipe();
  weapon.assignToPlayer(player);
  player.equipmentChanged();
  expect(weapon._attackRoll(player, target, bonuses())).toBe(10152);
  expect(weapon._maxHit(player, target, bonuses())).toBe(21);
  player.equipment.chest = null;
  player.equipmentChanged();
  expect(weapon._attackRoll(player, target, bonuses())).toBe(9306);
  expect(weapon._maxHit(player, target, bonuses())).toBe(18);
});

test("guard: a void helmet of the wrong style grants no bonus", () => {
  const { player, target } = setup(11665);
  player.currentStats.range = 91;
  const weapon = new Blowpipe();
  weapon.assignToPlayer(player);
  player.equipmentChanged();
  expect(weapon._attackRoll(player, target, bonuses())).toBe(9306);
  expect(weapon._maxHit(player, target, bonuses())).toBe(18);
});

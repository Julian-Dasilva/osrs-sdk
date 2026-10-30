import { SEMANTIC_POSE_MAP } from "../../src/assets/CacheAssets";
import { ZombieAxe } from "../../src/content/weapons/ZombieAxe";
import { AttackStyle, AttackStylesController, AttackStyleTypes } from "../../src/sdk/AttackStylesController";
import { MeleeWeapon } from "../../src/sdk/weapons/MeleeWeapon";
import { Unit } from "../../src/sdk/Unit";
import { Player } from "../../src/sdk/Player";
import { TestRegion } from "../../src/sdk/testing/TestRegion";

describe("Zombie axe", () => {
  beforeEach(() => {
    AttackStylesController.controller = new AttackStylesController();
  });

  test.each([
    [AttackStyle.ACCURATE, "slash"],
    [AttackStyle.AGGRESSIVESLASH, "slash"],
    [AttackStyle.AGGRESSIVECRUSH, "crush"],
    [AttackStyle.DEFENSIVE, "slash"],
  ])("routes %s through the correct damage type", (style, damageType) => {
    const weapon = new ZombieAxe();
    AttackStylesController.controller.setWeaponAttackStyle(weapon, style as AttackStyle);
    const attack = jest.spyOn(MeleeWeapon.prototype, "attack").mockReturnValue(true);
    try {
      weapon.attack({} as Unit, {} as Unit);
      expect(attack.mock.calls[0][2].attackStyle).toBe(damageType);
      expect(SEMANTIC_POSE_MAP[weapon.attackAnimationId].id).toBe(damageType === "crush" ? 3852 : 7004);
      expect(AttackStylesController.attackStyleImageMap[AttackStyleTypes.AXE][style]).toBeDefined();
    } finally {
      attack.mockRestore();
    }
  });

  test("Chop grants accuracy and Attack XP; Block grants defence", () => {
    const weapon = new ZombieAxe();
    const player = new Player(new TestRegion(10, 10), { x: 2, y: 2 });
    const bonuses = { effectivePrayers: {}, voidMultiplier: 1 };
    AttackStylesController.controller.setWeaponAttackStyle(weapon, AttackStyle.ACCURATE);
    expect(weapon._attackLevel(player, player, bonuses)).toBe(110);
    expect(weapon._defenceLevel(player, player, bonuses)).toBe(107);
    const xp = AttackStylesController.controller.getWeaponXpDrops(AttackStyle.ACCURATE, 10, 1, AttackStyleTypes.AXE);
    expect(xp[0]).toMatchObject({ skill: "attack" });
    AttackStylesController.controller.setWeaponAttackStyle(weapon, AttackStyle.DEFENSIVE);
    expect(weapon._attackLevel(player, player, bonuses)).toBe(107);
    expect(weapon._defenceLevel(player, player, bonuses)).toBe(110);
  });
});

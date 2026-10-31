import InventoryImage from "../../assets/images/equipment/Scorching_bow.png";
import { CACHE_ASSETS } from "../../assets/CacheAssets";
import { AttackStyle, AttackStyleTypes } from "../../sdk/AttackStylesController";
import { ItemName } from "../../sdk/ItemName";
import { Unit } from "../../sdk/Unit";
import { AttackBonuses, AttackGraphics } from "../../sdk/gear/Weapon";
import { PlayerAnimationIndices } from "../../sdk/rendering/GLTFAnimationConstants";
import { RangedWeapon } from "../../sdk/weapons/RangedWeapon";
import { ArcProjectileMotionInterpolator, Projectile, ProjectileOptions } from "../../sdk/weapons/Projectile";
import { Assets } from "../../sdk/utils/Assets";
import { weaponBonuses } from "./WeaponValues";

export class ScorchingBow extends RangedWeapon {
  constructor() {
    super({
      visuals: {
        modelScale: 1 / 128,
        startCycleOffset: 30,
        hitEarlyCycleOffset: 30,
        verticalOffset: -0.75,
        motionInterpolator: new ArcProjectileMotionInterpolator(1),
      },
    });
    this.bonuses = weaponBonuses("scorchingBow");
  }
  private readonly ProjectileModel = Assets.getAssetUrl("models/dragon_arrow.glb");
  override get projectileModel(): string {
    return this.ProjectileModel;
  }
  override get cacheItemId(): number {
    return CACHE_ASSETS.items.scorchingBow.id;
  }
  override get itemName(): ItemName {
    return ItemName.SCORCHING_BOW;
  }
  override get inventoryImage(): string {
    return InventoryImage;
  }
  override get weight(): number {
    return 1.814;
  }
  override get isTwoHander(): boolean {
    return true;
  }
  override get attackSpeed(): number {
    return this.attackStyle() === AttackStyle.RAPID ? 4 : 5;
  }
  override get attackRange(): number {
    return 10;
  }
  override get attackAnimationId(): number {
    return PlayerAnimationIndices.FireBow;
  }
  override attackStyles(): AttackStyle[] {
    return [AttackStyle.ACCURATE, AttackStyle.RAPID, AttackStyle.LONGRANGE];
  }
  override attackStyleCategory(): AttackStyleTypes {
    return AttackStyleTypes.BOW;
  }
  override defaultStyle(): AttackStyle {
    return AttackStyle.RAPID;
  }
  override compatibleAmmo(): ItemName[] {
    return [ItemName.DRAGON_ARROWS, ItemName.SEEKING_DRAGON_ARROWS];
  }
  override get specialAttackGraphics(): AttackGraphics | null {
    return {
      animation: CACHE_ASSETS.playerAnimations.scorchingBowSpecial.id,
      cast: CACHE_ASSETS.spotAnims.scorchingBowSpecial.id,
      projectile: CACHE_ASSETS.spotAnims.scorchingBowSpecialProjectile.id,
      impact: CACHE_ASSETS.spotAnims.scorchingBowSpecialImpact.id,
    };
  }
  override hasSpecialAttack(): boolean {
    return true;
  }
  override specialAttackDrain(): number {
    return 25;
  }
  override attack(from: Unit, to: Unit, bonuses: AttackBonuses = {}, options: ProjectileOptions = {}): boolean {
    if (!from.equipment.ammo || !this.compatibleAmmo().includes(from.equipment.ammo.itemName)) return false;
    bonuses.attackStyle = "range";
    bonuses.isAccurate = this.attackStyle() === AttackStyle.ACCURATE;
    return super.attack(from, to, bonuses, options);
  }
  override _accuracyMultiplier(_from: Unit, to: Unit): number {
    return 1 + 0.3 * to.demonbaneMultiplier;
  }
  override _damageMultiplier(_from: Unit, to: Unit): number {
    return 1 + 0.3 * to.demonbaneMultiplier;
  }
  override specialAttack(from: Unit, to: Unit, bonuses: AttackBonuses = {}, options: ProjectileOptions = {}): boolean {
    if (to.demonbaneMultiplier <= 0) return false;
    bonuses.isSpecialAttack = true;
    if (!this.attack(from, to, bonuses, options)) return false;
    to.freeze(20);
    for (let hit = 0; hit < 5; hit++) {
      to.addProjectile(new Projectile(this, 1, from, to, "burn", { setDelay: 1 + hit * 4, visuals: { hidden: true } }));
    }
    return true;
  }
}

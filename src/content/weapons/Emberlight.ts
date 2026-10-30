import InventoryImage from "../../assets/images/equipment/Emberlight.png";
import { CACHE_ASSETS } from "../../assets/CacheAssets";
import { AttackStyle, AttackStyleTypes } from "../../sdk/AttackStylesController";
import { ItemName } from "../../sdk/ItemName";
import { Unit } from "../../sdk/Unit";
import { AttackBonuses } from "../../sdk/gear/Weapon";
import { PlayerAnimationIndices } from "../../sdk/rendering/GLTFAnimationConstants";
import { MeleeWeapon } from "../../sdk/weapons/MeleeWeapon";
import { ProjectileOptions } from "../../sdk/weapons/Projectile";
import { WeakenProjectile } from "./StatDrainProjectile";
import { weaponBonuses } from "./WeaponValues";

export class Emberlight extends MeleeWeapon {
  constructor() {
    super();
    this.bonuses = weaponBonuses("emberlight");
  }
  override get cacheItemId(): number {
    return CACHE_ASSETS.items.emberlight.id;
  }
  override get weight(): number {
    return 0.907;
  }
  override get itemName(): ItemName {
    return ItemName.EMBERLIGHT;
  }
  override get inventoryImage(): string {
    return InventoryImage;
  }
  override get attackSpeed(): number {
    return 4;
  }
  override get attackRange(): number {
    return 1;
  }
  override get attackAnimationId(): number {
    return PlayerAnimationIndices.SwordSlash;
  }
  override attackStyles(): AttackStyle[] {
    return [AttackStyle.ACCURATE, AttackStyle.AGGRESSIVESLASH, AttackStyle.STAB, AttackStyle.DEFENSIVE];
  }
  override attackStyleCategory(): AttackStyleTypes {
    return AttackStyleTypes.SLASHSWORD;
  }
  override defaultStyle(): AttackStyle {
    return AttackStyle.AGGRESSIVESLASH;
  }
  override hasSpecialAttack(): boolean {
    return true;
  }
  override attack(from: Unit, to: Unit, bonuses: AttackBonuses = {}, options: ProjectileOptions = {}): boolean {
    bonuses.attackStyle = bonuses.isSpecialAttack || this.attackStyle() === AttackStyle.STAB ? "stab" : "slash";
    bonuses.styleBonus =
      this.attackStyle() === AttackStyle.ACCURATE ? 3 : this.attackStyle() === AttackStyle.STAB ? 1 : 0;
    return super.attack(from, to, bonuses, options);
  }
  override _attackRoll(from: Unit, to: Unit, bonuses: AttackBonuses): number {
    return Math.floor(super._attackRoll(from, to, bonuses) * (1 + 0.7 * to.demonbaneMultiplier));
  }
  override _maxHit(from: Unit, to: Unit, bonuses: AttackBonuses): number {
    return Math.floor(super._maxHit(from, to, bonuses) * (1 + 0.7 * to.demonbaneMultiplier));
  }
  override specialAttack(from: Unit, to: Unit, bonuses: AttackBonuses = {}, options: ProjectileOptions = {}): boolean {
    bonuses.isSpecialAttack = true;
    return this.attack(from, to, bonuses, options);
  }
  override registerProjectile(from: Unit, to: Unit, bonuses: AttackBonuses, options: ProjectileOptions = {}): void {
    if (!bonuses.isSpecialAttack) return super.registerProjectile(from, to, bonuses, options);
    const projectile = new WeakenProjectile(this, this.damage, from, to, "stab", {
      ...options,
      visuals: { hidden: true },
    });
    projectile.successful = this.lastHitHit;
    to.addProjectile(projectile);
  }
}

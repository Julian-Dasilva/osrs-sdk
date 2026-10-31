import InventoryImage from "../../assets/images/equipment/Obligator.png";
import { CACHE_ASSETS } from "../../assets/CacheAssets";
import { AttackStyle, AttackStyleTypes } from "../../sdk/AttackStylesController";
import { ItemName } from "../../sdk/ItemName";
import { Unit } from "../../sdk/Unit";
import { AttackBonuses } from "../../sdk/gear/Weapon";
import { MeleeWeapon } from "../../sdk/weapons/MeleeWeapon";
import { ProjectileOptions } from "../../sdk/weapons/Projectile";
import { weaponBonuses } from "./WeaponValues";

/** The charged Obligator; Thrust's reach onto the two targets behind the first is not simulated. */
export class Obligator extends MeleeWeapon {
  constructor() {
    super();
    this.bonuses = weaponBonuses("obligator");
  }
  override get cacheItemId(): number {
    return CACHE_ASSETS.items.obligator.id;
  }
  override get itemName(): ItemName {
    return ItemName.OBLIGATOR;
  }
  override get inventoryImage(): string {
    return InventoryImage;
  }
  override get weight(): number {
    return 4.989;
  }
  override get isTwoHander(): boolean {
    return true;
  }
  override get attackSpeed(): number {
    return this.thrusts ? 5 : 3;
  }
  override get attackRange(): number {
    return 1;
  }
  override get attackAnimationId(): number {
    return this.thrusts
      ? CACHE_ASSETS.playerAnimations.obligatorThrust.id
      : CACHE_ASSETS.playerAnimations.obligatorSmash.id;
  }
  override attackStyles(): AttackStyle[] {
    return [AttackStyle.ACCURATE, AttackStyle.AGGRESSIVECRUSH, AttackStyle.SMASH];
  }
  override attackStyleCategory(): AttackStyleTypes {
    return AttackStyleTypes.CHAIN_MACE;
  }
  override defaultStyle(): AttackStyle {
    return AttackStyle.AGGRESSIVECRUSH;
  }
  override attack(from: Unit, to: Unit, bonuses: AttackBonuses = {}, options: ProjectileOptions = {}): boolean {
    bonuses.attackStyle = "crush";
    bonuses.styleBonus = this.attackStyle() === AttackStyle.ACCURATE ? 3 : 0;
    return super.attack(from, to, bonuses, options);
  }
  override _calculateHitDamage(from: Unit, to: Unit, bonuses: AttackBonuses): number {
    if (!this.thrusts) return super._calculateHitDamage(from, to, bonuses);
    const { stab, slash, crush } = to.bonuses.defence;
    const rolls = 2 + (stab > crush ? 1 : 0) + (slash > crush ? 1 : 0);
    let best = 0;
    for (let roll = 0; roll < rolls; roll++) best = Math.max(best, super._calculateHitDamage(from, to, bonuses));
    const sizeBonus = to.size >= 3 ? 1.4 : to.size === 2 ? 1.2 : 1;
    return Math.floor(best * sizeBonus);
  }
  private get thrusts(): boolean {
    return this.attackStyle() !== AttackStyle.SMASH;
  }
}

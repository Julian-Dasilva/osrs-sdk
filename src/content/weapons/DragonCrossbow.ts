import InventoryImage from "../../assets/images/equipment/Dragon_crossbow.png";
import { CACHE_ASSETS } from "../../assets/CacheAssets";
import { AttackStyle, AttackStyleTypes } from "../../sdk/AttackStylesController";
import { ItemName } from "../../sdk/ItemName";
import { Unit } from "../../sdk/Unit";
import { AttackBonuses } from "../../sdk/gear/Weapon";
import { PlayerAnimationIndices } from "../../sdk/rendering/GLTFAnimationConstants";
import { ProjectileOptions } from "../../sdk/weapons/Projectile";
import { EnchantedCrossbow } from "./EnchantedCrossbow";
import { weaponBonuses } from "./WeaponValues";

export class DragonCrossbow extends EnchantedCrossbow {
  constructor() {
    super();
    this.bonuses = weaponBonuses("dragonCrossbow");
  }
  override get cacheItemId(): number {
    return CACHE_ASSETS.items.dragonCrossbow.id;
  }
  override get itemName(): ItemName {
    return ItemName.DRAGON_CROSSBOW;
  }
  override get inventoryImage(): string {
    return InventoryImage;
  }
  override get weight(): number {
    return 6;
  }
  override get attackSpeed(): number {
    return this.attackStyle() === AttackStyle.RAPID ? 5 : 6;
  }
  override get attackRange(): number {
    return this.attackStyle() === AttackStyle.LONGRANGE ? 9 : 7;
  }
  override get attackAnimationId(): number {
    return PlayerAnimationIndices.FireBow;
  }
  override attackStyles(): AttackStyle[] {
    return [AttackStyle.ACCURATE, AttackStyle.RAPID, AttackStyle.LONGRANGE];
  }
  override attackStyleCategory(): AttackStyleTypes {
    return AttackStyleTypes.CROSSBOW;
  }
  override defaultStyle(): AttackStyle {
    return AttackStyle.RAPID;
  }
  override hasSpecialAttack(): boolean {
    return true;
  }
  override specialAttackDrain(): number {
    return 60;
  }
  override attack(from: Unit, to: Unit, bonuses: AttackBonuses = {}, options: ProjectileOptions = {}): boolean {
    bonuses.attackStyle = "range";
    bonuses.isAccurate = this.attackStyle() === AttackStyle.ACCURATE;
    return super.attack(from, to, bonuses, options);
  }
  override specialAttack(from: Unit, to: Unit, bonuses: AttackBonuses = {}, options: ProjectileOptions = {}): boolean {
    bonuses.isSpecialAttack = true;
    if (!this.attack(from, to, bonuses, options)) return false;
    const primaryDamage = this.damage;
    let damage = primaryDamage;
    let count = 1;
    for (const target of from.region.mobs) {
      if (count >= 9) break;
      if (target === to || target.isDying()) continue;
      const closest = target.getClosestTileTo(to.location.x, to.location.y);
      if (Math.abs(closest[0] - to.location.x) > 1 || Math.abs(closest[1] - to.location.y) > 1) continue;
      damage = Math.floor(damage * 0.8);
      this.damage = Math.min(damage, target.currentStats.hitpoint);
      this.registerProjectile(from, target, bonuses, options);
      count++;
    }
    this.damage = primaryDamage;
    return true;
  }
  override _maxHit(from: Unit, to: Unit, bonuses: AttackBonuses): number {
    const maximum = super._maxHit(from, to, bonuses);
    return bonuses.isSpecialAttack ? Math.floor(maximum * 1.2) : maximum;
  }
}

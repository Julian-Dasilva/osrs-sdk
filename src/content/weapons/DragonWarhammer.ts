import InventoryImage from "../../assets/images/equipment/Dragon_warhammer.png";
import { CACHE_ASSETS } from "../../assets/CacheAssets";
import { AttackStyle, AttackStyleTypes } from "../../sdk/AttackStylesController";
import { ItemName } from "../../sdk/ItemName";
import { Unit } from "../../sdk/Unit";
import { AttackBonuses, AttackGraphics } from "../../sdk/gear/Weapon";
import { PlayerAnimationIndices } from "../../sdk/rendering/GLTFAnimationConstants";
import { MeleeWeapon } from "../../sdk/weapons/MeleeWeapon";
import { ProjectileOptions } from "../../sdk/weapons/Projectile";
import { SmashProjectile } from "./StatDrainProjectile";
import { weaponBonuses } from "./WeaponValues";

export class DragonWarhammer extends MeleeWeapon {
  constructor() {
    super();
    this.bonuses = weaponBonuses("dragonWarhammer");
  }
  override get cacheItemId(): number {
    return CACHE_ASSETS.items.dragonWarhammer.id;
  }
  override get itemName(): ItemName {
    return ItemName.DRAGON_WARHAMMER;
  }
  override get inventoryImage(): string {
    return InventoryImage;
  }
  override get weight(): number {
    return 2;
  }
  override get attackSpeed(): number {
    return 6;
  }
  override get attackRange(): number {
    return 1;
  }
  override get attackAnimationId(): number {
    return PlayerAnimationIndices.ZombieAxeCrush;
  }
  override attackStyles(): AttackStyle[] {
    return [AttackStyle.ACCURATE, AttackStyle.AGGRESSIVECRUSH, AttackStyle.DEFENSIVE];
  }
  override attackStyleCategory(): AttackStyleTypes {
    return AttackStyleTypes.BLUNT;
  }
  override defaultStyle(): AttackStyle {
    return AttackStyle.AGGRESSIVECRUSH;
  }
  override get specialAttackGraphics(): AttackGraphics | null {
    return {
      animation: CACHE_ASSETS.playerAnimations.dragonWarhammerSpecial.id,
      cast: CACHE_ASSETS.spotAnims.dragonWarhammerSpecial.id,
      projectile: null,
      impact: null,
    };
  }
  override hasSpecialAttack(): boolean {
    return true;
  }
  override attack(from: Unit, to: Unit, bonuses: AttackBonuses = {}, options: ProjectileOptions = {}): boolean {
    bonuses.attackStyle = "crush";
    bonuses.styleBonus = this.attackStyle() === AttackStyle.ACCURATE ? 3 : 0;
    return super.attack(from, to, bonuses, options);
  }
  override specialAttack(from: Unit, to: Unit, bonuses: AttackBonuses = {}, options: ProjectileOptions = {}): boolean {
    bonuses.isSpecialAttack = true;
    bonuses.overallMultiplier = (bonuses.overallMultiplier ?? 1) * 1.5;
    return this.attack(from, to, bonuses, options);
  }
  override registerProjectile(from: Unit, to: Unit, bonuses: AttackBonuses, options: ProjectileOptions = {}): void {
    if (!bonuses.isSpecialAttack) return super.registerProjectile(from, to, bonuses, options);
    to.addProjectile(
      new SmashProjectile(this, this.damage, from, to, "crush", { ...options, visuals: { hidden: true } }),
    );
  }
}

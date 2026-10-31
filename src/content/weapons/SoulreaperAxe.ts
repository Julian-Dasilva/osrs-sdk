import InventoryImage from "../../assets/images/equipment/Soulreaper_axe.png";
import { CACHE_ASSETS } from "../../assets/CacheAssets";
import { AttackStyle } from "../../sdk/AttackStylesController";
import { ItemName } from "../../sdk/ItemName";
import { Unit } from "../../sdk/Unit";
import { AttackBonuses, AttackGraphics } from "../../sdk/gear/Weapon";
import { ProjectileOptions } from "../../sdk/weapons/Projectile";
import { weaponBonuses } from "./WeaponValues";
import { ZombieAxe } from "./ZombieAxe";

const MAX_SOUL_STACKS = 5;
const SOUL_STACK_DECAY_TICKS = 50;

export class SoulreaperAxe extends ZombieAxe {
  private soulStacks = 0;
  private stacksSinceTick: number | null = null;

  constructor() {
    super();
    this.bonuses = weaponBonuses("soulreaperAxe");
  }
  override get cacheItemId(): number {
    return CACHE_ASSETS.items.soulreaperAxe.id;
  }
  override get itemName(): ItemName {
    return ItemName.SOULREAPER_AXE;
  }
  override get inventoryImage(): string {
    return InventoryImage;
  }
  override get weight(): number {
    return 2.825;
  }
  override get isTwoHander(): boolean {
    return true;
  }
  override get attackAnimationId(): number {
    return this.attackStyle() === AttackStyle.AGGRESSIVECRUSH
      ? CACHE_ASSETS.playerAnimations.soulreaperAxeCrush.id
      : CACHE_ASSETS.playerAnimations.soulreaperAxeSlash.id;
  }
  protected get specialSpotAnim(): number {
    return CACHE_ASSETS.spotAnims.soulreaperAxeSpecial.id;
  }
  override get specialAttackGraphics(): AttackGraphics | null {
    return {
      animation: CACHE_ASSETS.playerAnimations.soulreaperAxeSpecial.id,
      cast: this.specialSpotAnim,
      projectile: null,
      impact: null,
    };
  }
  override hasSpecialAttack(): boolean {
    return true;
  }
  override specialAttackDrain(): number {
    return 0;
  }
  override attack(from: Unit, to: Unit, bonuses: AttackBonuses = {}, options: ProjectileOptions = {}): boolean {
    this.decaySoulStacks(from);
    if (!super.attack(from, to, bonuses, options)) return false;
    this.soulStacks = bonuses.isSpecialAttack ? 0 : Math.min(MAX_SOUL_STACKS, this.soulStacks + 1);
    this.stacksSinceTick = from.region.world?.globalTickCounter ?? null;
    return true;
  }
  override specialAttack(from: Unit, to: Unit, bonuses: AttackBonuses = {}, options: ProjectileOptions = {}): boolean {
    bonuses.isSpecialAttack = true;
    return this.attack(from, to, bonuses, options);
  }
  override strengthMultiplierBonus(bonuses: AttackBonuses): number {
    return bonuses.isSpecialAttack ? 0 : 0.06 * this.soulStacks;
  }
  override _attackRoll(from: Unit, to: Unit, bonuses: AttackBonuses): number {
    const roll = super._attackRoll(from, to, bonuses);
    return bonuses.isSpecialAttack ? Math.floor(roll * (1 + 0.12 * this.soulStacks)) : roll;
  }
  override _maxHit(from: Unit, to: Unit, bonuses: AttackBonuses): number {
    const maximum = super._maxHit(from, to, bonuses);
    return bonuses.isSpecialAttack ? Math.floor(maximum * (1 + 0.06 * this.soulStacks)) : maximum;
  }
  override _calculateHitDamage(from: Unit, to: Unit, bonuses: AttackBonuses): number {
    const damage = super._calculateHitDamage(from, to, bonuses);
    if (!bonuses.isSpecialAttack) return damage;
    return Math.max(damage, Math.floor(this._maxHit(from, to, bonuses) * 0.06 * this.soulStacks));
  }
  private decaySoulStacks(from: Unit): void {
    const now = from.region.world?.globalTickCounter;
    if (now === undefined || this.stacksSinceTick === null) return;
    const decayed = Math.min(this.soulStacks, Math.floor((now - this.stacksSinceTick) / SOUL_STACK_DECAY_TICKS));
    this.soulStacks -= decayed;
    this.stacksSinceTick += decayed * SOUL_STACK_DECAY_TICKS;
  }
}

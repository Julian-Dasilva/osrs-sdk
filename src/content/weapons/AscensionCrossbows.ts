import InventoryImage from "../../assets/images/equipment/Ascension_crossbows.png";
import { CACHE_ASSETS } from "../../assets/CacheAssets";
import { AttackStyle } from "../../sdk/AttackStylesController";
import { ItemName } from "../../sdk/ItemName";
import { Unit } from "../../sdk/Unit";
import { AttackBonuses, AttackGraphics } from "../../sdk/gear/Weapon";
import { ProjectileOptions } from "../../sdk/weapons/Projectile";
import { DragonCrossbow } from "./DragonCrossbow";
import { weaponBonuses } from "./WeaponValues";

/** Ascension crossbows: fire ascension bolts every 3 ticks (2 on Rapid), alternating hands, at half the bolt effect chance. */
export class AscensionCrossbows extends DragonCrossbow {
  private shots = 0;

  constructor() {
    super();
    this.bonuses = weaponBonuses("ascensionCrossbows");
  }
  override get cacheItemId(): number {
    return CACHE_ASSETS.items.ascensionCrossbows.id;
  }
  override get itemName(): ItemName {
    return ItemName.ASCENSION_CROSSBOWS;
  }
  override get inventoryImage(): string {
    return InventoryImage;
  }
  override get weight(): number {
    return 6;
  }
  override get isTwoHander(): boolean {
    return true;
  }
  override get attackSpeed(): number {
    return this.attackStyle() === AttackStyle.RAPID ? 2 : 3;
  }
  override get attackRange(): number {
    return this.attackStyle() === AttackStyle.LONGRANGE ? 8 : 6;
  }
  override get attackAnimationId(): number {
    return this.shots % 2 === 1
      ? CACHE_ASSETS.playerAnimations.ascensionCrossbowsFireLeft.id
      : CACHE_ASSETS.playerAnimations.ascensionCrossbowsFireRight.id;
  }
  override get boltEffectChance(): number {
    return 0.5;
  }
  override compatibleAmmo(): ItemName[] {
    return [ItemName.ASCENSION_BOLTS, ItemName.DIAMOND_ASCENSION_BOLTS_E];
  }
  override hasSpecialAttack(): boolean {
    return false;
  }
  override get specialAttackGraphics(): AttackGraphics | null {
    return null;
  }
  override attack(from: Unit, to: Unit, bonuses: AttackBonuses = {}, options: ProjectileOptions = {}): boolean {
    if (!super.attack(from, to, bonuses, options)) return false;
    this.shots++;
    return true;
  }
}

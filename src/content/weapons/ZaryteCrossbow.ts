import InventoryImage from "../../assets/images/equipment/Zaryte_crossbow.png";
import { CACHE_ASSETS } from "../../assets/CacheAssets";
import { AttackStyle } from "../../sdk/AttackStylesController";
import { ItemName } from "../../sdk/ItemName";
import { AttackBonuses } from "../../sdk/gear/Weapon";
import { Unit } from "../../sdk/Unit";
import { ProjectileOptions } from "../../sdk/weapons/Projectile";
import { DragonCrossbow } from "./DragonCrossbow";
import { weaponBonuses } from "./WeaponValues";

export class ZaryteCrossbow extends DragonCrossbow {
  constructor() {
    super();
    this.bonuses = weaponBonuses("zaryteCrossbow");
  }
  override get cacheItemId(): number {
    return CACHE_ASSETS.items.zaryteCrossbow.id;
  }
  override get itemName(): ItemName {
    return ItemName.ZARYTE_CROSSBOW;
  }
  override get inventoryImage(): string {
    return InventoryImage;
  }
  override get attackRange(): number {
    return this.attackStyle() === AttackStyle.LONGRANGE ? 10 : 8;
  }
  override get enhancedBolts(): boolean {
    return true;
  }
  override get guaranteesBoltEffect(): boolean {
    return true;
  }
  override specialAttackDrain(): number {
    return 75;
  }
  override specialAttack(from: Unit, to: Unit, bonuses: AttackBonuses = {}, options: ProjectileOptions = {}): boolean {
    bonuses.isSpecialAttack = true;
    return this.attack(from, to, bonuses, options);
  }
  override _attackRoll(from: Unit, to: Unit, bonuses: AttackBonuses): number {
    const roll = super._attackRoll(from, to, bonuses);
    return bonuses.isSpecialAttack ? roll * 2 : roll;
  }
}

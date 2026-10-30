import InventoryImage from "../../assets/images/equipment/Blessed_Dizana's_quiver.png";
import { CACHE_ASSETS } from "../../assets/CacheAssets";
import { ItemName } from "../../sdk/ItemName";
import { Equipment } from "../../sdk/Equipment";
import { RangedWeapon } from "../../sdk/weapons/RangedWeapon";
import { DizanasQuiver } from "./DizanasQuiver";

export class BlessedDizanasQuiver extends DizanasQuiver {
  override get cacheItemId(): number {
    return CACHE_ASSETS.items.blessedDizanasQuiver.id;
  }
  override get itemName(): ItemName {
    return ItemName.BLESSED_DIZANAS_QUIVER;
  }
  override get inventoryImage(): string {
    return InventoryImage;
  }
  override updateBonuses(gear: Equipment[]): void {
    const weapon = gear.find((item) => item instanceof RangedWeapon);
    const ammo = gear.find(
      (item) =>
        item?.itemName === ItemName.DRAGON_ARROWS ||
        item?.itemName === ItemName.RUBY_BOLTS_E ||
        item?.itemName === ItemName.DIAMOND_BOLTS_E,
    );
    const charged =
      weapon instanceof RangedWeapon && ammo !== undefined && weapon.compatibleAmmo().includes(ammo.itemName);
    this.bonuses.attack.range = charged ? 28 : 18;
    this.bonuses.other.rangedStrength = charged ? 4 : 3;
  }
}

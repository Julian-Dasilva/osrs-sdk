import InventoryImage from "../../assets/images/equipment/Lightbearer.png";
import { CACHE_ASSETS } from "../../assets/CacheAssets";
import { ImageLoader } from "../../sdk/utils/ImageLoader";
import { ItemName } from "../../sdk/ItemName";
import { Ring } from "../../sdk/gear/Ring";
import { weaponBonuses } from "../weapons/WeaponValues";

export class Lightbearer extends Ring {
  override inventorySprite = ImageLoader.createImage(this.inventoryImage);
  constructor() {
    super();
    this.bonuses = weaponBonuses("lightbearer");
  }
  override get cacheItemId(): number {
    return CACHE_ASSETS.items.lightbearer.id;
  }
  override get itemName(): ItemName {
    return ItemName.LIGHTBEARER;
  }
  override get inventoryImage(): string {
    return InventoryImage;
  }
  override get specialAttackRegenTicks(): number {
    return 25;
  }
  override get weight(): number {
    return 0.05;
  }
}

import { Item } from "../../sdk/Item";
import { ItemName } from "../../sdk/ItemName";
import { ImageLoader } from "../../sdk/utils/ImageLoader";
import { CACHE_ASSETS } from "../../assets/CacheAssets";
import InventImage from "../../assets/images/equipment/Divine_rune_pouch.png";

export class DivineRunePouch extends Item {
  override inventorySprite = ImageLoader.createImage(this.inventoryImage);

  override get cacheItemId(): number {
    return CACHE_ASSETS.items.divineRunePouch.id;
  }

  override get inventoryImage(): string {
    return InventImage;
  }

  override get itemName(): ItemName {
    return ItemName.DIVINE_RUNE_POUCH;
  }

  override get weight(): number {
    return 0.878;
  }
}

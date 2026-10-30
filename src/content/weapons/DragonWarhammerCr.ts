import InventoryImage from "../../assets/images/equipment/Dragon_warhammer_(cr).png";
import { CACHE_ASSETS } from "../../assets/CacheAssets";
import { ItemName } from "../../sdk/ItemName";
import { DragonWarhammer } from "./DragonWarhammer";

export class DragonWarhammerCr extends DragonWarhammer {
  override get cacheItemId(): number {
    return CACHE_ASSETS.items.dragonWarhammerCr.id;
  }
  override get itemName(): ItemName {
    return ItemName.DRAGON_WARHAMMER_CR;
  }
  override get inventoryImage(): string {
    return InventoryImage;
  }
}

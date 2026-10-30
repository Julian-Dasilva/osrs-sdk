import InventoryImage from "../../assets/images/equipment/Sanguine_scythe_of_Vitur.png";
import { CACHE_ASSETS } from "../../assets/CacheAssets";
import { ItemName } from "../../sdk/ItemName";
import { ScytheOfVitur } from "./ScytheOfVitur";

export class SanguineScytheOfVitur extends ScytheOfVitur {
  override get cacheItemId(): number {
    return CACHE_ASSETS.items.sanguineScytheOfVitur.id;
  }
  override get itemName(): ItemName {
    return ItemName.SANGUINE_SCYTHE_OF_VITUR;
  }
  override get inventoryImage(): string {
    return InventoryImage;
  }
}

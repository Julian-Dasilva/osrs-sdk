import InventoryImage from "../../assets/images/equipment/Soulreaper_axe_(o).png";
import { CACHE_ASSETS } from "../../assets/CacheAssets";
import { ItemName } from "../../sdk/ItemName";
import { SoulreaperAxe } from "./SoulreaperAxe";

export class SoulreaperAxeOrnament extends SoulreaperAxe {
  override get cacheItemId(): number {
    return CACHE_ASSETS.items.soulreaperAxeOrnament.id;
  }
  override get itemName(): ItemName {
    return ItemName.SOULREAPER_AXE_O;
  }
  override get inventoryImage(): string {
    return InventoryImage;
  }
  protected override get specialSpotAnim(): number {
    return CACHE_ASSETS.spotAnims.soulreaperAxeOrnamentSpecial.id;
  }
}

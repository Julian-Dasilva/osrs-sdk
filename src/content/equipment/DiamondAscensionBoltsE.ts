import InventoryImage from "../../assets/images/equipment/Diamond_ascension_bolts_e_5.png";
import { CACHE_ASSETS } from "../../assets/CacheAssets";
import { ItemName } from "../../sdk/ItemName";
import { AscensionBolts } from "./AscensionBolts";

export class DiamondAscensionBoltsE extends AscensionBolts {
  constructor() {
    super(58);
  }
  override get cacheItemId(): number {
    return CACHE_ASSETS.items.diamondAscensionBoltsE.id;
  }
  override get itemName(): ItemName {
    return ItemName.DIAMOND_ASCENSION_BOLTS_E;
  }
  override get inventoryImage(): string {
    return InventoryImage;
  }
}

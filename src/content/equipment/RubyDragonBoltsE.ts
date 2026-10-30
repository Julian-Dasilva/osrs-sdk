import InventoryImage from "../../assets/images/equipment/Ruby_dragon_bolts_e_5.png";
import { CACHE_ASSETS } from "../../assets/CacheAssets";
import { ItemName } from "../../sdk/ItemName";
import { RubyBoltsE } from "./RubyBoltsE";

export class RubyDragonBoltsE extends RubyBoltsE {
  constructor() {
    super();
    this.bonuses.other.rangedStrength = 122;
  }
  override get cacheItemId(): number {
    return CACHE_ASSETS.items.rubyDragonBoltsE.id;
  }
  override get itemName(): ItemName {
    return ItemName.RUBY_DRAGON_BOLTS_E;
  }
  override get inventoryImage(): string {
    return InventoryImage;
  }
}

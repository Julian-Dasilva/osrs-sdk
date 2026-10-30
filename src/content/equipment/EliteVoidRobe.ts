import { Legs } from "../../sdk/gear/Legs";
import { ImageLoader } from "../../sdk/utils/ImageLoader";
import InventImage from "../../assets/images/equipment/Elite_void_robe.png";
import { ItemName } from "../../sdk/ItemName";
import { CACHE_ASSETS } from "../../assets/CacheAssets";

export class EliteVoidRobe extends Legs {
  override inventorySprite = ImageLoader.createImage(this.inventoryImage);

  override get cacheItemId(): number {
    return CACHE_ASSETS.items.eliteVoidRobe.id;
  }

  override get inventoryImage(): string {
    return InventImage;
  }

  override get itemName(): ItemName {
    return ItemName.ELITE_VOID_ROBE;
  }

  override get weight(): number {
    return 8.164;
  }

  constructor() {
    super();
    this.bonuses = {
      attack: { stab: 0, slash: 0, crush: 0, magic: 0, range: 0 },
      defence: { stab: 30, slash: 30, crush: 30, magic: 30, range: 30 },
      other: { meleeStrength: 0, rangedStrength: 0, magicDamage: 0, prayer: 3 },
      targetSpecific: { undead: 0, slayer: 0 },
    };
  }
}

import { Legs } from "../../sdk/gear/Legs";
import { ImageLoader } from "../../sdk/utils/ImageLoader";
import InventImage from "../../assets/images/equipment/Eclipse_Moon_tassets.png";
import { ItemName } from "../../sdk/ItemName";
import { CACHE_ASSETS } from "../../assets/CacheAssets";

export class EclipseMoonTassets extends Legs {
  override inventorySprite = ImageLoader.createImage(this.inventoryImage);

  override get cacheItemId(): number {
    return CACHE_ASSETS.items.eclipseMoonTassets.id;
  }

  override get inventoryImage(): string {
    return InventImage;
  }

  override get itemName(): ItemName {
    return ItemName.ECLIPSE_MOON_TASSETS;
  }

  override get weight(): number {
    return 1.0;
  }

  constructor() {
    super();
    this.bonuses = {
      attack: { stab: 0, slash: 0, crush: 0, magic: -15, range: 17 },
      defence: { stab: 9, slash: 13, crush: 37, magic: 31, range: 17 },
      other: { meleeStrength: 1, rangedStrength: 0, magicDamage: 0, prayer: 0 },
      targetSpecific: { undead: 0, slayer: 0 },
    };
  }
}

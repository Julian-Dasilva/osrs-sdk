import { Chest } from "../../sdk/gear/Chest";
import { ImageLoader } from "../../sdk/utils/ImageLoader";
import InventImage from "../../assets/images/equipment/Eclipse_Moon_chestplate.png";
import { ItemName } from "../../sdk/ItemName";
import { CACHE_ASSETS } from "../../assets/CacheAssets";

export class EclipseMoonChestplate extends Chest {
  override inventorySprite = ImageLoader.createImage(this.inventoryImage);

  override get cacheItemId(): number {
    return CACHE_ASSETS.items.eclipseMoonChestplate.id;
  }

  override get inventoryImage(): string {
    return InventImage;
  }

  override get itemName(): ItemName {
    return ItemName.ECLIPSE_MOON_CHESTPLATE;
  }

  override get weight(): number {
    return 3.0;
  }

  constructor() {
    super();
    this.bonuses = {
      attack: { stab: 0, slash: 0, crush: 0, magic: -15, range: 31 },
      defence: { stab: 15, slash: 18, crush: 57, magic: 55, range: 32 },
      other: { meleeStrength: 3, rangedStrength: 0, magicDamage: 0, prayer: 0 },
      targetSpecific: { undead: 0, slayer: 0 },
    };
  }
}

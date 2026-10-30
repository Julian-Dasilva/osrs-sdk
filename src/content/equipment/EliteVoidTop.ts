import { Chest } from "../../sdk/gear/Chest";
import { ImageLoader } from "../../sdk/utils/ImageLoader";
import InventImage from "../../assets/images/equipment/Elite_void_top.png";
import { ItemName } from "../../sdk/ItemName";
import { CACHE_ASSETS } from "../../assets/CacheAssets";

export class EliteVoidTop extends Chest {
  override inventorySprite = ImageLoader.createImage(this.inventoryImage);

  override get cacheItemId(): number {
    return CACHE_ASSETS.items.eliteVoidTop.id;
  }

  override get inventoryImage(): string {
    return InventImage;
  }

  override get itemName(): ItemName {
    return ItemName.ELITE_VOID_TOP;
  }

  override get weight(): number {
    return 6.803;
  }

  constructor() {
    super();
    this.bonuses = {
      attack: { stab: 0, slash: 0, crush: 0, magic: 0, range: 0 },
      defence: { stab: 45, slash: 45, crush: 45, magic: 45, range: 45 },
      other: { meleeStrength: 0, rangedStrength: 0, magicDamage: 0, prayer: 3 },
      targetSpecific: { undead: 0, slayer: 0 },
    };
  }
}

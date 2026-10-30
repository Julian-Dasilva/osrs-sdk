import { Helmet } from "../../sdk/gear/Helmet";
import { ImageLoader } from "../../sdk/utils/ImageLoader";
import InventImage from "../../assets/images/equipment/Magma_helm.png";
import { ItemName } from "../../sdk/ItemName";
import { CACHE_ASSETS } from "../../assets/CacheAssets";

export class MagmaHelm extends Helmet {
  override inventorySprite = ImageLoader.createImage(this.inventoryImage);

  override get cacheItemId(): number {
    return CACHE_ASSETS.items.magmaHelm.id;
  }

  override get inventoryImage(): string {
    return InventImage;
  }

  override get itemName(): ItemName {
    return ItemName.MAGMA_HELM;
  }

  override get weight(): number {
    return 0.9;
  }

  constructor() {
    super();
    this.bonuses = {
      attack: { stab: 0, slash: 0, crush: 0, magic: -5, range: -5 },
      defence: { stab: 52, slash: 55, crush: 58, magic: 0, range: 50 },
      other: { meleeStrength: 5, rangedStrength: 0, magicDamage: 0, prayer: 0 },
      targetSpecific: { undead: 0, slayer: 0 },
    };
  }
}

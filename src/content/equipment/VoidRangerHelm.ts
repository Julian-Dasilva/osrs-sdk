import { Helmet } from "../../sdk/gear/Helmet";
import { ImageLoader } from "../../sdk/utils/ImageLoader";
import InventImage from "../../assets/images/equipment/Void_ranger_helm.png";
import { ItemName } from "../../sdk/ItemName";
import { CACHE_ASSETS } from "../../assets/CacheAssets";
import { EliteVoidRangedSetEffect } from "../seteffects/EliteVoidRangedSetEffect";

export class VoidRangerHelm extends Helmet {
  override inventorySprite = ImageLoader.createImage(this.inventoryImage);

  override get cacheItemId(): number {
    return CACHE_ASSETS.items.voidRangerHelm.id;
  }

  override get inventoryImage(): string {
    return InventImage;
  }

  override get itemName(): ItemName {
    return ItemName.VOID_RANGER_HELM;
  }

  override get weight(): number {
    return 0.453;
  }

  override get equipmentSetEffect(): typeof EliteVoidRangedSetEffect {
    return EliteVoidRangedSetEffect;
  }

  constructor() {
    super();
    this.bonuses = {
      attack: { stab: 0, slash: 0, crush: 0, magic: 0, range: 0 },
      defence: { stab: 6, slash: 6, crush: 6, magic: 6, range: 6 },
      other: { meleeStrength: 0, rangedStrength: 0, magicDamage: 0, prayer: 0 },
      targetSpecific: { undead: 0, slayer: 0 },
    };
  }
}

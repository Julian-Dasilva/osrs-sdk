import InventoryImage from "../../assets/images/equipment/Ascension_bolts_5.png";
import { CACHE_ASSETS } from "../../assets/CacheAssets";
import { Ammo } from "../../sdk/gear/Ammo";
import { ItemName } from "../../sdk/ItemName";
import { ImageLoader } from "../../sdk/utils/ImageLoader";

export class AscensionBolts extends Ammo {
  constructor(rangedStrength = 53) {
    super();
    this.bonuses = {
      attack: { stab: 0, slash: 0, crush: 0, magic: 0, range: 0 },
      defence: { stab: 0, slash: 0, crush: 0, magic: 0, range: 0 },
      other: { meleeStrength: 0, rangedStrength, magicDamage: 0, prayer: 0 },
      targetSpecific: { undead: 0, slayer: 0 },
    };
  }
  override get equipSoundId(): number {
    return CACHE_ASSETS.sounds.equipBolt.id;
  }
  override get cacheItemId(): number {
    return CACHE_ASSETS.items.ascensionBolts.id;
  }
  override get itemName(): ItemName {
    return ItemName.ASCENSION_BOLTS;
  }
  override get inventoryImage(): string {
    return InventoryImage;
  }
  override inventorySprite: HTMLImageElement = ImageLoader.createImage(this.inventoryImage);
  override get weight(): number {
    return 0;
  }
}

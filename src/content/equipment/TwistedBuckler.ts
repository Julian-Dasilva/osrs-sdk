import { Offhand } from "../../sdk/gear/Offhand";
import { ImageLoader } from "../../sdk/utils/ImageLoader";
import InventImage from "../../assets/images/equipment/Twisted_buckler.png";
import { ItemName } from "../../sdk/ItemName";
import { CACHE_ASSETS } from "../../assets/CacheAssets";

export class TwistedBuckler extends Offhand {
  override inventorySprite = ImageLoader.createImage(this.inventoryImage);

  override get cacheItemId(): number {
    return CACHE_ASSETS.items.twistedBuckler.id;
  }

  override get inventoryImage(): string {
    return InventImage;
  }

  override get itemName(): ItemName {
    return ItemName.TWISTED_BUCKLER;
  }

  override get weight(): number {
    return 5.443;
  }

  constructor() {
    super();
    this.bonuses = {
      attack: { stab: -7, slash: -8, crush: -7, magic: -10, range: 18 },
      defence: { stab: 22, slash: 24, crush: 22, magic: 26, range: 58 },
      other: { meleeStrength: 0, rangedStrength: 10, magicDamage: 0, prayer: 0 },
      targetSpecific: { undead: 0, slayer: 0 },
    };
  }
}

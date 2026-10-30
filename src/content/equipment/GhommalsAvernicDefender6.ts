import { Offhand } from "../../sdk/gear/Offhand";
import { ImageLoader } from "../../sdk/utils/ImageLoader";
import InventImage from "../../assets/images/equipment/Ghommal's_avernic_defender_6.png";
import { ItemName } from "../../sdk/ItemName";
import { CACHE_ASSETS } from "../../assets/CacheAssets";

export class GhommalsAvernicDefender6 extends Offhand {
  override inventorySprite = ImageLoader.createImage(this.inventoryImage);

  override get cacheItemId(): number {
    return CACHE_ASSETS.items.ghommalsAvernicDefender6.id;
  }

  override get inventoryImage(): string {
    return InventImage;
  }

  override get itemName(): ItemName {
    return ItemName.GHOMMAL_S_AVERNIC_DEFENDER_6;
  }

  override get weight(): number {
    return 0.453;
  }

  constructor() {
    super();
    this.bonuses = {
      attack: { stab: 30, slash: 29, crush: 28, magic: -5, range: -4 },
      defence: { stab: 30, slash: 29, crush: 28, magic: -5, range: -4 },
      other: { meleeStrength: 8, rangedStrength: 0, magicDamage: 0, prayer: 0 },
      targetSpecific: { undead: 0, slayer: 0 },
    };
  }
}

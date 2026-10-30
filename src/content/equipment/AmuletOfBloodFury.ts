import InventoryImage from "../../assets/images/equipment/Amulet_of_blood_fury.png";
import { CACHE_ASSETS } from "../../assets/CacheAssets";
import { ItemName } from "../../sdk/ItemName";
import { Random } from "../../sdk/Random";
import { Projectile } from "../../sdk/weapons/Projectile";
import { AmuletOfFury } from "./AmuletOfFury";

export class AmuletOfBloodFury extends AmuletOfFury {
  override get cacheItemId(): number {
    return CACHE_ASSETS.items.amuletOfBloodFury.id;
  }
  override get itemName(): ItemName {
    return ItemName.AMULET_OF_BLOOD_FURY;
  }
  override get inventoryImage(): string {
    return InventoryImage;
  }
  override get weight(): number {
    return 0.02;
  }
  override onDealtHit(hit: Projectile): void {
    if (hit.damage <= 0 || !hit.isMeleeStyle() || Random.get() >= 0.2) return;
    hit.from.currentStats.hitpoint = Math.min(
      hit.from.stats.hitpoint,
      hit.from.currentStats.hitpoint + Math.floor(hit.damage * 0.3),
    );
  }
}

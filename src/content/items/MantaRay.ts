import InventoryImage from "../../assets/images/potions/Manta_ray.png";
import { Food } from "../../sdk/gear/Food";
import { ItemName } from "../../sdk/ItemName";
import { SUPPLY_VALUES } from "./SupplyValues";

export class MantaRay extends Food {
  override healAmount = SUPPLY_VALUES.mantaRay.heal;
  override get cacheItemId(): number {
    return SUPPLY_VALUES.mantaRay.id;
  }

  override get inventoryImage(): string {
    return InventoryImage;
  }

  override get itemName(): ItemName {
    return ItemName.MANTA_RAY;
  }

  override get weight(): number {
    return SUPPLY_VALUES.mantaRay.weight;
  }
}

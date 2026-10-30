import InventoryImage from "../../assets/images/potions/Giant_krill.png";
import { Food } from "../../sdk/gear/Food";
import { ItemName } from "../../sdk/ItemName";
import { SUPPLY_VALUES } from "./SupplyValues";

export class GiantKrill extends Food {
  override healAmount = SUPPLY_VALUES.giantKrill.heal;
  override get cacheItemId(): number {
    return SUPPLY_VALUES.giantKrill.id;
  }

  override get inventoryImage(): string {
    return InventoryImage;
  }

  override get itemName(): ItemName {
    return ItemName.GIANT_KRILL;
  }

  override get weight(): number {
    return SUPPLY_VALUES.giantKrill.weight;
  }
}

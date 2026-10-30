import InventoryImage from "../../assets/images/potions/Leftovers.png";
import { Food } from "../../sdk/gear/Food";
import { ItemName } from "../../sdk/ItemName";
import { SUPPLY_VALUES } from "./SupplyValues";

export class Leftovers extends Food {
  override healAmount = SUPPLY_VALUES.leftovers.heal;
  override get cacheItemId(): number {
    return SUPPLY_VALUES.leftovers.id;
  }

  override get inventoryImage(): string {
    return InventoryImage;
  }

  override get itemName(): ItemName {
    return ItemName.LEFTOVERS;
  }

  override get weight(): number {
    return SUPPLY_VALUES.leftovers.weight;
  }
}

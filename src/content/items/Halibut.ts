import InventoryImage from "../../assets/images/potions/Halibut.png";
import { Food } from "../../sdk/gear/Food";
import { ItemName } from "../../sdk/ItemName";
import { Player } from "../../sdk/Player";
import { SUPPLY_VALUES } from "./SupplyValues";

export class Halibut extends Food {
  override healAmount = SUPPLY_VALUES.halibut.heal;
  override attackDelay = SUPPLY_VALUES.comboFood.attackDelay;

  override inventoryLeftClick(player: Player): void {
    player.eats.eatComboFood(this);
  }

  override get cacheItemId(): number {
    return SUPPLY_VALUES.halibut.id;
  }

  override get inventoryImage(): string {
    return InventoryImage;
  }

  override get itemName(): ItemName {
    return ItemName.HALIBUT;
  }

  override get weight(): number {
    return SUPPLY_VALUES.halibut.weight;
  }
}

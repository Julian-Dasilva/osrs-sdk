import Dose1 from "../../assets/images/potions/Super_combat_potion_1.png";
import Dose2 from "../../assets/images/potions/Super_combat_potion_2.png";
import Dose3 from "../../assets/images/potions/Super_combat_potion_3.png";
import Dose4 from "../../assets/images/potions/Super_combat_potion_4.png";
import { ItemName } from "../../sdk/ItemName";
import { Player } from "../../sdk/Player";
import { DosedPotion } from "../../sdk/gear/DosedPotion";
import { SUPPLY_VALUES } from "./SupplyValues";

export class SuperCombatPotion extends DosedPotion {
  protected get doseIds() {
    return SUPPLY_VALUES.superCombat.doseIds;
  }

  protected get doseImages(): readonly [string, string, string, string] {
    return [Dose1, Dose2, Dose3, Dose4];
  }

  override get itemName(): ItemName {
    return ItemName.SUPER_COMBAT_POTION;
  }

  override drink(player: Player): void {
    super.drink(player);
    const values = SUPPLY_VALUES.superCombat;
    player.regenTimer.boostStats(["attack", "strength", "defence"], values.fraction, values.flat);
  }
}

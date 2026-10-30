import Dose1 from "../../assets/images/potions/Ranging_potion(1).png";
import Dose2 from "../../assets/images/potions/Ranging_potion(2).png";
import Dose3 from "../../assets/images/potions/Ranging_potion(3).png";
import Dose4 from "../../assets/images/potions/Ranging_potion(4).png";
import { ItemName } from "../../sdk/ItemName";
import { Player } from "../../sdk/Player";
import { DosedPotion } from "../../sdk/gear/DosedPotion";
import { SUPPLY_VALUES } from "./SupplyValues";

const DOSE_NAMES = [
  ItemName.RANGING_POTION_1,
  ItemName.RANGING_POTION_2,
  ItemName.RANGING_POTION_3,
  ItemName.RANGING_POTION_4,
] as const;

export class RangingPotion extends DosedPotion {
  protected get doseIds() {
    return SUPPLY_VALUES.ranging.doseIds;
  }

  protected get doseImages(): readonly [string, string, string, string] {
    return [Dose1, Dose2, Dose3, Dose4];
  }

  override get itemName(): ItemName {
    return DOSE_NAMES[this.doses - 1] ?? ItemName.RANGING_POTION;
  }

  override drink(player: Player): void {
    super.drink(player);
    const values = SUPPLY_VALUES.ranging;
    player.regenTimer.boostStats(["range"], values.fraction, values.flat);
  }
}

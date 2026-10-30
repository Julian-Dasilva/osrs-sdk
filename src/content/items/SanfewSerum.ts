import Dose1 from "../../assets/images/potions/Sanfew_serum(1).png";
import Dose2 from "../../assets/images/potions/Sanfew_serum(2).png";
import Dose3 from "../../assets/images/potions/Sanfew_serum(3).png";
import Dose4 from "../../assets/images/potions/Sanfew_serum(4).png";
import { ItemName } from "../../sdk/ItemName";
import { Player } from "../../sdk/Player";
import { DosedPotion } from "../../sdk/gear/DosedPotion";
import { SUPPLY_VALUES } from "./SupplyValues";

const DOSE_NAMES = [
  ItemName.SANFEW_SERUM_1,
  ItemName.SANFEW_SERUM_2,
  ItemName.SANFEW_SERUM_3,
  ItemName.SANFEW_SERUM_4,
] as const;

export class SanfewSerum extends DosedPotion {
  protected get doseIds() {
    return SUPPLY_VALUES.sanfew.doseIds;
  }

  protected get doseImages(): readonly [string, string, string, string] {
    return [Dose1, Dose2, Dose3, Dose4];
  }

  override get itemName(): ItemName {
    return DOSE_NAMES[this.doses - 1] ?? ItemName.SANFEW_SERUM;
  }

  override drink(player: Player): void {
    super.drink(player);
    const values = SUPPLY_VALUES.sanfew;
    for (const stat of ["attack", "strength", "defence", "range", "magic", "prayer"] as const) {
      if (player.currentStats[stat] < player.stats[stat]) {
        player.currentStats[stat] = Math.min(
          player.stats[stat],
          player.currentStats[stat] + Math.floor(player.stats[stat] * values.fraction) + values.flat,
        );
      }
    }
  }
}

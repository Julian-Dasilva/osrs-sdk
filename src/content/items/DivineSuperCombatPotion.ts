import Dose1 from "../../assets/images/potions/Divine_super_combat_potion(1).png";
import Dose2 from "../../assets/images/potions/Divine_super_combat_potion(2).png";
import Dose3 from "../../assets/images/potions/Divine_super_combat_potion(3).png";
import Dose4 from "../../assets/images/potions/Divine_super_combat_potion(4).png";
import { ItemName } from "../../sdk/ItemName";
import { Player } from "../../sdk/Player";
import { DosedPotion } from "../../sdk/gear/DosedPotion";
import { SUPPLY_VALUES } from "./SupplyValues";

export class DivineSuperCombatPotion extends DosedPotion {
  protected get doseIds() {
    return SUPPLY_VALUES.divine.doseIds;
  }

  protected get doseImages(): readonly [string, string, string, string] {
    return [Dose1, Dose2, Dose3, Dose4];
  }

  override get itemName(): ItemName {
    return ItemName.DIVINE_SUPER_COMBAT_POTION;
  }

  override canDrink(player: Player): boolean {
    return player.currentStats.hitpoint > SUPPLY_VALUES.divine.damage;
  }

  override drink(player: Player): void {
    super.drink(player);
    const values = SUPPLY_VALUES.divine;
    player.currentStats.hitpoint -= values.damage;
    player.regenTimer.boostStats(["attack", "strength", "defence"], values.fraction, values.flat);
    player.regenTimer.startDivineCombat(values.duration);
  }
}

import { SetEffect, SetEffectTypes } from "../../sdk/SetEffect";
import { ItemName } from "../../sdk/ItemName";

export class EliteVoidMeleeSetEffect extends SetEffect {
  static override effectName(): string {
    return SetEffectTypes.ELITE_VOID_MELEE;
  }

  static override itemsInSet(): ItemName[] {
    return [ItemName.VOID_MELEE_HELM, ItemName.ELITE_VOID_TOP, ItemName.ELITE_VOID_ROBE, ItemName.VOID_KNIGHT_GLOVES];
  }
}

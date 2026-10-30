import { SetEffect, SetEffectTypes } from "../../sdk/SetEffect";
import { ItemName } from "../../sdk/ItemName";

export class EliteVoidRangedSetEffect extends SetEffect {
  static override effectName(): string {
    return SetEffectTypes.ELITE_VOID_RANGED;
  }

  static override itemsInSet(): ItemName[] {
    return [ItemName.VOID_RANGER_HELM, ItemName.ELITE_VOID_TOP, ItemName.ELITE_VOID_ROBE, ItemName.VOID_KNIGHT_GLOVES];
  }
}

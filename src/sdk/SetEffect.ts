export enum SetEffectTypes {
  ELITE_VOID_MELEE = "ELITE_VOID_MELEE",
  ELITE_VOID_RANGED = "ELITE_VOID_RANGED",
  JUSTICIAR = "JUSTICIAR",
}
export class SetEffect {
  static effectName(): string {
    return "";
  }
  static itemsInSet(): string[] {
    return [];
  }
}

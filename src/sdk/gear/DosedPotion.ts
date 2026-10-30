import Vial from "../../assets/images/potions/Vial.png";
import { ImageLoader } from "../utils/ImageLoader";
import { Potion } from "./Potion";

export type PotionDoses = 1 | 2 | 3 | 4;

export abstract class DosedPotion extends Potion {
  protected abstract get doseIds(): readonly [number, number, number, number];
  protected abstract get doseImages(): readonly [string, string, string, string];

  constructor(doses: PotionDoses = 4) {
    super();
    this.doses = doses;
    this.updateInventorySprite();
  }

  override get cacheItemId(): number {
    return this.doseIds[this.doses - 1] ?? 229;
  }

  override get inventoryImage(): string {
    return this.doseImages[this.doses - 1] ?? Vial;
  }

  override updateInventorySprite(): void {
    this.inventorySprite = ImageLoader.createImage(this.inventoryImage);
  }
}

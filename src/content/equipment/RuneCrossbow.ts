"use strict";

import InventImage from "../../assets/images/equipment/Rune_crossbow.png";
import { EnchantedCrossbow } from "../weapons/EnchantedCrossbow";
import { ItemName } from "../../sdk/ItemName";
import { AttackStyleTypes, AttackStyle } from "../../sdk/AttackStylesController";

import { CACHE_ASSETS } from "../../assets/CacheAssets";
export class RuneCrossbow extends EnchantedCrossbow {
  get cacheItemId(): number {
    return CACHE_ASSETS.items.runeCrossbow.id;
  }
  constructor() {
    super();
    this.bonuses = {
      attack: {
        stab: 0,
        slash: 0,
        crush: 0,
        magic: 0,
        range: 90,
      },
      defence: {
        stab: 0,
        slash: 0,
        crush: 0,
        magic: 0,
        range: 0,
      },
      other: {
        meleeStrength: 0,
        rangedStrength: 20,
        magicDamage: 0,
        prayer: 0,
      },
      targetSpecific: {
        undead: 0,
        slayer: 0,
      },
    };
  }

  compatibleAmmo(): ItemName[] {
    return [ItemName.RUBY_BOLTS_E, ItemName.DIAMOND_BOLTS_E];
  }

  attackStyles() {
    return [AttackStyle.ACCURATE, AttackStyle.RAPID, AttackStyle.LONGRANGE];
  }

  attackStyleCategory(): AttackStyleTypes {
    return AttackStyleTypes.CROSSBOW;
  }

  defaultStyle(): AttackStyle {
    return AttackStyle.RAPID;
  }

  get weight(): number {
    return 6;
  }

  get itemName(): ItemName {
    return ItemName.RUNE_CROSSBOW;
  }

  get isTwoHander(): boolean {
    return false;
  }

  get attackRange() {
    if (this.attackStyle() === AttackStyle.LONGRANGE) {
      return 9;
    }
    return 7;
  }

  get attackSpeed() {
    if (this.attackStyle() === AttackStyle.LONGRANGE) {
      return 6;
    }
    return 5;
  }

  get inventoryImage() {
    return InventImage;
  }
}

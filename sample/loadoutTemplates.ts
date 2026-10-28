import { CACHE_ASSETS } from "../src";
import type { Loadout as LoadoutData } from "../src";

const sampleInventory = [
  CACHE_ASSETS.items.saradominBrew.id,
  CACHE_ASSETS.items.superCombatPotion.id,
  CACHE_ASSETS.items.bastionPotion.id,
  CACHE_ASSETS.items.superRestore.id,
  ...Array<null>(24).fill(null),
];

export const loadoutTemplates: LoadoutData[] = [
  {
    name: "Melee",
    equipment: {
      weapon: CACHE_ASSETS.items.scytheOfVitur.id,
      offhand: null,
      helmet: CACHE_ASSETS.items.torvaFullHelm.id,
      necklace: CACHE_ASSETS.items.amuletOfRancour.id,
      chest: CACHE_ASSETS.items.oathplateChest.id,
      legs: CACHE_ASSETS.items.oathplateLegs.id,
      feet: CACHE_ASSETS.items.avernicTreadsMax.id,
      gloves: CACHE_ASSETS.items.ferociousGloves.id,
      ring: CACHE_ASSETS.items.ultorRing.id,
      cape: CACHE_ASSETS.items.infernalCape.id,
      ammo: CACHE_ASSETS.items.dragonArrows.id,
    },
    inventory: sampleInventory,
  },
  {
    name: "Ranged",
    equipment: {
      weapon: CACHE_ASSETS.items.twistedBow.id,
      offhand: null,
      helmet: CACHE_ASSETS.items.masoriMaskF.id,
      necklace: CACHE_ASSETS.items.necklaceOfAnguish.id,
      chest: CACHE_ASSETS.items.masoriBodyF.id,
      legs: CACHE_ASSETS.items.masoriChapsF.id,
      feet: CACHE_ASSETS.items.pegasianBoots.id,
      gloves: CACHE_ASSETS.items.zaryteVambraces.id,
      ring: CACHE_ASSETS.items.ringOfEndurance.id,
      cape: CACHE_ASSETS.items.dizanasQuiver.id,
      ammo: CACHE_ASSETS.items.dragonArrows.id,
    },
    inventory: sampleInventory,
  },
  {
    name: "Full Crystal",
    equipment: {
      weapon: CACHE_ASSETS.items.bowOfFaerdhinen.id,
      offhand: null,
      helmet: CACHE_ASSETS.items.crystalHelm.id,
      necklace: CACHE_ASSETS.items.necklaceOfAnguish.id,
      chest: CACHE_ASSETS.items.crystalBody.id,
      legs: CACHE_ASSETS.items.crystalLegs.id,
      feet: CACHE_ASSETS.items.pegasianBoots.id,
      gloves: CACHE_ASSETS.items.zaryteVambraces.id,
      ring: CACHE_ASSETS.items.ringOfEndurance.id,
      cape: CACHE_ASSETS.items.dizanasQuiver.id,
      ammo: CACHE_ASSETS.items.dragonArrows.id,
    },
    inventory: sampleInventory,
  },
];

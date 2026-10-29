import { CACHE_ASSETS, defineSimLoadouts } from "../src";

const { items } = CACHE_ASSETS;

const sampleInventory = [
  items.saradominBrew.id,
  items.superCombatPotion.id,
  items.bastionPotion.id,
  items.superRestore.id,
  ...Array<null>(24).fill(null),
];

export const SAMPLE_LOADOUTS = defineSimLoadouts({
  sim: "sample",
  items: [],
  presets: [
    {
      id: "Melee",
      label: "Melee",
      revision: 1,
      loadout: {
        equipment: {
          weapon: items.scytheOfVitur.id,
          offhand: null,
          helmet: items.torvaFullHelm.id,
          necklace: items.amuletOfRancour.id,
          chest: items.oathplateChest.id,
          legs: items.oathplateLegs.id,
          feet: items.avernicTreadsMax.id,
          gloves: items.ferociousGloves.id,
          ring: items.ultorRing.id,
          cape: items.infernalCape.id,
          ammo: items.dragonArrows.id,
        },
        inventory: sampleInventory,
      },
      startOptions: [],
    },
    {
      id: "Ranged",
      label: "Ranged",
      revision: 1,
      loadout: {
        equipment: {
          weapon: items.twistedBow.id,
          offhand: null,
          helmet: items.masoriMaskF.id,
          necklace: items.necklaceOfAnguish.id,
          chest: items.masoriBodyF.id,
          legs: items.masoriChapsF.id,
          feet: items.pegasianBoots.id,
          gloves: items.zaryteVambraces.id,
          ring: items.ringOfEndurance.id,
          cape: items.dizanasQuiver.id,
          ammo: items.dragonArrows.id,
        },
        inventory: sampleInventory,
      },
      startOptions: [],
    },
    {
      id: "Full Crystal",
      label: "Full Crystal",
      revision: 1,
      loadout: {
        equipment: {
          weapon: items.bowOfFaerdhinen.id,
          offhand: null,
          helmet: items.crystalHelm.id,
          necklace: items.necklaceOfAnguish.id,
          chest: items.crystalBody.id,
          legs: items.crystalLegs.id,
          feet: items.pegasianBoots.id,
          gloves: items.zaryteVambraces.id,
          ring: items.ringOfEndurance.id,
          cape: items.dizanasQuiver.id,
          ammo: items.dragonArrows.id,
        },
        inventory: sampleInventory,
      },
      startOptions: [],
    },
  ],
  defaultPreset: "Melee",
  supplyStock: [
    { id: items.saradominBrew.id, quantity: 4 },
    { id: items.superRestore.id, quantity: 3 },
  ],
  startOptions: [],
});

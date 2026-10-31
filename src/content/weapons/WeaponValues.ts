import type { UnitBonuses } from "../../sdk/Unit";

export const WEAPON_VALUES = {
  dragonWarhammer: {
    source: "https://oldschool.runescape.wiki/w/Dragon_warhammer?oldid=15362680",
    bonuses: {
      attack: {
        stab: -4,
        slash: -4,
        crush: 95,
        magic: -4,
        range: 0,
      },
      defence: {
        stab: 0,
        slash: 0,
        crush: 0,
        magic: 0,
        range: 0,
      },
      other: {
        meleeStrength: 85,
        rangedStrength: 0,
        magicDamage: 0,
        prayer: 0,
      },
      targetSpecific: {
        undead: 0,
        slayer: 0,
      },
    },
  },
  emberlight: {
    source: "https://oldschool.runescape.wiki/w/Emberlight?oldid=15358485",
    bonuses: {
      attack: {
        stab: 63,
        slash: 70,
        crush: 0,
        magic: 0,
        range: 0,
      },
      defence: {
        stab: 0,
        slash: 3,
        crush: 2,
        magic: 5,
        range: 0,
      },
      other: {
        meleeStrength: 13,
        rangedStrength: 0,
        magicDamage: 0,
        prayer: 0,
      },
      targetSpecific: {
        undead: 0,
        slayer: 0,
      },
    },
  },
  zaryteCrossbow: {
    source: "https://oldschool.runescape.wiki/w/Zaryte_crossbow?oldid=15382611",
    bonuses: {
      attack: {
        stab: 0,
        slash: 0,
        crush: 0,
        magic: 0,
        range: 110,
      },
      defence: {
        stab: 14,
        slash: 14,
        crush: 12,
        magic: 15,
        range: 16,
      },
      other: {
        meleeStrength: 0,
        rangedStrength: 0,
        magicDamage: 0,
        prayer: 1,
      },
      targetSpecific: {
        undead: 0,
        slayer: 0,
      },
    },
  },
  dragonCrossbow: {
    source: "https://oldschool.runescape.wiki/w/Dragon_crossbow?oldid=15352978",
    bonuses: {
      attack: {
        stab: 0,
        slash: 0,
        crush: 0,
        magic: 0,
        range: 94,
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
        rangedStrength: 0,
        magicDamage: 0,
        prayer: 0,
      },
      targetSpecific: {
        undead: 0,
        slayer: 0,
      },
    },
  },
  scorchingBow: {
    source: "https://oldschool.runescape.wiki/w/Scorching_bow?oldid=15317455",
    bonuses: {
      attack: {
        stab: 0,
        slash: 0,
        crush: 0,
        magic: 0,
        range: 124,
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
        rangedStrength: 40,
        magicDamage: 0,
        prayer: 0,
      },
      targetSpecific: {
        undead: 0,
        slayer: 0,
      },
    },
  },
  lightbearer: {
    source: "https://oldschool.runescape.wiki/w/Lightbearer?oldid=15299656",
    bonuses: {
      attack: {
        stab: 0,
        slash: 0,
        crush: 0,
        magic: 0,
        range: 0,
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
        rangedStrength: 0,
        magicDamage: 0,
        prayer: 0,
      },
      targetSpecific: {
        undead: 0,
        slayer: 0,
      },
    },
  },
  soulreaperAxe: {
    source: "https://oldschool.runescape.wiki/w/Soulreaper_axe?oldid=15381771",
    bonuses: {
      attack: {
        stab: 28,
        slash: 134,
        crush: 66,
        magic: 0,
        range: 0,
      },
      defence: {
        stab: 0,
        slash: 0,
        crush: 0,
        magic: 0,
        range: 0,
      },
      other: {
        meleeStrength: 125,
        rangedStrength: 0,
        magicDamage: 0,
        prayer: 0,
      },
      targetSpecific: {
        undead: 0,
        slayer: 0,
      },
    },
  },
  ascensionCrossbows: {
    source: "https://oldschool.runescape.wiki/w/Ascension_crossbows?oldid=15385929",
    bonuses: {
      attack: {
        stab: 0,
        slash: 0,
        crush: 0,
        magic: 3,
        range: 34,
      },
      defence: {
        stab: -7,
        slash: -5,
        crush: 0,
        magic: 10,
        range: 0,
      },
      other: {
        meleeStrength: 0,
        rangedStrength: 0,
        magicDamage: 0,
        prayer: 0,
      },
      targetSpecific: {
        undead: 0,
        slayer: 0,
      },
    },
  },
  obligator: {
    source: "https://oldschool.runescape.wiki/w/Obligator?oldid=15386629",
    bonuses: {
      attack: {
        stab: 22,
        slash: -8,
        crush: 120,
        magic: 0,
        range: 0,
      },
      defence: {
        stab: 0,
        slash: 16,
        crush: 0,
        magic: 3,
        range: 8,
      },
      other: {
        meleeStrength: 40,
        rangedStrength: 0,
        magicDamage: 0,
        prayer: 3,
      },
      targetSpecific: {
        undead: 0,
        slayer: 0,
      },
    },
  },
} as const;

export function weaponBonuses(key: keyof typeof WEAPON_VALUES): UnitBonuses {
  const { attack, defence, other, targetSpecific } = WEAPON_VALUES[key].bonuses;
  return { attack: { ...attack }, defence: { ...defence }, other: { ...other }, targetSpecific: { ...targetSpecific } };
}

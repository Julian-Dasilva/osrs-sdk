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
  dragonWarhammerCr: {
    source: "https://oldschool.runescape.wiki/w/Dragon_warhammer_(cr)?oldid=15191336",
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
  sanguineScytheOfVitur: {
    source: "https://oldschool.runescape.wiki/w/Sanguine_scythe_of_Vitur?oldid=15345737",
    bonuses: {
      attack: {
        stab: 70,
        slash: 125,
        crush: 30,
        magic: -6,
        range: 0,
      },
      defence: {
        stab: -2,
        slash: 8,
        crush: 10,
        magic: 0,
        range: 0,
      },
      other: {
        meleeStrength: 75,
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
  amuletOfBloodFury: {
    source: "https://oldschool.runescape.wiki/w/Amulet_of_blood_fury?oldid=15355928",
    bonuses: {
      attack: {
        stab: 10,
        slash: 10,
        crush: 10,
        magic: 10,
        range: 10,
      },
      defence: {
        stab: 15,
        slash: 15,
        crush: 15,
        magic: 15,
        range: 15,
      },
      other: {
        meleeStrength: 8,
        rangedStrength: 0,
        magicDamage: 0,
        prayer: 5,
      },
      targetSpecific: {
        undead: 0,
        slayer: 0,
      },
    },
  },
  blessedDizanasQuiver: {
    source: "https://oldschool.runescape.wiki/w/Blessed_Dizana's_quiver?oldid=15357222",
    bonuses: {
      attack: {
        stab: 0,
        slash: 0,
        crush: 0,
        magic: 0,
        range: 18,
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
        rangedStrength: 3,
        magicDamage: 0,
        prayer: 0,
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

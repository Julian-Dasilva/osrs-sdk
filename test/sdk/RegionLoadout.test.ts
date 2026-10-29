import { Player } from "../../src/sdk/Player";
import { Settings } from "../../src/sdk/Settings";
import { Viewport } from "../../src/sdk/Viewport";
import { World } from "../../src/sdk/World";
import type { Item } from "../../src/sdk/Item";
import type { Loadout } from "../../src/sdk/Loadout";
import { TestRegion } from "../../src/sdk/testing/TestRegion";
import { loadoutTemplates as sampleTemplates } from "../../sample/loadoutTemplates";
import {
  AbyssalTentacle,
  AhrimsRobeskirt,
  AhrimsRobetop,
  AmuletOfFury,
  AmuletOfRancour,
  AmuletOfTorture,
  AncestralRobebottom,
  AncestralRobetop,
  AncientStaff,
  AraneaBoots,
  ArmadylBrew,
  ArmadylChainskirt,
  ArmadylChestplate,
  AvasAccumulator,
  AvasAssembler,
  AvernicDefender,
  AvernicTreadsMax,
  BarrowsGloves,
  BastionPotion,
  BerserkerRing_i,
  BlackChinchompa,
  BlackDhideBody,
  BlackDhideChaps,
  BlackDhideVambraces,
  BladeOfSaeldor,
  Blowpipe,
  BowOfFaerdhinen,
  ConflictionGauntlets,
  CrystalBody,
  CrystalHelm,
  CrystalLegs,
  CrystalShield,
  DagonhaiRobeTop,
  DevoutBoots,
  DiamondBoltsE,
  DizanasQuiver,
  DragonArrows,
  DragonClaws,
  DragonDefender,
  EyeOfAyak,
  FerociousGloves,
  GuthixRobeTop,
  HolyBlessing,
  InfernalCape,
  JusticiarChestguard,
  JusticiarFaceguard,
  JusticiarLegguards,
  KodaiWand,
  MagesBook,
  MasoriBodyF,
  MasoriChapsF,
  MasoriMaskF,
  NecklaceOfAnguish,
  NecklaceOfRupture,
  NoxiousHalberd,
  OathplateChest,
  OathplateHelm,
  OathplateLegs,
  OccultNecklace,
  PegasianBoots,
  PrimordialBoots,
  RangerBoots,
  RingOfEndurance,
  RingOfSufferingImbued,
  RobinHoodHat,
  RubyBoltsE,
  RuneCrossbow,
  RuneKiteshield,
  SaradominBody,
  SaradominBrew,
  SaradominChaps,
  SaradominCoif,
  SaradominDhideBoots,
  ScytheOfVitur,
  SeekingDragonArrows,
  SlayerHelmet,
  StaminaPotion,
  SuperCombatPotion,
  SuperRestore,
  TorvaFullhelm,
  TorvaPlatebody,
  TorvaPlatelegs,
  TumekensShadow,
  TwistedBow,
  UltorRing,
  VenatorBow,
  VenatorRing,
  ZaryteVambraces,
  ZombieAxe,
} from "../../src/content";

type ItemClass = new () => Item;

// Literal item ids, kept apart from the classes under test so a class with a wrong id fails here.
const SDK_ITEM_IDS: readonly (readonly [ItemClass, number])[] = [
  [AhrimsRobeskirt, 4714],
  [AhrimsRobetop, 4712],
  [AmuletOfFury, 6585],
  [AmuletOfTorture, 19553],
  [AmuletOfRancour, 29801],
  [AncestralRobebottom, 21024],
  [AncestralRobetop, 21021],
  [AraneaBoots, 29806],
  [ArmadylChainskirt, 11830],
  [ArmadylChestplate, 11828],
  [AvasAccumulator, 10499],
  [AvasAssembler, 22109],
  [AvernicDefender, 22322],
  [AvernicTreadsMax, 31097],
  [BarrowsGloves, 7462],
  [BerserkerRing_i, 11773],
  [BlackDhideBody, 2503],
  [BlackDhideChaps, 2497],
  [BlackDhideVambraces, 2491],
  [CrystalBody, 23975],
  [CrystalHelm, 23971],
  [CrystalLegs, 23979],
  [CrystalShield, 23991],
  [DagonhaiRobeTop, 24291],
  [DevoutBoots, 22954],
  [DiamondBoltsE, 9243],
  [DizanasQuiver, 28951],
  [DragonArrows, 11212],
  [SeekingDragonArrows, 33595],
  [DragonDefender, 12954],
  [FerociousGloves, 22981],
  [GuthixRobeTop, 10462],
  [HolyBlessing, 20220],
  [InfernalCape, 21295],
  [JusticiarChestguard, 22327],
  [JusticiarFaceguard, 22326],
  [JusticiarLegguards, 22328],
  [MagesBook, 6889],
  [MasoriBodyF, 27238],
  [MasoriChapsF, 27241],
  [MasoriMaskF, 27235],
  [NecklaceOfAnguish, 19547],
  [NecklaceOfRupture, 33639],
  [OccultNecklace, 12002],
  [PegasianBoots, 13237],
  [PrimordialBoots, 13239],
  [RangerBoots, 2577],
  [RingOfEndurance, 24736],
  [VenatorRing, 28310],
  [RingOfSufferingImbued, 19710],
  [RobinHoodHat, 2581],
  [RubyBoltsE, 9242],
  [RuneCrossbow, 9185],
  [RuneKiteshield, 1201],
  [SaradominBody, 10386],
  [SaradominChaps, 10388],
  [SaradominCoif, 10390],
  [SaradominDhideBoots, 19933],
  [SlayerHelmet, 11865],
  [TorvaFullhelm, 26382],
  [TorvaPlatebody, 26384],
  [TorvaPlatelegs, 26386],
  [OathplateHelm, 30750],
  [OathplateChest, 30753],
  [OathplateLegs, 30756],
  [UltorRing, 25485],
  [ZaryteVambraces, 26235],
  [ConflictionGauntlets, 31106],
  [BastionPotion, 22461],
  [SaradominBrew, 6685],
  [StaminaPotion, 12625],
  [SuperCombatPotion, 12695],
  [SuperRestore, 3024],
  [ArmadylBrew, 31650],
  [AbyssalTentacle, 12006],
  [AncientStaff, 4675],
  [BlackChinchompa, 11959],
  [BladeOfSaeldor, 23995],
  [Blowpipe, 12926],
  [DragonClaws, 13652],
  [BowOfFaerdhinen, 25865],
  [KodaiWand, 21006],
  [NoxiousHalberd, 29796],
  [ScytheOfVitur, 22325],
  [TwistedBow, 20997],
  [EyeOfAyak, 31113],
  [TumekensShadow, 27275],
  [VenatorBow, 27612],
  [ZombieAxe, 28810],
];

const STAND_INS: readonly (readonly [ItemClass, number, number])[] = [
  [DragonArrows, 11212, 11212],
  [SeekingDragonArrows, 33595, 11212],
  [NecklaceOfAnguish, 19547, 19547],
  [NecklaceOfRupture, 33639, 19547],
];

const EMPTY_EQUIPMENT: Loadout["equipment"] = {
  weapon: null,
  offhand: null,
  helmet: null,
  necklace: null,
  chest: null,
  legs: null,
  feet: null,
  gloves: null,
  ring: null,
  cape: null,
  ammo: null,
};

function inventoryOf(ids: readonly number[]): (number | null)[] {
  return [...ids, ...Array<null>(28 - ids.length).fill(null)];
}

class LoadoutRegion extends TestRegion {
  constructor(templates: readonly Loadout[]) {
    super(10, 10, templates);
    this.world = new World();
  }

  override initialiseRegion() {
    const player = new Player(this, { x: 2, y: 2 });
    this.addPlayer(player);
    return { player };
  }
}

function dress(templates: readonly Loadout[], selected: string): Player {
  Settings.loadout = selected;
  return new LoadoutRegion(templates).reset(false).player;
}

function wornClasses(player: Player) {
  const worn: Record<string, unknown> = {};
  for (const slot of Object.keys(EMPTY_EQUIPMENT)) worn[slot] = player.equipment[slot]?.constructor ?? null;
  return worn;
}

function carriedClasses(player: Player) {
  return player.inventory.map((item) => item?.constructor ?? null);
}

beforeAll(() => {
  // The viewport draws to a canvas jsdom lacks; dressing never reads it.
  Viewport.viewport = { reset: jest.fn(), setPlayer: jest.fn() } as never;
});

beforeEach(() => {
  Settings.customLoadout = null;
});

describe("SDK item catalog through Region templates", () => {
  const dressedById = new Map<number, unknown>();

  beforeAll(() => {
    for (let start = 0; start < SDK_ITEM_IDS.length; start += 28) {
      const rows = SDK_ITEM_IDS.slice(start, start + 28);
      const name = `items from ${start}`;
      const player = dress(
        [{ name, equipment: EMPTY_EQUIPMENT, inventory: inventoryOf(rows.map(([, id]) => id)) }],
        name,
      );
      rows.forEach(([, id], index) => dressedById.set(id, player.inventory[index]?.constructor ?? null));
    }
  });

  test.each(STAND_INS.map(([ItemType, id, drawnAs]) => [ItemType.name, id, drawnAs, ItemType] as const))(
    "%s (%i) dresses as itself, drawn as %i",
    (_, id, drawnAs, ItemType) => {
      expect(dressedById.get(id)).toBe(ItemType);
      const player = dress([{ name: "one", equipment: EMPTY_EQUIPMENT, inventory: inventoryOf([id]) }], "one");
      expect(player.inventory[0]?.cacheItemId).toBe(drawnAs);
    },
  );

  const standInClasses = new Set(STAND_INS.map(([ItemType]) => ItemType));
  test.each(
    SDK_ITEM_IDS.filter(([ItemType]) => !standInClasses.has(ItemType)).map(
      ([ItemType, id]) => [ItemType.name, id, ItemType] as const,
    ),
  )("guard: %s (%i) dresses as itself", (_, id, ItemType) => {
    expect(dressedById.get(id)).toBe(ItemType);
  });
});

describe("Region loadout templates", () => {
  const ranged: Loadout = {
    name: "Ranged",
    equipment: { ...EMPTY_EQUIPMENT, weapon: 20997, helmet: 27235, chest: 27238, legs: 27241, cape: 28951 },
    inventory: inventoryOf([6685, 3024, 22325]),
  };

  test("a template with an unknown id is refused, naming every id and slot", () => {
    const broken: Loadout = {
      name: "Broken",
      equipment: { ...ranged.equipment, weapon: 99999 },
      inventory: inventoryOf([6685, 3024, 22325, 88888]),
    };

    expect(() => new LoadoutRegion([ranged, broken])).toThrow(
      'Loadout "Broken" refused: unknown item 99999 in equipment.weapon; unknown item 88888 in inventory[3]',
    );
  });

  test("guard: a valid template dresses the items it names", () => {
    const player = dress([ranged], "Ranged");

    expect(wornClasses(player)).toEqual({
      ...EMPTY_EQUIPMENT,
      weapon: TwistedBow,
      helmet: MasoriMaskF,
      chest: MasoriBodyF,
      legs: MasoriChapsF,
      cape: DizanasQuiver,
    });
    expect(carriedClasses(player)).toEqual([SaradominBrew, SuperRestore, ScytheOfVitur, ...Array(25).fill(null)]);
  });

  test("guard: a custom loadout that parses replaces its template", () => {
    Settings.customLoadout = { ...ranged, equipment: { ...ranged.equipment, weapon: 25865 } };

    expect(dress([ranged], "Ranged").equipment.weapon).toBeInstanceOf(BowOfFaerdhinen);
  });

  test("a custom loadout with an unknown id falls back to its template and says why", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    Settings.customLoadout = { ...ranged, equipment: { ...ranged.equipment, weapon: 99999 } };

    const player = dress([ranged], "Ranged");

    expect(player.equipment.weapon).toBeInstanceOf(TwistedBow);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("unknown item 99999 in equipment.weapon"));
    warn.mockRestore();
  });

  test("the sample app's templates dress the items they name", () => {
    const potions = [SaradominBrew, SuperCombatPotion, BastionPotion, SuperRestore, ...Array(24).fill(null)];
    const dressed = sampleTemplates.map(({ name }) => {
      const player = dress(sampleTemplates, name);
      return { name, worn: wornClasses(player), carried: carriedClasses(player) };
    });

    expect(dressed).toEqual([
      {
        name: "Melee",
        worn: {
          weapon: ScytheOfVitur,
          offhand: null,
          helmet: TorvaFullhelm,
          necklace: AmuletOfRancour,
          chest: OathplateChest,
          legs: OathplateLegs,
          feet: AvernicTreadsMax,
          gloves: FerociousGloves,
          ring: UltorRing,
          cape: InfernalCape,
          ammo: DragonArrows,
        },
        carried: potions,
      },
      {
        name: "Ranged",
        worn: {
          weapon: TwistedBow,
          offhand: null,
          helmet: MasoriMaskF,
          necklace: NecklaceOfAnguish,
          chest: MasoriBodyF,
          legs: MasoriChapsF,
          feet: PegasianBoots,
          gloves: ZaryteVambraces,
          ring: RingOfEndurance,
          cape: DizanasQuiver,
          ammo: DragonArrows,
        },
        carried: potions,
      },
      {
        name: "Full Crystal",
        worn: {
          weapon: BowOfFaerdhinen,
          offhand: null,
          helmet: CrystalHelm,
          necklace: NecklaceOfAnguish,
          chest: CrystalBody,
          legs: CrystalLegs,
          feet: PegasianBoots,
          gloves: ZaryteVambraces,
          ring: RingOfEndurance,
          cape: DizanasQuiver,
          ammo: DragonArrows,
        },
        carried: potions,
      },
    ]);
  });
});

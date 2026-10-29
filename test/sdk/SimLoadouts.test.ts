import { SaradominBrew, ScytheOfVitur, SuperRestore, TwistedBow } from "../../src/content";
import { Settings } from "../../src/sdk/Settings";
import { defineSimLoadouts } from "../../src/sdk/SimLoadouts";
import type { SimLoadoutsDefinition } from "../../src/sdk/SimLoadouts";

const NOTHING_WORN = {
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
const bag = (...ids: (number | null)[]) => [...ids, ...Array<null>(28 - ids.length).fill(null)];

const MELEE = {
  id: "melee",
  label: "Melee",
  revision: 1,
  loadout: { equipment: { ...NOTHING_WORN, weapon: 22325 }, inventory: bag(20997, 6685, 3024) },
  startOptions: ["bow"],
};
const BARE = {
  id: "bare",
  label: "Bare",
  revision: 1,
  loadout: { equipment: { ...NOTHING_WORN, weapon: 22325 }, inventory: bag(6685) },
  startOptions: [],
};

const DEFINITION: SimLoadoutsDefinition = {
  sim: "test-sim",
  items: [],
  presets: [MELEE, BARE],
  defaultPreset: "melee",
  supplyStock: [
    { id: 6685, quantity: 4 },
    { id: 3024, quantity: 2 },
  ],
  startOptions: [{ id: "bow", label: "Twisted bow", wear: [20997] }],
};

function ids(loadout: {
  equipment: Record<string, { id: number } | null>;
  inventory: readonly ({ id: number } | null)[];
}) {
  const equipment: Record<string, number | null> = {};
  for (const slot of Object.keys(loadout.equipment)) equipment[slot] = loadout.equipment[slot]?.id ?? null;
  return { equipment, inventory: loadout.inventory.map((item) => item?.id ?? null) };
}

beforeEach(() => {
  window.localStorage.clear();
  Settings._isMobileResult = false;
  Settings.readFromStorage();
});

describe("defineSimLoadouts", () => {
  test("resolves presets and supplies, and its store starts on the default preset", () => {
    const sim = defineSimLoadouts(DEFINITION);

    const active = sim.store(window.localStorage).active();

    expect(active.preset.id).toBe("melee");
    expect(ids(active.loadout)).toEqual(MELEE.loadout);
    expect(sim.presets.map((preset) => preset.loadout.equipment.weapon?.build())).toEqual([
      expect.any(ScytheOfVitur),
      expect.any(ScytheOfVitur),
    ]);
    expect(sim.supplyStock.map(({ item, quantity }) => [item.build(), quantity])).toEqual([
      [expect.any(SaradominBrew), 4],
      [expect.any(SuperRestore), 2],
    ]);
  });

  test("builds its store when asked, so the store reads Settings loaded after the sim was defined", () => {
    const sim = defineSimLoadouts(DEFINITION);
    Settings.loadout = "bare";
    Settings.customLoadout = { name: "bare", equipment: { ...NOTHING_WORN, weapon: 22325 }, inventory: bag(3024) };

    const active = sim.store(window.localStorage).active();

    expect(active.preset.id).toBe("bare");
    expect(active.source).toBe("edit");
    expect(ids(active.loadout).inventory).toEqual(bag(3024));
  });

  test("throws on a preset that fails to parse, naming the preset, item and slot", () => {
    const broken = { ...BARE, loadout: { ...BARE.loadout, inventory: bag(6685, null, null, 99999) } };

    expect(() => defineSimLoadouts({ ...DEFINITION, presets: [MELEE, broken] })).toThrow(
      /Preset "bare" refused: unknown item 99999 in inventory\[3\]/,
    );
  });

  test("throws on a supply stocked twice", () => {
    const supplyStock = [...DEFINITION.supplyStock, { id: 6685, quantity: 1 }];

    expect(() => defineSimLoadouts({ ...DEFINITION, supplyStock })).toThrow(/Supply 6685 .* is stocked twice/);
  });

  test("throws on a supply that is not a carried item", () => {
    expect(() => defineSimLoadouts({ ...DEFINITION, supplyStock: [{ id: 99999, quantity: 1 }] })).toThrow(
      /Supply 99999 is not an item/,
    );
    expect(() => defineSimLoadouts({ ...DEFINITION, supplyStock: [{ id: 20997, quantity: 1 }] })).toThrow(
      /Supply 20997 .* is worn, not carried/,
    );
  });

  test("throws on a default preset that is not one of the presets", () => {
    expect(() => defineSimLoadouts({ ...DEFINITION, defaultPreset: "max" })).toThrow(
      /Default preset "max" is not one of the presets/,
    );
  });

  test("throws on two presets with one id", () => {
    expect(() => defineSimLoadouts({ ...DEFINITION, presets: [MELEE, { ...BARE, id: "melee" }] })).toThrow(
      /Preset "melee" is defined twice/,
    );
  });

  test("throws when a preset offers a start option it cannot start with", () => {
    const presets = [MELEE, { ...BARE, startOptions: ["bow"] }];

    expect(() => defineSimLoadouts({ ...DEFINITION, presets })).toThrow(
      /Preset "bare" offers start option "bow", which it cannot start with: item 20997 is not carried/,
    );
  });

  test("throws when a preset offers a start option that is not defined", () => {
    const presets = [{ ...MELEE, startOptions: ["blowpipe"] }, BARE];

    expect(() => defineSimLoadouts({ ...DEFINITION, presets })).toThrow(
      /Preset "melee" offers unknown start option "blowpipe"/,
    );
  });

  test("start wears an option the preset offers and refuses one it does not", () => {
    const sim = defineSimLoadouts(DEFINITION);
    const [melee, bare] = sim.presets;

    const bow = sim.start({ preset: melee, loadout: melee.loadout }, "bow");
    const notOffered = sim.start({ preset: bare, loadout: melee.loadout }, "bow");

    expect(bow.kind === "started" && bow.loadout.equipment.weapon?.build()).toEqual(expect.any(TwistedBow));
    expect(bow.kind === "started" && ids(bow.loadout).inventory).toEqual(bag(22325, 6685, 3024));
    expect(notOffered).toEqual({ kind: "refused", rejections: [{ kind: "not-offered", option: "bow" }] });
  });
});

import { MasoriMaskF, SaradominBrew, ScytheOfVitur, SuperRestore, TwistedBow } from "../../src/content";
import { ItemCatalog } from "../../src/sdk/ItemCatalog";
import { parseLoadout } from "../../src/sdk/Loadout";
import type { CatalogLoadout } from "../../src/sdk/Loadout";
import { LoadoutStore, presetId } from "../../src/sdk/LoadoutStore";
import type { Preset } from "../../src/sdk/LoadoutStore";
import { SETTINGS_STORAGE_KEY, Settings } from "../../src/sdk/Settings";

const catalog = new ItemCatalog([TwistedBow, ScytheOfVitur, MasoriMaskF, SaradominBrew, SuperRestore]);
const KEY = "osrs-sdk:loadouts:test-sim";

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
const bag = (...ids: (number | null)[]) => [...ids, ...Array(28 - ids.length).fill(null)];

const MAX_IDS = { equipment: { ...NOTHING_WORN, weapon: 20997, helmet: 27235 }, inventory: bag(6685, 3024) };
const MELEE_IDS = { equipment: { ...NOTHING_WORN, weapon: 22325 }, inventory: bag(3024) };
const EDIT_IDS = { equipment: { ...NOTHING_WORN, weapon: 22325 }, inventory: bag(6685, 6685) };

function loadout(ids: unknown): CatalogLoadout {
  const parsed = parseLoadout(catalog, ids);
  if (parsed.kind === "refused") throw new Error(`fixture refused: ${JSON.stringify(parsed.rejections)}`);
  return parsed.loadout;
}

const MAX: Preset = { id: presetId("max"), label: "Max", revision: 2, loadout: loadout(MAX_IDS) };
const MELEE: Preset = { id: presetId("melee"), label: "Melee", revision: 1, loadout: loadout(MELEE_IDS) };

function open(storage: Pick<Storage, "getItem" | "setItem"> = window.localStorage) {
  return new LoadoutStore({ sim: "test-sim", catalog, presets: [MAX, MELEE], defaultPreset: MAX.id, storage });
}

function ids(loaded: CatalogLoadout) {
  const equipment = {};
  for (const slot of Object.keys(loaded.equipment)) equipment[slot] = loaded.equipment[slot]?.id ?? null;
  return { equipment, inventory: loaded.inventory.map((item) => item?.id ?? null) };
}

function observe(store: LoadoutStore) {
  const { preset, loadout: loaded, ...rest } = store.active();
  return { ...rest, preset: preset.id, ...ids(loaded) };
}

const stored = (values: unknown, version = 1) => JSON.stringify({ version, values });
const storedValues = () => JSON.parse(window.localStorage.getItem(KEY)).values;

beforeEach(() => {
  window.localStorage.clear();
  Settings._isMobileResult = false;
  Settings.readFromStorage();
});

describe("LoadoutStore", () => {
  test("starts on the default preset and keeps the selected one across reloads", () => {
    const store = open();
    expect(observe(store)).toEqual({ preset: "max", source: "preset", storage: "kept", refusedEdit: [], ...MAX_IDS });

    store.select(MELEE.id);

    expect(storedValues()).toEqual({ selected: "melee", edits: {} });
    expect(observe(open())).toEqual({
      preset: "melee",
      source: "preset",
      storage: "kept",
      refusedEdit: [],
      ...MELEE_IDS,
    });
  });

  test("a saved edit loads after a reload, and Reset returns to the preset", () => {
    open().save(MAX.id, loadout(EDIT_IDS));

    expect(storedValues()).toEqual({ selected: "max", edits: { max: { presetRevision: 2, loadout: EDIT_IDS } } });
    const reloaded = open();
    expect(observe(reloaded)).toEqual({
      preset: "max",
      source: "edit",
      storage: "kept",
      presetChanged: false,
      ...EDIT_IDS,
    });

    reloaded.reset(MAX.id);

    expect(storedValues()).toEqual({ selected: "max", edits: {} });
    expect(observe(open())).toEqual({ preset: "max", source: "preset", storage: "kept", refusedEdit: [], ...MAX_IDS });
  });

  test.each([
    {
      failure: "an item this release lacks",
      edit: { presetRevision: 2, loadout: { ...EDIT_IDS, inventory: bag(6685, null, null, null, 33595) } },
      reasons: [{ kind: "unknown-item", id: 33595, at: { kind: "inventory", index: 4 } }],
    },
    {
      failure: "an item in a slot it does not fit",
      edit: { presetRevision: 2, loadout: { ...EDIT_IDS, equipment: { ...NOTHING_WORN, helmet: 20997 } } },
      reasons: [{ kind: "wrong-slot", id: 20997, at: { kind: "equipment", slot: "helmet" }, fits: "weapon" }],
    },
    {
      failure: "an inventory that is not 28 long",
      edit: { presetRevision: 2, loadout: { ...EDIT_IDS, inventory: Array(24).fill(null) } },
      reasons: [{ kind: "malformed", detail: "inventory has 24 slots, expected 28" }],
    },
    {
      failure: "no preset revision",
      edit: { loadout: EDIT_IDS },
      reasons: [{ kind: "malformed", detail: "edit has no presetRevision" }],
    },
  ])("an edit with $failure starts on the preset with the reasons and stays stored", ({ edit, reasons }) => {
    const raw = stored({ selected: "max", edits: { max: edit } });
    window.localStorage.setItem(KEY, raw);
    const store = open();

    expect(observe(store)).toEqual({
      preset: "max",
      source: "preset",
      storage: "kept",
      refusedEdit: reasons,
      ...MAX_IDS,
    });
    expect(window.localStorage.getItem(KEY)).toBe(raw);

    store.save(MELEE.id, loadout(EDIT_IDS));

    expect(storedValues().edits.max).toEqual(edit);
  });

  test("unparseable JSON starts on the presets with a console warning and is never removed by a choice", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const raw = '{"version":1,"values":{"selected":"melee"';
    window.localStorage.setItem(KEY, raw);
    const store = open();

    expect(observe(store)).toEqual({ preset: "max", source: "preset", storage: "kept", refusedEdit: [], ...MAX_IDS });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain(`"${KEY}"`);

    store.select(MELEE.id);
    store.reset(MELEE.id);

    expect(observe(store).preset).toBe("melee");
    expect(window.localStorage.getItem(KEY)).toBe(raw);
    warn.mockRestore();
  });

  test("a newer version is read-only until the player saves an edit", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const raw = stored({ chosen: "melee", edits: [] }, 2);
    window.localStorage.setItem(KEY, raw);
    const store = open();

    expect(observe(store)).toEqual({ preset: "max", source: "preset", storage: "kept", refusedEdit: [], ...MAX_IDS });
    store.select(MELEE.id);
    expect(window.localStorage.getItem(KEY)).toBe(raw);

    store.save(MELEE.id, loadout(EDIT_IDS));

    expect(JSON.parse(window.localStorage.getItem(KEY))).toEqual({
      version: 1,
      values: { selected: "melee", edits: { melee: { presetRevision: 1, loadout: EDIT_IDS } } },
    });
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  test("a selected preset that is gone starts on the default and its orphan edit stays stored", () => {
    const orphan = { presetRevision: 4, loadout: EDIT_IDS };
    window.localStorage.setItem(KEY, stored({ selected: "elite", edits: { elite: orphan } }));
    const store = open();

    expect(observe(store)).toEqual({ preset: "max", source: "preset", storage: "kept", refusedEdit: [], ...MAX_IDS });

    store.save(MAX.id, loadout(EDIT_IDS));

    expect(storedValues().edits.elite).toEqual(orphan);
  });

  test.each([
    {
      refusal: "reads",
      storage: {
        getItem: () => {
          throw new DOMException("The operation is insecure.", "SecurityError");
        },
        setItem: () => {
          throw new DOMException("The operation is insecure.", "SecurityError");
        },
      },
      before: "session-only",
    },
    {
      refusal: "writes",
      storage: {
        getItem: () => null,
        setItem: () => {
          throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
        },
      },
      before: "kept",
    },
  ])("storage that refuses $refusal keeps edits for the session and says so", ({ storage, before }) => {
    // Stands in for browser storage, because jsdom's localStorage cannot refuse a read and refuses a write only past its quota.
    const store = open(storage);
    expect(observe(store).storage).toBe(before);

    store.save(MAX.id, loadout(EDIT_IDS));

    expect(observe(store)).toEqual({
      preset: "max",
      source: "edit",
      storage: "session-only",
      presetChanged: false,
      ...EDIT_IDS,
    });
  });

  test.each([
    { value: "a newer version", raw: stored({ chosen: "melee", edits: [] }, 2) },
    { value: "truncated JSON", raw: '{"version":1,"values":{"selected":"max"' },
  ])("two tabs that both loaded $value keep each other's saves to other presets", ({ raw }) => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    window.localStorage.setItem(KEY, raw);
    const first = open();
    const second = open();

    first.save(MAX.id, loadout(EDIT_IDS));
    second.save(MELEE.id, loadout(EDIT_IDS));

    expect(storedValues()).toEqual({
      selected: "max",
      edits: {
        max: { presetRevision: 2, loadout: EDIT_IDS },
        melee: { presetRevision: 1, loadout: EDIT_IDS },
      },
    });
    warn.mockRestore();
  });

  test("two tabs keep each other's edits to other presets, and the last save of one preset wins", () => {
    const first = open();
    const second = open();
    const secondMax = { equipment: { ...NOTHING_WORN, weapon: 20997 }, inventory: bag(3024, 3024) };

    first.save(MAX.id, loadout(EDIT_IDS));
    second.save(MELEE.id, loadout(EDIT_IDS));

    expect(storedValues().edits).toEqual({
      max: { presetRevision: 2, loadout: EDIT_IDS },
      melee: { presetRevision: 1, loadout: EDIT_IDS },
    });

    second.save(MAX.id, loadout(secondMax));

    expect(storedValues().edits.max).toEqual({ presetRevision: 2, loadout: secondMax });
  });

  test.each([
    { savedAt: 1, presetChanged: true },
    { savedAt: 2, presetChanged: false },
  ])(
    "an edit saved at preset revision $savedAt still loads, with presetChanged $presetChanged",
    ({ savedAt, presetChanged }) => {
      window.localStorage.setItem(
        KEY,
        stored({ selected: "max", edits: { max: { presetRevision: savedAt, loadout: EDIT_IDS } } }),
      );

      expect(observe(open())).toEqual({ preset: "max", source: "edit", storage: "kept", presetChanged, ...EDIT_IDS });
    },
  );

  test("imports the SDK's old single edit once and leaves the old setting alone", () => {
    const legacy = { name: "melee", equipment: { ...NOTHING_WORN, weapon: 20997 }, inventory: bag(6685) };
    const settings = JSON.stringify({ version: 1, values: { loadout: "melee", customLoadout: legacy } });
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, settings);
    Settings.readFromStorage();
    const store = open();

    expect(observe(store)).toEqual({
      preset: "melee",
      source: "edit",
      storage: "kept",
      presetChanged: false,
      equipment: legacy.equipment,
      inventory: legacy.inventory,
    });

    store.reset(MELEE.id);

    expect(observe(open())).toEqual({
      preset: "melee",
      source: "preset",
      storage: "kept",
      refusedEdit: [],
      ...MELEE_IDS,
    });
    expect(window.localStorage.getItem(SETTINGS_STORAGE_KEY)).toBe(settings);
    expect(Settings.customLoadout).toEqual(legacy);
  });
});

import { SDK_ITEM_CATALOG } from "../../src/content/SdkItemCatalog";
import { isItemId } from "../../src/sdk/ItemCatalog";
import type { CarriedItem, EquipmentSlot, ItemId, WornItem } from "../../src/sdk/ItemCatalog";
import { INVENTORY_INDICES, parseLoadout } from "../../src/sdk/Loadout";
import type { CatalogLoadout, Loadout } from "../../src/sdk/Loadout";
import { editLoadout, remainingStock, startWith } from "../../src/sdk/LoadoutEdit";
import type { EditorState, LoadoutEdit, StartOption, SupplyStock } from "../../src/sdk/LoadoutEdit";

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

type Ids = Readonly<{ equipment: Partial<Record<EquipmentSlot, number>>; inventory: readonly (number | null)[] }>;

function padded(inventory: readonly (number | null)[]): (number | null)[] {
  return [...inventory, ...Array<null>(28 - inventory.length).fill(null)];
}

function loadout({ equipment, inventory }: Ids): CatalogLoadout {
  const parsed = parseLoadout(SDK_ITEM_CATALOG, {
    equipment: { ...EMPTY_EQUIPMENT, ...equipment },
    inventory: padded(inventory),
  });
  if (parsed.kind === "refused") throw new Error(JSON.stringify(parsed.rejections));
  return parsed.loadout;
}

function ids({ equipment, inventory }: CatalogLoadout) {
  const worn: Record<string, number | null> = {};
  for (const slot of Object.keys(EMPTY_EQUIPMENT)) worn[slot] = equipment[slot]?.id ?? null;
  return { equipment: worn, inventory: inventory.map((item) => item?.id ?? null) };
}

function expected({ equipment, inventory }: Ids) {
  return { equipment: { ...EMPTY_EQUIPMENT, ...equipment }, inventory: padded(inventory) };
}

function worn(id: number): WornItem {
  const item = SDK_ITEM_CATALOG.get(id);
  if (!item || item.slot === "carried") throw new Error(`${id} is not worn`);
  return item;
}

function supply(id: number): CarriedItem {
  const item = SDK_ITEM_CATALOG.get(id);
  if (!item || item.slot !== "carried") throw new Error(`${id} is not carried`);
  return item;
}

function edited(state: EditorState, edit: LoadoutEdit): EditorState {
  const result = editLoadout(state, edit);
  if (result.kind === "refused") throw new Error(JSON.stringify(result.rejection));
  return result.state;
}

function left(state: EditorState) {
  return remainingStock(state.stock, state.base, state.draft).map(({ item, quantity }) => [item.id, quantity]);
}

const at = (index: number) => INVENTORY_INDICES[index];

function itemId(id: number): ItemId {
  if (!isItemId(id)) throw new Error(`${id} is not an item id`);
  return id;
}

const TWISTED_BOW = itemId(20997);
const SCYTHE = itemId(22325);
const TENTACLE = itemId(12006);
const BLADE_OF_SAELDOR = itemId(23995);
const AVERNIC_DEFENDER = itemId(22322);
const BLOWPIPE = itemId(12926);
const BREW = itemId(6685);
const RESTORE = itemId(3024);

const STOCK: SupplyStock = [
  { item: supply(BREW), quantity: 2 },
  { item: supply(RESTORE), quantity: 1 },
];

function editing(ids: Ids): EditorState {
  const base = loadout(ids);
  return { stock: STOCK, base, draft: base };
}

describe("editLoadout: the two-handed rule", () => {
  test.each([
    {
      rule: "a two-handed weapon empties the offhand",
      before: { weapon: TENTACLE, offhand: AVERNIC_DEFENDER },
      wear: SCYTHE,
      after: { weapon: SCYTHE },
    },
    {
      rule: "an offhand empties a two-handed weapon",
      before: { weapon: SCYTHE },
      wear: AVERNIC_DEFENDER,
      after: { offhand: AVERNIC_DEFENDER },
    },
    {
      rule: "a one-handed weapon keeps the offhand",
      before: { weapon: TENTACLE, offhand: AVERNIC_DEFENDER },
      wear: BLADE_OF_SAELDOR,
      after: { weapon: BLADE_OF_SAELDOR, offhand: AVERNIC_DEFENDER },
    },
  ])("$rule", ({ before, wear, after }) => {
    const state = edited(editing({ equipment: before, inventory: [] }), { kind: "equip", item: worn(wear) });

    expect(ids(state.draft)).toEqual(expected({ equipment: after, inventory: [] }));
  });
});

describe("editLoadout: supplies against the stock", () => {
  const preset: Ids = { equipment: { weapon: SCYTHE }, inventory: [BREW, null, TWISTED_BOW, null, RESTORE] };

  test("take-supply fills the first free slot and refuses past the stock", () => {
    const start = editing(preset);
    const once = edited(start, { kind: "take-supply", id: BREW });
    const twice = edited(once, { kind: "take-supply", id: BREW });

    expect(left(start)).toEqual([
      [BREW, 2],
      [RESTORE, 1],
    ]);
    expect(ids(twice.draft).inventory).toEqual(padded([BREW, BREW, TWISTED_BOW, BREW, RESTORE]));
    expect(left(twice)).toEqual([
      [BREW, 0],
      [RESTORE, 1],
    ]);
    expect(editLoadout(twice, { kind: "take-supply", id: BREW })).toEqual({
      kind: "refused",
      rejection: { kind: "over-stock", id: BREW, carried: 4, allowed: 3 },
    });
  });

  test("return-supply puts a supply back, including one the preset carried", () => {
    const taken = edited(editing(preset), { kind: "take-supply", id: RESTORE });
    const returnedTaken = edited(taken, { kind: "return-supply", index: at(1) });
    const returnedPreset = edited(returnedTaken, { kind: "return-supply", index: at(4) });

    expect(left(taken)).toEqual([
      [BREW, 2],
      [RESTORE, 0],
    ]);
    expect(ids(returnedPreset.draft).inventory).toEqual(padded([BREW, null, TWISTED_BOW]));
    expect(left(returnedPreset)).toEqual([
      [BREW, 2],
      [RESTORE, 2],
    ]);
  });

  test("carry counts against the stock like take-supply", () => {
    const state = editing(preset);
    const full = edited(edited(state, { kind: "carry", index: at(1), item: supply(BREW) }), {
      kind: "carry",
      index: at(3),
      item: supply(BREW),
    });

    expect(editLoadout(full, { kind: "carry", index: at(5), item: supply(BREW) })).toEqual({
      kind: "refused",
      rejection: { kind: "over-stock", id: BREW, carried: 4, allowed: 3 },
    });
    expect(ids(edited(full, { kind: "carry", index: at(0), item: supply(BREW) }).draft).inventory).toEqual(
      padded([BREW, BREW, TWISTED_BOW, BREW, RESTORE]),
    );
    expect(ids(edited(full, { kind: "carry", index: at(5), item: worn(BLOWPIPE) }).draft).inventory).toEqual(
      padded([BREW, BREW, TWISTED_BOW, BREW, RESTORE, BLOWPIPE]),
    );
  });

  test("refuses an unstocked supply, a full inventory, and returning what is not a supply", () => {
    const fullInventory = editing({ equipment: {}, inventory: Array(28).fill(TWISTED_BOW) });

    expect(editLoadout(editing(preset), { kind: "take-supply", id: TWISTED_BOW })).toEqual({
      kind: "refused",
      rejection: { kind: "not-stocked", id: TWISTED_BOW },
    });
    expect(editLoadout(fullInventory, { kind: "take-supply", id: BREW })).toEqual({
      kind: "refused",
      rejection: { kind: "inventory-full" },
    });
    expect(editLoadout(editing(preset), { kind: "return-supply", index: at(2) })).toEqual({
      kind: "refused",
      rejection: { kind: "not-a-supply", index: at(2) },
    });
    expect(editLoadout(editing(preset), { kind: "return-supply", index: at(1) })).toEqual({
      kind: "refused",
      rejection: { kind: "not-a-supply", index: at(1) },
    });
  });
});

describe("editLoadout: order and reset", () => {
  test("move swaps two inventory slots", () => {
    const state = edited(editing({ equipment: {}, inventory: [BREW, TWISTED_BOW, null, RESTORE] }), {
      kind: "move",
      from: at(0),
      to: at(3),
    });

    expect(ids(state.draft).inventory).toEqual(padded([RESTORE, TWISTED_BOW, null, BREW]));
  });

  test("reset edits from the given loadout, with the full stock again", () => {
    const changed = edited(edited(editing({ equipment: {}, inventory: [] }), { kind: "take-supply", id: BREW }), {
      kind: "equip",
      item: worn(SCYTHE),
    });
    const other = loadout({ equipment: { weapon: TWISTED_BOW }, inventory: [BREW] });
    const reset = edited(changed, { kind: "reset", to: other });

    expect(ids(reset.draft)).toEqual(expected({ equipment: { weapon: TWISTED_BOW }, inventory: [BREW] }));
    expect(left(reset)).toEqual([
      [BREW, 2],
      [RESTORE, 1],
    ]);
  });
});

describe("startWith", () => {
  const MELEE_WORN = {
    weapon: SCYTHE,
    helmet: 26382,
    chest: 26384,
    legs: 26386,
    necklace: 29801,
    cape: 21295,
    gloves: 22981,
    feet: 31097,
    ring: 25485,
    ammo: 11212,
  };
  const MASORI = [27235, 27238, 27241].map(itemId);
  const RANGED_ACCESSORIES = [19547, 28951, 26235, 28310].map(itemId);
  const SUPER_COMBAT = 12695;
  const BASTION = 22461;
  const TIER: Ids = {
    equipment: MELEE_WORN,
    inventory: [TWISTED_BOW, ...MASORI, BLOWPIPE, ...RANGED_ACCESSORIES, SUPER_COMBAT, BASTION, BREW, BREW, RESTORE],
  };
  const RANGED_ARMOUR = [...MASORI, ...RANGED_ACCESSORIES];
  const OPTIONS: Record<string, StartOption> = {
    bow: { id: "twisted-bow", label: "Twisted bow", wear: [TWISTED_BOW, ...RANGED_ARMOUR] },
    blowpipe: { id: "blowpipe", label: "Toxic blowpipe", wear: [BLOWPIPE, ...RANGED_ARMOUR] },
    melee: { id: "melee", label: "Melee", wear: [] },
  };
  const RANGED_WORN = {
    helmet: 27235,
    chest: 27238,
    legs: 27241,
    necklace: 19547,
    cape: 28951,
    gloves: 26235,
    feet: 31097,
    ring: 28310,
    ammo: 11212,
  };
  const SUPPLIES = [SUPER_COMBAT, BASTION, BREW, BREW, RESTORE];

  function multiset({ equipment, inventory }: CatalogLoadout): number[] {
    return [...Object.values(equipment), ...inventory].flatMap((item) => (item ? [item.id] : [])).sort();
  }

  test.each([
    {
      option: OPTIONS.bow,
      after: {
        equipment: { ...RANGED_WORN, weapon: TWISTED_BOW },
        inventory: [SCYTHE, 26382, 26384, 26386, BLOWPIPE, 29801, 21295, 22981, 25485, ...SUPPLIES],
      },
    },
    {
      option: OPTIONS.blowpipe,
      after: {
        equipment: { ...RANGED_WORN, weapon: BLOWPIPE },
        inventory: [TWISTED_BOW, 26382, 26384, 26386, SCYTHE, 29801, 21295, 22981, 25485, ...SUPPLIES],
      },
    },
    { option: OPTIONS.melee, after: TIER },
  ])("$option.label wears its items and keeps the same items", ({ option, after }) => {
    const before = loadout(TIER);
    const started = startWith(before, option);

    expect(started.kind).toBe("started");
    if (started.kind !== "started") return;
    expect(ids(started.loadout)).toEqual(expected(after));
    expect(multiset(started.loadout)).toEqual(multiset(before));
  });

  test("an option whose items are already worn leaves the loadout as it is", () => {
    const rangedWorn: Ids = {
      equipment: { ...RANGED_WORN, weapon: TWISTED_BOW },
      inventory: [SCYTHE, BLOWPIPE, ...SUPPLIES],
    };
    const started = startWith(loadout(rangedWorn), OPTIONS.bow);

    expect(started.kind === "started" && ids(started.loadout)).toEqual(expected(rangedWorn));
  });

  test("refuses an option whose items the loadout does not carry, naming each", () => {
    const withoutSwitch = loadout({ equipment: MELEE_WORN, inventory: [TWISTED_BOW, ...SUPPLIES] });

    expect(startWith(withoutSwitch, OPTIONS.blowpipe)).toEqual({
      kind: "refused",
      rejections: [BLOWPIPE, ...RANGED_ARMOUR].map((id) => ({ kind: "not-carried", option: "blowpipe", id })),
    });
  });

  test("a two-handed start moves the offhand to the first free slot, or refuses when there is none", () => {
    const option: StartOption = { id: "twisted-bow", label: "Twisted bow", wear: [TWISTED_BOW] };
    const equipment = { weapon: TENTACLE, offhand: AVERNIC_DEFENDER };
    const started = startWith(loadout({ equipment, inventory: [BREW, TWISTED_BOW, null, RESTORE] }), option);
    const full = loadout({ equipment, inventory: [TWISTED_BOW, ...Array(27).fill(BREW)] });

    expect(started.kind === "started" && ids(started.loadout)).toEqual(
      expected({ equipment: { weapon: TWISTED_BOW }, inventory: [BREW, TENTACLE, AVERNIC_DEFENDER, RESTORE] }),
    );
    expect(startWith(full, option)).toEqual({
      kind: "refused",
      rejections: [{ kind: "inventory-full", option: "twisted-bow", id: TWISTED_BOW }],
    });
  });
});

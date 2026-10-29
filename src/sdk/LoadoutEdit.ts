import type { CarriedItem, CatalogItem, EquipmentSlot, ItemId, WornItem } from "./ItemCatalog";
import { INVENTORY_INDICES, mapInventory } from "./Loadout";
import type { CatalogLoadout, Inventory, InventoryIndex } from "./Loadout";

/** Supplies a player may take beyond what their starting loadout already carries. */
export type SupplyStock = readonly Readonly<{ item: CarriedItem; quantity: number }>[];

export type EditorState = Readonly<{ stock: SupplyStock; base: CatalogLoadout; draft: CatalogLoadout }>;

export type LoadoutEdit =
  | Readonly<{ kind: "equip"; item: WornItem }>
  | Readonly<{ kind: "unequip"; slot: EquipmentSlot }>
  | Readonly<{ kind: "carry"; index: InventoryIndex; item: CatalogItem | null }>
  | Readonly<{ kind: "move"; from: InventoryIndex; to: InventoryIndex }>
  | Readonly<{ kind: "take-supply"; id: ItemId }>
  | Readonly<{ kind: "return-supply"; index: InventoryIndex }>
  | Readonly<{ kind: "reset"; to: CatalogLoadout }>;

export type EditRejection =
  | Readonly<{ kind: "over-stock"; id: ItemId; carried: number; allowed: number }>
  | Readonly<{ kind: "not-stocked"; id: ItemId }>
  | Readonly<{ kind: "not-a-supply"; index: InventoryIndex }>
  | Readonly<{ kind: "inventory-full" }>;

export type EditResult =
  | Readonly<{ kind: "edited"; state: EditorState }>
  | Readonly<{ kind: "refused"; rejection: EditRejection }>;

type Equipment = CatalogLoadout["equipment"];

/** The slots besides its own that wearing `item` empties: a two-handed weapon takes the offhand, and an offhand takes a two-handed weapon. */
export function slotsClearedBy(item: WornItem, weapon: WornItem | null): readonly EquipmentSlot[] {
  if (item.twoHanded) return ["offhand"];
  if (item.slot === "offhand" && weapon?.twoHanded) return ["weapon"];
  return [];
}

function wearing(equipment: Equipment, item: WornItem): Equipment {
  const next = { ...equipment, [item.slot]: item };
  for (const slot of slotsClearedBy(item, equipment.weapon)) next[slot] = null;
  return next;
}

function count(inventory: Inventory<CatalogItem | null>, id: ItemId): number {
  return inventory.filter((item) => item?.id === id).length;
}

/** What each supply has left. Returning a supply that `base` carried raises it above the stock's quantity. */
export function remainingStock(stock: SupplyStock, base: CatalogLoadout, draft: CatalogLoadout): SupplyStock {
  return stock.map(({ item, quantity }) => ({
    item,
    quantity: quantity + count(base.inventory, item.id) - count(draft.inventory, item.id),
  }));
}

function carrying(state: EditorState, index: InventoryIndex, item: CatalogItem | null): EditResult {
  const draft = {
    ...state.draft,
    inventory: mapInventory(state.draft.inventory, (carried, at) => (at === index ? item : carried)),
  };
  const supply = item && state.stock.find((entry) => entry.item.id === item.id);
  if (supply) {
    const carried = count(draft.inventory, supply.item.id);
    const allowed = count(state.base.inventory, supply.item.id) + supply.quantity;
    if (carried > allowed) return { kind: "refused", rejection: { kind: "over-stock", id: item.id, carried, allowed } };
  }
  return { kind: "edited", state: { ...state, draft } };
}

export function editLoadout(state: EditorState, edit: LoadoutEdit): EditResult {
  const { draft } = state;
  switch (edit.kind) {
    case "equip":
      return {
        kind: "edited",
        state: { ...state, draft: { ...draft, equipment: wearing(draft.equipment, edit.item) } },
      };
    case "unequip":
      return {
        kind: "edited",
        state: { ...state, draft: { ...draft, equipment: { ...draft.equipment, [edit.slot]: null } } },
      };
    case "carry":
      return carrying(state, edit.index, edit.item);
    case "move": {
      const { from, to } = edit;
      const inventory = mapInventory(draft.inventory, (item, at) =>
        at === from ? draft.inventory[to] : at === to ? draft.inventory[from] : item,
      );
      return { kind: "edited", state: { ...state, draft: { ...draft, inventory } } };
    }
    case "take-supply": {
      const supply = state.stock.find((entry) => entry.item.id === edit.id);
      if (!supply) return { kind: "refused", rejection: { kind: "not-stocked", id: edit.id } };
      const free = INVENTORY_INDICES.find((index) => draft.inventory[index] === null);
      if (free === undefined) return { kind: "refused", rejection: { kind: "inventory-full" } };
      return carrying(state, free, supply.item);
    }
    case "return-supply": {
      const carried = draft.inventory[edit.index];
      if (!carried || !state.stock.some((entry) => entry.item.id === carried.id))
        return { kind: "refused", rejection: { kind: "not-a-supply", index: edit.index } };
      return carrying(state, edit.index, null);
    }
    case "reset":
      return { kind: "edited", state: { ...state, base: edit.to, draft: edit.to } };
    default: {
      const unreachable: never = edit;
      return unreachable;
    }
  }
}

export type StartOption = Readonly<{ id: string; label: string; wear: readonly ItemId[] }>;

export type StartRejection =
  | Readonly<{ kind: "not-carried"; option: string; id: ItemId }>
  | Readonly<{ kind: "inventory-full"; option: string; id: ItemId }>;

export type StartResult =
  | Readonly<{ kind: "started"; loadout: CatalogLoadout }>
  | Readonly<{ kind: "refused"; rejections: readonly StartRejection[] }>;

function isWornItem(item: CatalogItem | null): item is WornItem {
  return item !== null && item.slot !== "carried";
}

function wearFrom(loadout: CatalogLoadout, index: InventoryIndex, item: WornItem): CatalogLoadout | null {
  const { equipment } = loadout;
  const displaced = [item.slot, ...slotsClearedBy(item, equipment.weapon)]
    .map((slot) => equipment[slot])
    .filter((worn) => worn !== null);
  const targets = [index, ...INVENTORY_INDICES.filter((at) => loadout.inventory[at] === null)];
  if (displaced.length > targets.length) return null;
  return {
    equipment: wearing(equipment, item),
    inventory: mapInventory(loadout.inventory, (carried, at) => {
      const target = targets.indexOf(at);
      return target === -1 ? carried : (displaced[target] ?? null);
    }),
  };
}

/**
 * Wears each of the option's items from the inventory, so the loadout holds the same items. The first item it displaces
 * takes the slot the new item left, and any other takes the first free slot. An item already worn stays as it is.
 */
export function startWith(loadout: CatalogLoadout, option: StartOption): StartResult {
  const rejections: StartRejection[] = [];
  let started = loadout;
  for (const id of option.wear) {
    if (Object.values(started.equipment).some((worn) => worn?.id === id)) continue;
    const index = INVENTORY_INDICES.find((at) => {
      const carried = started.inventory[at];
      return isWornItem(carried) && carried.id === id;
    });
    const item = index === undefined ? null : started.inventory[index];
    if (!isWornItem(item)) {
      rejections.push({ kind: "not-carried", option: option.id, id });
      continue;
    }
    const worn = wearFrom(started, index, item);
    if (worn) started = worn;
    else rejections.push({ kind: "inventory-full", option: option.id, id });
  }
  return rejections.length > 0 ? { kind: "refused", rejections } : { kind: "started", loadout: started };
}

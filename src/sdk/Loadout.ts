import type { UnitEquipment } from "./Unit";
import { isItemId } from "./ItemCatalog";
import type { CatalogItem, EquipmentSlot, ItemCatalog, ItemId, ItemSlot, WornItem } from "./ItemCatalog";

/** An item ID before it has been resolved into an Item instance. */
export type LoadoutItemId = number | null;

/**
 * A player's equipment and inventory represented by unresolved item IDs.
 * `inventory` must contain exactly 28 entries, one for each slot; `parseLoadout` refuses any other length.
 */
export type Loadout = {
  name: string;
  equipment: Record<keyof UnitEquipment, LoadoutItemId>;
  inventory: LoadoutItemId[];
};

export const INVENTORY_SIZE = 28;
export type InventoryIndex = number & { readonly __brand: "InventoryIndex" };
export type Inventory<T> = readonly T[] & { readonly __length: typeof INVENTORY_SIZE };

/** A loadout whose every item resolved in one catalog and fits the slot it is in. */
export type CatalogLoadout = Readonly<{
  equipment: Readonly<Record<EquipmentSlot, WornItem | null>>;
  inventory: Inventory<CatalogItem | null>;
}>;

type EquipmentRef = Readonly<{ kind: "equipment"; slot: EquipmentSlot }>;
export type SlotRef = EquipmentRef | Readonly<{ kind: "inventory"; index: InventoryIndex }>;

export type LoadoutRejection =
  | Readonly<{ kind: "malformed"; detail: string }>
  | Readonly<{ kind: "unknown-item"; id: ItemId; at: SlotRef }>
  | Readonly<{ kind: "wrong-slot"; id: ItemId; at: EquipmentRef; fits: ItemSlot }>;

export type LoadoutParse =
  | Readonly<{ kind: "parsed"; loadout: CatalogLoadout }>
  | Readonly<{ kind: "refused"; rejections: readonly LoadoutRejection[] }>;

function eachSlot<T>(value: (slot: EquipmentSlot) => T): Record<EquipmentSlot, T> {
  return {
    weapon: value("weapon"),
    offhand: value("offhand"),
    helmet: value("helmet"),
    necklace: value("necklace"),
    chest: value("chest"),
    legs: value("legs"),
    feet: value("feet"),
    gloves: value("gloves"),
    ring: value("ring"),
    cape: value("cape"),
    ammo: value("ammo"),
  };
}

const EQUIPMENT_SLOTS = eachSlot(() => true);

function isEquipmentSlot(key: string): key is EquipmentSlot {
  return Object.prototype.hasOwnProperty.call(EQUIPMENT_SLOTS, key);
}

function isInventoryIndex(index: number): index is InventoryIndex {
  return Number.isInteger(index) && index >= 0 && index < INVENTORY_SIZE;
}

function isFullInventory<T>(items: readonly T[]): items is Inventory<T> {
  return items.length === INVENTORY_SIZE;
}

export const INVENTORY_INDICES: readonly InventoryIndex[] = Array.from(
  { length: INVENTORY_SIZE },
  (_, index) => index,
).filter(isInventoryIndex);

export function mapInventory<T, U>(inventory: Inventory<T>, map: (item: T, index: InventoryIndex) => U): Inventory<U> {
  const mapped = INVENTORY_INDICES.map((index) => map(inventory[index], index));
  if (!isFullInventory(mapped)) throw new Error(`inventory has ${mapped.length} slots, expected ${INVENTORY_SIZE}`);
  return mapped;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Resolves every id in `raw` through `catalog`, or returns every reason it cannot. */
export function parseLoadout(catalog: ItemCatalog, raw: unknown): LoadoutParse {
  const rejections: LoadoutRejection[] = [];
  const reject = (rejection: LoadoutRejection) => {
    rejections.push(rejection);
    return null;
  };
  if (!isRecord(raw))
    return { kind: "refused", rejections: [{ kind: "malformed", detail: "loadout is not an object" }] };

  const wornItem = (slot: EquipmentSlot, value: unknown): WornItem | null => {
    if (value === null) return null;
    if (!isItemId(value)) return reject({ kind: "malformed", detail: `equipment.${slot} must be an item id or null` });
    const at: EquipmentRef = { kind: "equipment", slot };
    const item = catalog.get(value);
    if (!item) return reject({ kind: "unknown-item", id: value, at });
    if (item.slot === "carried" || item.slot !== slot)
      return reject({ kind: "wrong-slot", id: value, at, fits: item.slot });
    return item;
  };
  const carriedItem = (index: InventoryIndex, value: unknown): CatalogItem | null => {
    if (value === null) return null;
    if (!isItemId(value))
      return reject({ kind: "malformed", detail: `inventory[${index}] must be an item id or null` });
    return catalog.get(value) ?? reject({ kind: "unknown-item", id: value, at: { kind: "inventory", index } });
  };

  const worn = raw.equipment;
  if (!isRecord(worn)) reject({ kind: "malformed", detail: "equipment is not an object" });
  else {
    for (const key of Object.keys(worn)) {
      if (!isEquipmentSlot(key)) reject({ kind: "malformed", detail: `equipment.${key} is not an equipment slot` });
    }
  }
  const equipment = eachSlot((slot) => (isRecord(worn) ? wornItem(slot, worn[slot]) : null));

  const carried = raw.inventory;
  if (!Array.isArray(carried)) reject({ kind: "malformed", detail: "inventory is not a list" });
  else if (carried.length !== INVENTORY_SIZE) {
    reject({ kind: "malformed", detail: `inventory has ${carried.length} slots, expected ${INVENTORY_SIZE}` });
  }
  const inventory = Array.isArray(carried)
    ? INVENTORY_INDICES.filter((index) => index < carried.length).map((index) => carriedItem(index, carried[index]))
    : [];

  if (rejections.length > 0 || !isFullInventory(inventory)) return { kind: "refused", rejections };
  return { kind: "parsed", loadout: { equipment, inventory } };
}

/** The ids that `parseLoadout` reads back into `loadout`. */
export function loadoutIds(loadout: CatalogLoadout): Readonly<{
  equipment: Readonly<Record<EquipmentSlot, ItemId | null>>;
  inventory: readonly (ItemId | null)[];
}> {
  return {
    equipment: eachSlot((slot) => loadout.equipment[slot]?.id ?? null),
    inventory: loadout.inventory.map((item) => item?.id ?? null),
  };
}

function describeSlot(at: SlotRef): string {
  switch (at.kind) {
    case "equipment":
      return `equipment.${at.slot}`;
    case "inventory":
      return `inventory[${at.index}]`;
    default: {
      const unreachable: never = at;
      return unreachable;
    }
  }
}

export function describeLoadoutRejection(rejection: LoadoutRejection): string {
  switch (rejection.kind) {
    case "malformed":
      return rejection.detail;
    case "unknown-item":
      return `unknown item ${rejection.id} in ${describeSlot(rejection.at)}`;
    case "wrong-slot":
      return `item ${rejection.id} in ${describeSlot(rejection.at)} fits ${rejection.fits}`;
    default: {
      const unreachable: never = rejection;
      return unreachable;
    }
  }
}

import { EQUIPMENT_TYPE_TO_SLOT, Equipment } from "./Equipment";
import { Weapon } from "./gear/Weapon";
import type { Item } from "./Item";
import type { ItemName } from "./ItemName";
import type { UnitEquipment } from "./Unit";

export type ItemId = number & { readonly __brand: "ItemId" };
export type EquipmentSlot = keyof UnitEquipment;
export type ItemSlot = EquipmentSlot | "carried";
export type ItemClass = new () => Item;

type CatalogIdentity = Readonly<{
  /** The game's item id, which loadouts hold. */
  id: ItemId;
  /** The cache item id the SDK renders, which equals `id` unless the cache lacks the item. */
  drawnAs: ItemId;
  name: ItemName;
  inventoryImage: string;
}>;

export type WornItem = CatalogIdentity & Readonly<{ slot: EquipmentSlot; twoHanded: boolean; build: () => Equipment }>;
export type CarriedItem = CatalogIdentity & Readonly<{ slot: "carried"; build: () => Item }>;
export type CatalogItem = WornItem | CarriedItem;

export function isItemId(value: unknown): value is ItemId {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isEquipmentClass(ItemType: ItemClass): ItemType is new () => Equipment {
  return ItemType.prototype instanceof Equipment;
}

function identity(ItemType: ItemClass, item: Item): CatalogIdentity {
  const { itemId, cacheItemId } = item;
  if (!isItemId(itemId) || !isItemId(cacheItemId)) throw new Error(`${ItemType.name} has no item id`);
  return { id: itemId, drawnAs: cacheItemId, name: item.itemName, inventoryImage: item.inventoryImage };
}

function catalogItem(ItemType: ItemClass): CatalogItem {
  if (isEquipmentClass(ItemType)) {
    const item = new ItemType();
    return {
      ...identity(ItemType, item),
      slot: EQUIPMENT_TYPE_TO_SLOT[item.type],
      twoHanded: item instanceof Weapon && item.isTwoHander,
      build: () => new ItemType(),
    };
  }
  return { ...identity(ItemType, new ItemType()), slot: "carried", build: () => new ItemType() };
}

/** Every item a loadout can name, keyed by the game's item id. */
export class ItemCatalog {
  readonly items: readonly CatalogItem[];
  private readonly byId = new Map<number, CatalogItem>();

  /** Throws when two classes claim one id, so an id never resolves to the wrong item. */
  constructor(classes: readonly ItemClass[]) {
    for (const ItemType of classes) {
      const item = catalogItem(ItemType);
      const claimed = this.byId.get(item.id);
      if (claimed) throw new Error(`Item id ${item.id} is claimed by both ${claimed.name} and ${item.name}`);
      this.byId.set(item.id, item);
    }
    this.items = Array.from(this.byId.values());
  }

  get(id: number): CatalogItem | undefined {
    return this.byId.get(id);
  }
}

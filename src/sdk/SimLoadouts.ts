import { SDK_ITEM_CATALOG } from "../content/SdkItemCatalog";
import { ItemCatalog, isItemId } from "./ItemCatalog";
import type { EquipmentSlot, ItemClass } from "./ItemCatalog";
import { describeLoadoutRejection, parseLoadout } from "./Loadout";
import type { CatalogLoadout } from "./Loadout";
import { startWith } from "./LoadoutEdit";
import type { StartOption, StartRejection, StartResult, SupplyStock } from "./LoadoutEdit";
import { LoadoutStore, presetId } from "./LoadoutStore";
import type { LoadoutStoreOptions, Preset, PresetId } from "./LoadoutStore";

export type LoadoutIds = Readonly<{
  equipment: Readonly<Record<EquipmentSlot, number | null>>;
  inventory: readonly (number | null)[];
}>;

export type PresetDefinition = Readonly<{
  id: string;
  label: string;
  revision: number;
  loadout: LoadoutIds;
  /** Ids from the definition's `startOptions` that this preset offers. */
  startOptions: readonly string[];
}>;

export type SimLoadoutsDefinition = Readonly<{
  /** The storage namespace, `osrs-sdk:loadouts:<sim>`. */
  sim: string;
  /** The sim's own item classes. One that claims an SDK item's id replaces that item. */
  items: readonly ItemClass[];
  presets: readonly PresetDefinition[];
  defaultPreset: string;
  supplyStock: readonly Readonly<{ id: number; quantity: number }>[];
  startOptions: readonly Readonly<{ id: string; label: string; wear: readonly number[] }>[];
}>;

export type SimLoadouts = Readonly<{
  sim: string;
  catalog: ItemCatalog;
  presets: readonly Preset[];
  defaultPreset: PresetId;
  supplyStock: SupplyStock;
  /** Call after `Settings.readFromStorage()`, which the store's one-time import of the old single edit reads. */
  store(storage: LoadoutStoreOptions["storage"]): LoadoutStore;
  /** Refuses an option the active preset does not list. */
  start(active: Readonly<{ preset: Preset; loadout: CatalogLoadout }>, option: string): StartResult;
}>;

function describeStartRejection(rejection: StartRejection): string {
  switch (rejection.kind) {
    case "not-carried":
      return `item ${rejection.id} is not carried`;
    case "inventory-full":
      return `no free slot for what item ${rejection.id} displaces`;
    case "not-offered":
      return `option ${rejection.option} is not offered`;
    default: {
      const unreachable: never = rejection;
      return unreachable;
    }
  }
}

/** Throws when anything in the definition would fail at runtime, listing every problem it found. */
export function defineSimLoadouts(definition: SimLoadoutsDefinition): SimLoadouts {
  const problems: string[] = [];
  const catalog = new ItemCatalog(definition.items, SDK_ITEM_CATALOG);

  const options = new Map<string, StartOption>();
  for (const option of definition.startOptions) {
    if (options.has(option.id)) problems.push(`Start option "${option.id}" is defined twice`);
    const wear = option.wear.filter(isItemId);
    if (wear.length !== option.wear.length)
      problems.push(`Start option "${option.id}" wears an id that is not an item id`);
    options.set(option.id, { ...option, wear });
  }

  const presets: Preset[] = [];
  const offered = new Map<PresetId, readonly StartOption[]>();
  for (const definedPreset of definition.presets) {
    const id = presetId(definedPreset.id);
    if (offered.has(id)) problems.push(`Preset "${id}" is defined twice`);
    const parsed = parseLoadout(catalog, definedPreset.loadout);
    if (parsed.kind === "refused") {
      problems.push(`Preset "${id}" refused: ${parsed.rejections.map(describeLoadoutRejection).join("; ")}`);
      continue;
    }
    const preset: Preset = {
      id,
      label: definedPreset.label,
      revision: definedPreset.revision,
      loadout: parsed.loadout,
    };
    const presetOptions: StartOption[] = [];
    for (const optionId of definedPreset.startOptions) {
      const option = options.get(optionId);
      if (!option) {
        problems.push(`Preset "${id}" offers unknown start option "${optionId}"`);
        continue;
      }
      const started = startWith(preset.loadout, option);
      if (started.kind === "refused") {
        const reasons = started.rejections.map(describeStartRejection).join(", ");
        problems.push(`Preset "${id}" offers start option "${optionId}", which it cannot start with: ${reasons}`);
      }
      presetOptions.push(option);
    }
    presets.push(preset);
    offered.set(id, presetOptions);
  }
  if (!definition.presets.some((preset) => preset.id === definition.defaultPreset)) {
    problems.push(`Default preset "${definition.defaultPreset}" is not one of the presets`);
  }
  const defaultPreset = presets.find((preset) => preset.id === definition.defaultPreset);

  const supplyStock: SupplyStock[number][] = [];
  for (const { id, quantity } of definition.supplyStock) {
    const item = catalog.get(id);
    if (!item) problems.push(`Supply ${id} is not an item`);
    else if (item.slot !== "carried") problems.push(`Supply ${id} (${item.name}) is worn, not carried`);
    else if (supplyStock.some((supply) => supply.item.id === id))
      problems.push(`Supply ${id} (${item.name}) is stocked twice`);
    else supplyStock.push({ item, quantity });
  }

  if (problems.length > 0 || !defaultPreset) {
    throw new Error(`Loadouts for ${definition.sim} are invalid:\n${problems.join("\n")}`);
  }

  return {
    sim: definition.sim,
    catalog,
    presets,
    defaultPreset: defaultPreset.id,
    supplyStock,
    store: (storage) =>
      new LoadoutStore({ sim: definition.sim, catalog, presets, defaultPreset: defaultPreset.id, storage }),
    start: (active, option) => {
      const offer = offered.get(active.preset.id)?.find(({ id }) => id === option);
      if (!offer) return { kind: "refused", rejections: [{ kind: "not-offered", option }] };
      return startWith(active.loadout, offer);
    },
  };
}

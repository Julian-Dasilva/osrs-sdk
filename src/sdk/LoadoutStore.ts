import type { ItemCatalog } from "./ItemCatalog";
import { loadoutIds, parseLoadout } from "./Loadout";
import type { CatalogLoadout, LoadoutRejection } from "./Loadout";
import { Settings } from "./Settings";

export type PresetId = string & { readonly __brand: "PresetId" };

function isPresetId(value: string): value is PresetId {
  return value.length > 0;
}

export function presetId(value: string): PresetId {
  if (!isPresetId(value)) throw new Error("A preset id must not be empty");
  return value;
}

/** A sim's starting loadout. Raise `revision` whenever a release changes `loadout`. */
export type Preset = Readonly<{ id: PresetId; label: string; revision: number; loadout: CatalogLoadout }>;

export type ActiveLoadout = Readonly<
  {
    preset: Preset;
    /** `session-only` when the browser refuses storage, so edits last until the page closes. */
    storage: "kept" | "session-only";
  } & (
    | { source: "preset"; loadout: CatalogLoadout; refusedEdit: readonly LoadoutRejection[] }
    | { source: "edit"; loadout: CatalogLoadout; presetChanged: boolean }
  )
>;

export type LoadoutStoreOptions = Readonly<{
  sim: string;
  catalog: ItemCatalog;
  presets: readonly Preset[];
  defaultPreset: PresetId;
  storage: Pick<Storage, "getItem" | "setItem">;
}>;

const LOADOUTS_VERSION = 1;

type StoredValues = Readonly<{ selected: string; edits: Readonly<Record<string, unknown>> }>;

type Stored =
  | Readonly<{ kind: "readable"; values: StoredValues }>
  | Readonly<{ kind: "unreadable" }>
  | Readonly<{ kind: "refused" }>;

type Persistence = "kept" | "read-only-until-save" | "session-only";

function persistenceOf(stored: Stored): Persistence {
  switch (stored.kind) {
    case "readable":
      return "kept";
    case "unreadable":
      return "read-only-until-save";
    case "refused":
      return "session-only";
    default: {
      const unreachable: never = stored;
      return unreachable;
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unreadable(key: string, reason: unknown): Stored {
  console.warn(
    `[osrs-sdk] Ignoring unreadable loadouts in localStorage key "${key}" and using the presets. The stored value has not been removed.`,
    reason,
  );
  return { kind: "unreadable" };
}

function parseStored(key: string, raw: string): Stored {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return unreadable(key, error);
  }
  if (!isRecord(parsed) || typeof parsed.version !== "number") return unreadable(key, "Expected a version.");
  if (parsed.version > LOADOUTS_VERSION) return { kind: "unreadable" };
  const values = parsed.values;
  if (
    parsed.version !== LOADOUTS_VERSION ||
    !isRecord(values) ||
    typeof values.selected !== "string" ||
    !isRecord(values.edits)
  ) {
    return unreadable(key, `Expected version ${LOADOUTS_VERSION} values with selected and edits.`);
  }
  return { kind: "readable", values: { selected: values.selected, edits: values.edits } };
}

/** One sim's chosen preset and its saved edit per preset, under `osrs-sdk:loadouts:<sim>`. */
export class LoadoutStore {
  private readonly key: string;
  private readonly catalog: ItemCatalog;
  private readonly storage: LoadoutStoreOptions["storage"];
  private readonly presets = new Map<string, Preset>();
  private readonly defaultPreset: Preset;
  private persistence: Persistence;
  private values: StoredValues;

  /** Throws when two presets share an id or `defaultPreset` names none of them. */
  constructor(options: LoadoutStoreOptions) {
    for (const preset of options.presets) {
      if (this.presets.has(preset.id)) throw new Error(`Preset id ${preset.id} is used twice`);
      this.presets.set(preset.id, preset);
    }
    const defaultPreset = this.presets.get(options.defaultPreset);
    if (!defaultPreset) throw new Error(`Default preset ${options.defaultPreset} is not one of the presets`);
    this.defaultPreset = defaultPreset;
    this.key = `osrs-sdk:loadouts:${options.sim}`;
    this.catalog = options.catalog;
    this.storage = options.storage;
    const stored = this.read();
    this.persistence = persistenceOf(stored);
    this.values = stored.kind === "readable" ? stored.values : { selected: defaultPreset.id, edits: {} };
  }

  /** A refused edit falls back to its preset with the reasons; the edit stays in storage. */
  active(): ActiveLoadout {
    const preset = this.presets.get(this.values.selected) ?? this.defaultPreset;
    const storage = this.persistence === "session-only" ? "session-only" : "kept";
    const edit = this.values.edits[preset.id];
    if (edit === undefined) return { preset, storage, source: "preset", loadout: preset.loadout, refusedEdit: [] };
    if (!isRecord(edit) || typeof edit.presetRevision !== "number") {
      const refusedEdit: readonly LoadoutRejection[] = [{ kind: "malformed", detail: "edit has no presetRevision" }];
      return { preset, storage, source: "preset", loadout: preset.loadout, refusedEdit };
    }
    const parsed = parseLoadout(this.catalog, edit.loadout);
    if (parsed.kind === "refused") {
      return { preset, storage, source: "preset", loadout: preset.loadout, refusedEdit: parsed.rejections };
    }
    const presetChanged = edit.presetRevision !== preset.revision;
    return { preset, storage, source: "edit", loadout: parsed.loadout, presetChanged };
  }

  save(id: PresetId, loadout: CatalogLoadout) {
    const preset = this.preset(id);
    const edit = { presetRevision: preset.revision, loadout: loadoutIds(loadout) };
    this.applyToLatest((values) => ({ ...values, edits: { ...values.edits, [preset.id]: edit } }), "player-edit");
  }

  reset(id: PresetId) {
    const preset = this.preset(id);
    this.applyToLatest((values) => {
      const { [preset.id]: _reset, ...edits } = values.edits;
      return { ...values, edits };
    }, "choice");
  }

  select(id: PresetId) {
    const preset = this.preset(id);
    this.applyToLatest((values) => ({ ...values, selected: preset.id }), "choice");
  }

  private preset(id: PresetId): Preset {
    const preset = this.presets.get(id);
    if (!preset) throw new Error(`Unknown preset ${id}`);
    return preset;
  }

  private applyToLatest(apply: (values: StoredValues) => StoredValues, cause: "player-edit" | "choice") {
    if (this.persistence !== "session-only") {
      const stored = this.read();
      this.persistence = persistenceOf(stored);
      if (stored.kind === "readable") this.values = stored.values;
    }
    this.values = apply(this.values);
    if (this.persistence === "kept" || (this.persistence === "read-only-until-save" && cause === "player-edit"))
      this.write();
  }

  private read(): Stored {
    let raw: string | null;
    try {
      raw = this.storage.getItem(this.key);
    } catch {
      return { kind: "refused" };
    }
    return raw === null ? { kind: "readable", values: this.valuesFromLegacySettings() } : parseStored(this.key, raw);
  }

  private write() {
    try {
      this.storage.setItem(this.key, JSON.stringify({ version: LOADOUTS_VERSION, values: this.values }));
      this.persistence = "kept";
    } catch {
      this.persistence = "session-only";
    }
  }

  private valuesFromLegacySettings(): StoredValues {
    const preset = this.presets.get(Settings.loadout);
    if (!preset) return { selected: this.defaultPreset.id, edits: {} };
    const legacy = Settings.customLoadout;
    if (legacy?.name !== preset.id) return { selected: preset.id, edits: {} };
    const edit = {
      presetRevision: preset.revision,
      loadout: { equipment: legacy.equipment, inventory: legacy.inventory },
    };
    return { selected: preset.id, edits: { [preset.id]: edit } };
  }
}

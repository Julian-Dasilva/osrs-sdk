import React, { useState } from "react";
import { INVENTORY_INDICES, editLoadout, loadoutIds, remainingStock } from "osrs-sdk";
import type {
  ActiveLoadout,
  CatalogItem,
  CatalogLoadout,
  EditRejection,
  EditorState,
  EquipmentSlot,
  InventoryIndex,
  ItemCatalog,
  LoadoutEdit,
  LoadoutRejection,
  LoadoutStore,
  SimLoadouts,
  SlotRef,
} from "osrs-sdk";
import { Dropdown } from "./Dropdown";
import { RuneScapeButton } from "./RuneScapeButton";

export type LoadoutEditorStore = Pick<LoadoutStore, "active" | "save" | "reset" | "select">;

export type LoadoutEditorProps = {
  sim: SimLoadouts;
  store: LoadoutEditorStore;
  /** Called after Apply has saved, to restart the run on the saved loadout. */
  onApply: () => void;
  /** The items offered for a worn slot, or for an inventory slot when `slot` is null. Defaults to every catalog item that fits. */
  choices?: (slot: EquipmentSlot | null) => readonly CatalogItem[];
};

type View = Readonly<{ active: ActiveLoadout; editor: EditorState; refusal: EditRejection | null }>;

const SLOT_SIZE = 44;
const REFERENCE_SLOT_SIZE = 36;

type Placement = Readonly<{ slot: EquipmentSlot; label: string; left: number; top: number }>;

const REFERENCE_LAYOUT: readonly Placement[] = [
  { slot: "helmet", label: "Helmet", left: 84, top: 11 },
  { slot: "cape", label: "Cape", left: 43, top: 50 },
  { slot: "necklace", label: "Neck", left: 84, top: 50 },
  { slot: "ammo", label: "Ammo", left: 124, top: 50 },
  { slot: "weapon", label: "Weapon", left: 28, top: 89 },
  { slot: "chest", label: "Chest", left: 84, top: 89 },
  { slot: "offhand", label: "Offhand", left: 140, top: 89 },
  { slot: "legs", label: "Legs", left: 84, top: 129 },
  { slot: "gloves", label: "Gloves", left: 28, top: 169 },
  { slot: "feet", label: "Feet", left: 84, top: 169 },
  { slot: "ring", label: "Ring", left: 140, top: 169 },
];
const EQUIPMENT_LAYOUT: readonly Placement[] = REFERENCE_LAYOUT.map((place) => ({
  ...place,
  left: ((place.left - 28) * SLOT_SIZE) / REFERENCE_SLOT_SIZE,
  top: ((place.top - 11) * SLOT_SIZE) / REFERENCE_SLOT_SIZE,
}));
const EQUIPMENT_WIDTH = Math.max(...EQUIPMENT_LAYOUT.map(({ left }) => left + SLOT_SIZE));
const EQUIPMENT_HEIGHT = Math.max(...EQUIPMENT_LAYOUT.map(({ top }) => top + SLOT_SIZE));

const SLOTS_WITHOUT_BARE_MODELS: ReadonlySet<EquipmentSlot> = new Set<EquipmentSlot>([
  "helmet",
  "chest",
  "legs",
  "gloves",
  "feet",
]);

const slotStyle: React.CSSProperties = {
  alignItems: "center",
  backgroundColor: "#111",
  border: "1px solid #8f8f8f",
  boxSizing: "border-box",
  color: "#aaa",
  display: "flex",
  fontSize: 10,
  height: SLOT_SIZE,
  justifyContent: "center",
  width: SLOT_SIZE,
};

const menuEntryStyle: React.CSSProperties = {
  alignItems: "center",
  background: "none",
  border: 0,
  color: "inherit",
  cursor: "pointer",
  display: "grid",
  gap: 4,
  gridTemplateColumns: "24px 1fr",
  minHeight: 32,
  textAlign: "left",
};

function viewOf(sim: SimLoadouts, store: LoadoutEditorStore): View {
  const active = store.active();
  return {
    active,
    editor: { stock: sim.supplyStock, base: active.preset.loadout, draft: active.loadout },
    refusal: null,
  };
}

function sameLoadout(a: CatalogLoadout, b: CatalogLoadout): boolean {
  return JSON.stringify(loadoutIds(a)) === JSON.stringify(loadoutIds(b));
}

function items(count: number): string {
  return `${count} item${count === 1 ? "" : "s"}`;
}

function place(at: SlotRef): string {
  switch (at.kind) {
    case "equipment":
      return `${at.slot} slot`;
    case "inventory":
      return `inventory slot ${at.index + 1}`;
    default: {
      const unreachable: never = at;
      return unreachable;
    }
  }
}

function refusedEditReasons(label: string, rejections: readonly LoadoutRejection[]): string[] {
  const unknown: SlotRef[] = [];
  const misplaced: SlotRef[] = [];
  const unreadable: string[] = [];
  for (const rejection of rejections) {
    switch (rejection.kind) {
      case "unknown-item":
        unknown.push(rejection.at);
        break;
      case "wrong-slot":
        misplaced.push(rejection.at);
        break;
      case "malformed":
        unreadable.push(rejection.detail);
        break;
      default: {
        const unreachable: never = rejection;
        return unreachable;
      }
    }
  }
  const reasons: string[] = [];
  if (unknown.length > 0) {
    reasons.push(
      `Your ${label} edit uses ${items(unknown.length)} this version doesn't have (${unknown.map(place).join(", ")})`,
    );
  }
  if (misplaced.length > 0) {
    reasons.push(
      `Your ${label} edit wears ${items(misplaced.length)} in a slot that no longer fits (${misplaced.map(place).join(", ")})`,
    );
  }
  if (unreadable.length > 0) reasons.push(`Your ${label} edit could not be read (${unreadable.join("; ")})`);
  return reasons;
}

function editRefusal(catalog: ItemCatalog, rejection: EditRejection): string {
  switch (rejection.kind) {
    case "over-stock":
      return `No ${catalog.get(rejection.id)?.name ?? rejection.id} left in the supplies`;
    case "not-stocked":
      return `${catalog.get(rejection.id)?.name ?? rejection.id} is not in the supplies`;
    case "not-a-supply":
      return `Inventory slot ${rejection.index + 1} holds no supply to return`;
    case "inventory-full":
      return "The inventory is full";
    default: {
      const unreachable: never = rejection;
      return unreachable;
    }
  }
}

function ItemIcon({ item, empty }: { item: CatalogItem | null; empty: string }) {
  if (!item) return <span style={{ color: "#777", fontSize: 9 }}>{empty}</span>;
  return (
    <img
      src={item.inventoryImage}
      alt={item.name}
      title={`${item.name} (${item.id})`}
      style={{ maxHeight: "90%", maxWidth: "90%", imageRendering: "pixelated" }}
    />
  );
}

function MenuEntry({ item, label, onSelect }: { item?: CatalogItem; label: string; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} style={menuEntryStyle}>
      {item ? (
        <img src={item.inventoryImage} alt="" style={{ maxHeight: 24, imageRendering: "pixelated" }} />
      ) : (
        <span />
      )}
      <span>{label}</span>
    </button>
  );
}

/** Edits one sim's presets: worn slots, the 28-slot inventory with drag to swap, and a supply shop. */
export function LoadoutEditor({ sim, store, onApply, choices }: LoadoutEditorProps) {
  const [view, setView] = useState(() => viewOf(sim, store));
  const [dragging, setDragging] = useState<InventoryIndex | null>(null);
  const { active, editor, refusal } = view;
  const { preset } = active;
  const { draft } = editor;
  const edited = !sameLoadout(draft, preset.loadout);
  const offered = choices ?? ((slot) => sim.catalog.items.filter((item) => slot === null || item.slot === slot));
  const supplies = new Set(sim.supplyStock.map(({ item }) => item.id));

  const edit = (change: LoadoutEdit) => {
    const result = editLoadout(editor, change);
    setView(
      result.kind === "edited"
        ? { ...view, editor: result.state, refusal: null }
        : { ...view, refusal: result.rejection },
    );
  };
  const reload = () => setView(viewOf(sim, store));

  const select = (id: string) => {
    const chosen = sim.presets.find((candidate) => candidate.id === id);
    if (!chosen) return;
    store.select(chosen.id);
    reload();
  };
  const reset = () => {
    store.reset(preset.id);
    reload();
  };
  const apply = () => {
    if (!sameLoadout(draft, active.loadout)) {
      if (edited) store.save(preset.id, draft);
      else store.reset(preset.id);
    }
    reload();
    onApply();
  };

  const notices = [
    ...(active.source === "edit"
      ? active.presetChanged
        ? ["This tier changed since you edited it"]
        : []
      : refusedEditReasons(preset.label, active.refusedEdit)),
    ...(active.storage === "session-only" ? ["This browser is not saving data, so edits won't be kept"] : []),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label>
        Preset{" "}
        <select value={preset.id} onChange={(event) => select(event.currentTarget.value)}>
          {sim.presets.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.id === preset.id && edited ? `${candidate.label} (edited)` : candidate.label}
            </option>
          ))}
        </select>
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        <section>
          <h3>Worn</h3>
          <div style={{ height: EQUIPMENT_HEIGHT, position: "relative", width: EQUIPMENT_WIDTH }}>
            {EQUIPMENT_LAYOUT.map(({ slot, label, left, top }) => (
              <div key={slot} aria-label={label} style={{ ...slotStyle, left, position: "absolute", top }}>
                <Dropdown trigger={<ItemIcon item={draft.equipment[slot]} empty={label} />}>
                  {!SLOTS_WITHOUT_BARE_MODELS.has(slot) && (
                    <MenuEntry label="Empty" onSelect={() => edit({ kind: "unequip", slot })} />
                  )}
                  {offered(slot).map((item) =>
                    item.slot === "carried" ? null : (
                      <MenuEntry
                        key={item.id}
                        item={item}
                        label={item.name}
                        onSelect={() => edit({ kind: "equip", item })}
                      />
                    ),
                  )}
                </Dropdown>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h3>Inventory</h3>
          <div style={{ display: "grid", gap: 2, gridTemplateColumns: `repeat(4, ${SLOT_SIZE}px)` }}>
            {INVENTORY_INDICES.map((index) => {
              const item = draft.inventory[index];
              return (
                <div
                  key={index}
                  aria-label={`Inventory slot ${index + 1}`}
                  draggable={item !== null}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", String(index));
                    setDragging(index);
                  }}
                  onDragOver={(event) => {
                    if (dragging !== null) event.preventDefault();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (dragging !== null && dragging !== index) edit({ kind: "move", from: dragging, to: index });
                    setDragging(null);
                  }}
                  onDragEnd={() => setDragging(null)}
                  style={{ ...slotStyle, opacity: dragging === index ? 0.5 : 1 }}
                >
                  <Dropdown trigger={<ItemIcon item={item} empty="" />}>
                    {item && supplies.has(item.id) && (
                      <MenuEntry label="Return" onSelect={() => edit({ kind: "return-supply", index })} />
                    )}
                    {item && !supplies.has(item.id) && (
                      <MenuEntry label="Empty" onSelect={() => edit({ kind: "carry", index, item: null })} />
                    )}
                    {offered(null).map((choice) => (
                      <MenuEntry
                        key={choice.id}
                        item={choice}
                        label={choice.name}
                        onSelect={() => edit({ kind: "carry", index, item: choice })}
                      />
                    ))}
                  </Dropdown>
                </div>
              );
            })}
          </div>
        </section>
        {editor.stock.length > 0 && (
          <section>
            <h3>Supplies</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {remainingStock(editor.stock, editor.base, draft).map(({ item, quantity }) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Take ${item.name}`}
                  onClick={() => edit({ kind: "take-supply", id: item.id })}
                  style={{ ...menuEntryStyle, gridTemplateColumns: "24px 1fr auto" }}
                >
                  <img src={item.inventoryImage} alt="" style={{ maxHeight: 24, imageRendering: "pixelated" }} />
                  <span>{item.name}</span>
                  <span>{quantity} left</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
      {refusal && <p role="alert">{editRefusal(sim.catalog, refusal)}</p>}
      {notices.map((notice) => (
        <p key={notice} role="status">
          {notice}
        </p>
      ))}
      <div style={{ display: "flex", gap: 8 }}>
        <RuneScapeButton type="button" onClick={apply}>
          Apply
        </RuneScapeButton>
        <RuneScapeButton type="button" onClick={reset}>
          Reset
        </RuneScapeButton>
      </div>
    </div>
  );
}

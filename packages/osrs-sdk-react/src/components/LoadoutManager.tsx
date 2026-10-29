import React, { useState } from "react";
import { SDK_ITEM_CATALOG, Settings, slotsClearedBy } from "osrs-sdk";
import type { Loadout as LoadoutData, LoadoutItemId, WornItem } from "osrs-sdk";
import { Modal } from "./Modal";
import { RuneScapeButton } from "./RuneScapeButton";
import { RuneScapePanel } from "./RuneScapePanel";
import { Loadout } from "./Loadout";
import type { GetLoadoutSubstitutes, LoadoutSlot } from "./Loadout";
import { useTrainerContext } from "../TrainerContext";

export type LoadoutManagerProps = {
  getSubstitutes?: GetLoadoutSubstitutes;
  loadouts: LoadoutData[];
  onClose: () => void;
  open: boolean;
};

function wornItem(itemId: LoadoutItemId): WornItem | null {
  const item = itemId === null ? undefined : SDK_ITEM_CATALOG.get(itemId);
  return item && item.slot !== "carried" ? item : null;
}

export function LoadoutManager({ getSubstitutes, loadouts, onClose, open }: LoadoutManagerProps) {
  const trainer = useTrainerContext();
  const settings = Settings.getSnapshot();
  const savedLoadoutIndex = loadouts.findIndex((template) => template.name === settings.loadout);
  const savedCustomLoadout =
    settings.customLoadout?.name === loadouts[savedLoadoutIndex]?.name ? settings.customLoadout : null;
  const [selectedLoadoutIndex, setSelectedLoadoutIndex] = useState(savedLoadoutIndex >= 0 ? savedLoadoutIndex : 0);
  const [loadout, setLoadout] = useState<LoadoutData | undefined>(
    savedCustomLoadout ?? loadouts[savedLoadoutIndex >= 0 ? savedLoadoutIndex : 0],
  );
  const [isCustomLoadout, setIsCustomLoadout] = useState(savedCustomLoadout !== null);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  // Selecting something from the dropdown resets to a base loadout and clears custom state.
  const onSelectTemplatedLoadout = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (event.currentTarget.value === "custom") return;
    const nextIndex = Number(event.currentTarget.value);
    const nextLoadout = loadouts[nextIndex];
    if (!nextLoadout) return;
    setSelectedLoadoutIndex(nextIndex);
    setLoadout(nextLoadout);
    setIsCustomLoadout(false);
    setHasPendingChanges(true);
    Settings.set({ loadout: nextLoadout.name, customLoadout: null });
  };

  // Change a specific slot, including the opposing slot for two-handed weapons.
  const onItemSelect = (slot: LoadoutSlot, itemId: LoadoutItemId) => {
    if (!loadout) return;

    const nextLoadout =
      slot.kind === "equipment"
        ? (() => {
            const equipment = { ...loadout.equipment, [slot.slot]: itemId };
            const selected = wornItem(itemId);
            const weapon = wornItem(loadout.equipment.weapon);
            for (const cleared of selected ? slotsClearedBy(selected, weapon) : []) equipment[cleared] = null;
            return { ...loadout, equipment };
          })()
        : (() => {
            const inventory = [...loadout.inventory];
            inventory[slot.index] = itemId;
            return { ...loadout, inventory };
          })();

    setLoadout(nextLoadout);
    setIsCustomLoadout(true);
    setHasPendingChanges(true);
    Settings.set({ loadout: nextLoadout.name, customLoadout: nextLoadout });
  };

  const close = () => {
    if (hasPendingChanges) {
      trainer.reset();
      setHasPendingChanges(false);
    }
    onClose();
  };

  const getLoadoutSubstitutes: GetLoadoutSubstitutes = (slot, catalog) => {
    if (getSubstitutes) return getSubstitutes(slot, catalog);
    return catalog.items.filter((item) => slot === null || item.slot === slot).map((item) => item.id);
  };

  return (
    <Modal open={open}>
      <RuneScapePanel
        style={{
          minWidth: 320,
        }}
      >
        <h2>Loadout</h2>
        {loadouts.length > 0 ? (
          <>
            <label htmlFor="loadout-select">Template: </label>
            <select
              id="loadout-select"
              value={isCustomLoadout ? "custom" : String(selectedLoadoutIndex)}
              onChange={onSelectTemplatedLoadout}
            >
              {isCustomLoadout && <option value="custom">Custom*</option>}
              {loadouts.map((template, index) => (
                <option key={template.name} value={index}>
                  {template.name}
                </option>
              ))}
            </select>
            {loadout && (
              <Loadout
                getSubstitutes={getLoadoutSubstitutes}
                loadout={loadout}
                onItemSelect={onItemSelect}
                catalog={SDK_ITEM_CATALOG}
              />
            )}
          </>
        ) : (
          <p>No loadout templates configured.</p>
        )}
        <RuneScapeButton type="button" onClick={close}>
          {hasPendingChanges ? "Close + Reset" : "Close"}
        </RuneScapeButton>
      </RuneScapePanel>
    </Modal>
  );
}

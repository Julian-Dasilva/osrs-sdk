import React, { useMemo } from "react";
import { Settings, defineSimLoadouts, loadoutIds, parseLoadout } from "osrs-sdk";
import type {
  ActiveLoadout,
  CatalogItem,
  ItemCatalog,
  Loadout as LoadoutData,
  SimLoadouts,
  UnitEquipment,
} from "osrs-sdk";
import { LoadoutEditor } from "./LoadoutEditor";
import type { LoadoutEditorStore } from "./LoadoutEditor";
import { Modal } from "./Modal";
import { RuneScapeButton } from "./RuneScapeButton";
import { RuneScapePanel } from "./RuneScapePanel";
import { useTrainerContext } from "../TrainerContext";

export type GetLoadoutSubstitutes = (slot: keyof UnitEquipment | null, catalog: ItemCatalog) => number[];

export type LoadoutManagerProps = {
  getSubstitutes?: GetLoadoutSubstitutes;
  loadouts: LoadoutData[];
  onClose: () => void;
  open: boolean;
};

function templateLoadouts(loadouts: readonly LoadoutData[]): SimLoadouts {
  return defineSimLoadouts({
    sim: "templates",
    items: [],
    presets: loadouts.map((template) => ({
      id: template.name,
      label: template.name,
      revision: 1,
      loadout: template,
      startOptions: [],
    })),
    defaultPreset: loadouts[0].name,
    supplyStock: [],
    startOptions: [],
  });
}

function regionTemplateStore(sim: SimLoadouts): LoadoutEditorStore {
  const preset = (id: string) => sim.presets.find((candidate) => candidate.id === id) ?? sim.presets[0];
  return {
    active(): ActiveLoadout {
      const selected = preset(Settings.loadout);
      const custom = Settings.customLoadout;
      if (custom?.name !== selected.id) {
        return { preset: selected, storage: "kept", source: "preset", loadout: selected.loadout, refusedEdit: [] };
      }
      const parsed = parseLoadout(sim.catalog, custom);
      if (parsed.kind === "refused") {
        return {
          preset: selected,
          storage: "kept",
          source: "preset",
          loadout: selected.loadout,
          refusedEdit: parsed.rejections,
        };
      }
      return { preset: selected, storage: "kept", source: "edit", loadout: parsed.loadout, presetChanged: false };
    },
    save(id, loadout) {
      const { equipment, inventory } = loadoutIds(loadout);
      Settings.set({
        loadout: id,
        customLoadout: { name: id, equipment: { ...equipment }, inventory: [...inventory] },
      });
    },
    reset(id) {
      if (Settings.customLoadout?.name === id) Settings.set({ customLoadout: null });
    },
    select(id) {
      Settings.set({ loadout: id });
    },
  };
}

/** `LoadoutEditor` over `Region` templates, for apps that pass templates to `Region`. Sims with presets mount `LoadoutEditor`. */
export function LoadoutManager({ getSubstitutes, loadouts, onClose, open }: LoadoutManagerProps) {
  const trainer = useTrainerContext();
  const sim = useMemo(() => (loadouts.length > 0 ? templateLoadouts(loadouts) : null), [loadouts]);
  const store = useMemo(() => sim && regionTemplateStore(sim), [sim]);

  return (
    <Modal open={open}>
      <RuneScapePanel style={{ minWidth: 320 }}>
        <h2>Loadout</h2>
        {sim && store ? (
          <LoadoutEditor
            sim={sim}
            store={store}
            onApply={() => {
              trainer.reset();
              onClose();
            }}
            choices={
              getSubstitutes &&
              ((slot) =>
                getSubstitutes(slot, sim.catalog)
                  .map((id) => sim.catalog.get(id))
                  .filter((item): item is CatalogItem => item !== undefined))
            }
          />
        ) : (
          <p>No loadout templates configured.</p>
        )}
        <RuneScapeButton type="button" onClick={onClose}>
          Close
        </RuneScapeButton>
      </RuneScapePanel>
    </Modal>
  );
}

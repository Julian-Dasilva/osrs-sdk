import React, { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { LoadoutEditor } from "osrs-sdk-react";
import { Settings, defineSimLoadouts } from "../../src";
import type { CatalogLoadout } from "../../src";

const KEY = "osrs-sdk:loadouts:editor-sim";
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
const bag = (...ids: (number | null)[]) => [...ids, ...Array<null>(28 - ids.length).fill(null)];

const MAX_IDS = {
  equipment: { ...NOTHING_WORN, weapon: 12006, offhand: 22322, helmet: 27235 },
  inventory: bag(20997, 6685, 6685, 3024),
};
const MELEE_IDS = { equipment: { ...NOTHING_WORN, weapon: 22325 }, inventory: bag(3024) };

const SIM = defineSimLoadouts({
  sim: "editor-sim",
  items: [],
  presets: [
    { id: "max", label: "Max", revision: 2, loadout: MAX_IDS, startOptions: [] },
    { id: "melee", label: "Melee", revision: 1, loadout: MELEE_IDS, startOptions: [] },
  ],
  defaultPreset: "max",
  supplyStock: [
    { id: 6685, quantity: 2 },
    { id: 3024, quantity: 1 },
  ],
  startOptions: [],
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLDivElement;
let onApply: jest.Mock;

function render(storage: Pick<Storage, "getItem" | "setItem"> = window.localStorage) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  onApply = jest.fn();
  const store = SIM.store(storage);
  act(() => root.render(<LoadoutEditor sim={SIM} store={store} onApply={onApply} />));
}

function find<E extends HTMLElement = HTMLElement>(selector: string): E {
  const element = container.querySelector<E>(selector);
  if (!element) throw new Error(`nothing matches ${selector}`);
  return element;
}

function button(within: ParentNode, text: string): HTMLButtonElement {
  const match = Array.from(within.querySelectorAll("button")).find((candidate) => candidate.textContent === text);
  if (!match) throw new Error(`no button "${text}"`);
  return match;
}

function click(element: HTMLElement) {
  act(() => element.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

function choose(slotLabel: string, entry: string) {
  const slot = find(`[aria-label="${slotLabel}"]`);
  click(find(`[aria-label="${slotLabel}"] button`));
  click(button(slot, entry));
}

function drag(from: number, to: number) {
  const fire = (type: string, slot: number) => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    // jsdom has no DataTransfer; the editor only writes to it.
    Object.defineProperty(event, "dataTransfer", { value: { setData: () => undefined, effectAllowed: "" } });
    act(() => find(`[aria-label="Inventory slot ${slot}"]`).dispatchEvent(event));
  };
  fire("dragstart", from);
  fire("dragover", to);
  fire("drop", to);
}

function left(name: string): string | undefined {
  return find(`[aria-label="Take ${name}"]`).lastElementChild?.textContent ?? undefined;
}

function texts(role: string): string[] {
  return Array.from(container.querySelectorAll(`[role="${role}"]`)).map((element) => element.textContent ?? "");
}

function ids(loadout: CatalogLoadout) {
  const equipment: Record<string, number | null> = {};
  for (const [slot, item] of Object.entries(loadout.equipment)) equipment[slot] = item?.id ?? null;
  return { equipment, inventory: loadout.inventory.map((item) => item?.id ?? null) };
}

function reopened() {
  const active = SIM.store(window.localStorage).active();
  return { preset: active.preset.id, source: active.source, ...ids(active.loadout) };
}

const stored = (values: unknown) => JSON.stringify({ version: 1, values });

beforeEach(() => {
  window.localStorage.clear();
  Settings._isMobileResult = false;
  Settings.readFromStorage();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("LoadoutEditor", () => {
  test("takes and returns supplies against the stock, and Apply saves them for a new store", () => {
    render();
    expect([left("Saradomin Brew"), left("Super Restore")]).toEqual(["2 left", "1 left"]);

    click(find('[aria-label="Take Saradomin Brew"]'));
    click(find('[aria-label="Take Saradomin Brew"]'));
    click(find('[aria-label="Take Saradomin Brew"]'));

    expect(left("Saradomin Brew")).toBe("0 left");
    expect(texts("alert")).toEqual(["No Saradomin Brew left in the supplies"]);

    choose("Inventory slot 2", "Return");
    choose("Inventory slot 3", "Return");
    choose("Inventory slot 5", "Return");
    choose("Inventory slot 6", "Return");

    expect(left("Saradomin Brew")).toBe("4 left");
    click(find('[aria-label="Take Super Restore"]'));
    click(button(container, "Apply"));

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(reopened()).toEqual({
      preset: "max",
      source: "edit",
      equipment: MAX_IDS.equipment,
      inventory: bag(20997, 3024, null, 3024),
    });
  });

  test("dragging an item onto another inventory slot swaps them and marks the preset edited", () => {
    render();

    drag(1, 4);

    expect(find<HTMLSelectElement>("select").selectedOptions[0].textContent).toBe("Max (edited)");
    click(button(container, "Apply"));
    expect(reopened().inventory).toEqual(bag(3024, 6685, 6685, 20997));
  });

  test("equipping a two-handed weapon empties the offhand", () => {
    render();

    choose("Weapon", "Twisted Bow");
    click(button(container, "Apply"));

    expect(reopened().equipment).toEqual({ ...MAX_IDS.equipment, weapon: 20997, offhand: null });
  });

  test("selecting a preset shows it and keeps the choice", () => {
    render();
    const select = find<HTMLSelectElement>("select");

    act(() => {
      select.value = "melee";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(select.value).toBe("melee");
    expect(find('[aria-label="Weapon"] img').getAttribute("alt")).toBe("Scythe of Vitur");
    expect(reopened()).toEqual({ preset: "melee", source: "preset", ...MELEE_IDS });
  });

  test("switching presets keeps each one's unsaved draft, and Apply saves only the preset shown", () => {
    render();
    const select = find<HTMLSelectElement>("select");
    const pick = (id: string) =>
      act(() => {
        select.value = id;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
    const options = () => Array.from(select.options).map((option) => option.text);

    click(find('[aria-label="Take Saradomin Brew"]'));
    pick("melee");
    const onMelee = { options: options(), slot2: find('[aria-label="Inventory slot 2"]').querySelector("img") };
    pick("max");
    const backOnMax = { options: options(), slot5: find('[aria-label="Inventory slot 5"] img').getAttribute("alt") };
    click(button(container, "Apply"));

    expect({ onMelee, backOnMax, saved: reopened() }).toEqual({
      onMelee: { options: ["Max (edited)", "Melee"], slot2: null },
      backOnMax: { options: ["Max (edited)", "Melee"], slot5: "Saradomin Brew" },
      saved: {
        preset: "max",
        source: "edit",
        equipment: MAX_IDS.equipment,
        inventory: bag(20997, 6685, 6685, 3024, 6685),
      },
    });
  });

  test.each(["__proto__", "constructor", "toString"])(
    "a preset named %s opens with its own loadout and keeps its draft",
    (name) => {
      const sim = defineSimLoadouts({
        sim: "editor-sim",
        items: [],
        presets: [
          { id: name, label: "Odd", revision: 1, loadout: MELEE_IDS, startOptions: [] },
          { id: "max", label: "Max", revision: 2, loadout: MAX_IDS, startOptions: [] },
        ],
        defaultPreset: name,
        supplyStock: [{ id: 6685, quantity: 2 }],
        startOptions: [],
      });
      container = document.createElement("div");
      document.body.appendChild(container);
      root = createRoot(container);
      act(() =>
        root.render(<LoadoutEditor sim={sim} store={sim.store(window.localStorage)} onApply={() => undefined} />),
      );
      const select = find<HTMLSelectElement>("select");
      const pick = (id: string) =>
        act(() => {
          select.value = id;
          select.dispatchEvent(new Event("change", { bubbles: true }));
        });
      const weapon = () => find('[aria-label="Weapon"] img').getAttribute("alt");

      const opened = weapon();
      click(find('[aria-label="Take Saradomin Brew"]'));
      pick("max");
      pick(name);

      expect({
        opened,
        weapon: weapon(),
        slot2: find('[aria-label="Inventory slot 2"] img').getAttribute("alt"),
      }).toEqual({
        opened: "Scythe of Vitur",
        weapon: "Scythe of Vitur",
        slot2: "Saradomin Brew",
      });
    },
  );

  test("an edit of an older preset revision shows the D02 notice until Reset discards it", () => {
    const edit = { equipment: MAX_IDS.equipment, inventory: bag(6685) };
    window.localStorage.setItem(KEY, stored({ selected: "max", edits: { max: { presetRevision: 1, loadout: edit } } }));
    render();

    expect(texts("status")).toEqual(["This tier changed since you edited it"]);
    expect(find('[aria-label="Inventory slot 1"] img').getAttribute("alt")).toBe("Saradomin Brew");

    click(button(container, "Reset"));

    expect(texts("status")).toEqual([]);
    expect(find('[aria-label="Inventory slot 1"] img').getAttribute("alt")).toBe("Twisted Bow");
    expect(reopened()).toEqual({ preset: "max", source: "preset", ...MAX_IDS });
  });

  test("a saved edit this version cannot load is named, starts on the preset, and stays stored through Apply", () => {
    const edit = { equipment: MAX_IDS.equipment, inventory: bag(20997, 6685, 6685, 99999) };
    const raw = stored({ selected: "max", edits: { max: { presetRevision: 2, loadout: edit } } });
    window.localStorage.setItem(KEY, raw);
    render();

    expect(texts("status")).toEqual(["Your Max edit uses 1 item this version doesn't have (inventory slot 4)"]);
    expect(find('[aria-label="Inventory slot 4"] img').getAttribute("alt")).toBe("Super Restore");

    click(button(container, "Apply"));

    expect(window.localStorage.getItem(KEY)).toBe(raw);
  });

  test("says edits won't be kept when the browser refuses storage", () => {
    const refusing = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("SecurityError");
      },
    };
    render(refusing);

    expect(texts("status")).toEqual(["This browser is not saving data, so edits won't be kept"]);
  });
});

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { LoadoutManager, TrainerProvider } from "osrs-sdk-react";
import { AbyssalTentacle, Player, Settings, TrainerInstance, TwistedBow, Viewport, World } from "../../src";
import type { Loadout } from "../../src";
import { TestRegion } from "../../src/sdk/testing/TestRegion";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const TEMPLATES: Loadout[] = [
  {
    name: "Melee",
    equipment: {
      weapon: 12006,
      offhand: 22322,
      helmet: null,
      necklace: null,
      chest: null,
      legs: null,
      feet: null,
      gloves: null,
      ring: null,
      cape: null,
      ammo: null,
    },
    inventory: [6685, ...Array<null>(27).fill(null)],
  },
];

class TemplateRegion extends TestRegion {
  constructor() {
    super(10, 10, TEMPLATES);
    this.world = new World();
  }

  override initialiseRegion() {
    const player = new Player(this, { x: 2, y: 2 });
    this.addPlayer(player);
    return { player };
  }
}

beforeAll(() => {
  // The viewport draws to a canvas jsdom lacks; dressing never reads it.
  Viewport.viewport = { reset: jest.fn(), setPlayer: jest.fn() } as never;
});

beforeEach(() => {
  window.localStorage.clear();
  Settings._isMobileResult = false;
  Settings.readFromStorage();
});

test("Apply in LoadoutManager restarts the run on the edit, and Region templates keep dressing it", () => {
  const trainer = new TrainerInstance(new TemplateRegion());
  // Trainer.reset drives a mounted canvas jsdom lacks; the region's own reset is what dresses the player.
  const reset = jest.spyOn(trainer, "reset").mockImplementation(() => trainer.region.reset(false).player);
  const onClose = jest.fn();
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <TrainerProvider trainer={trainer}>
        <LoadoutManager loadouts={TEMPLATES} open onClose={onClose} />
      </TrainerProvider>,
    ),
  );
  const click = (element: Element | null | undefined) =>
    act(() => element?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  const buttonNamed = (text: string) =>
    Array.from(container.querySelectorAll("button")).find((candidate) => candidate.textContent === text);

  click(container.querySelector('[aria-label="Weapon"] button'));
  click(buttonNamed("Twisted Bow"));
  click(buttonNamed("Apply"));

  const restarted = trainer.region.players[0];
  expect(reset).toHaveBeenCalledTimes(1);
  expect([restarted.equipment.weapon, restarted.equipment.offhand]).toEqual([expect.any(TwistedBow), null]);
  expect(new TemplateRegion().reset(false).player.equipment.weapon).toBeInstanceOf(TwistedBow);
  expect(onClose).toHaveBeenCalledTimes(1);

  Settings.set({ customLoadout: null });
  expect(new TemplateRegion().reset(false).player.equipment.weapon).toBeInstanceOf(AbyssalTentacle);
  act(() => root.unmount());
});

import { SDK_ITEM_CATALOG } from "../../src/content/SdkItemCatalog";
import {
  AvernicDefender,
  AbyssalTentacle,
  MasoriBodyF,
  SaradominBrew,
  SuperRestore,
  TwistedBow,
} from "../../src/content";
import { dressPlayer } from "../../src/sdk/DressPlayer";
import { parseLoadout } from "../../src/sdk/Loadout";
import type { CatalogLoadout } from "../../src/sdk/Loadout";
import { Player } from "../../src/sdk/Player";
import { Viewport } from "../../src/sdk/Viewport";
import { World } from "../../src/sdk/World";
import { TestRegion } from "../../src/sdk/testing/TestRegion";

const EMPTY_EQUIPMENT = {
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

function loadout(equipment: Record<string, number>, inventory: readonly number[]): CatalogLoadout {
  const parsed = parseLoadout(SDK_ITEM_CATALOG, {
    equipment: { ...EMPTY_EQUIPMENT, ...equipment },
    inventory: [...inventory, ...Array(28 - inventory.length).fill(null)],
  });
  if (parsed.kind === "refused") throw new Error(JSON.stringify(parsed.rejections));
  return parsed.loadout;
}

class UndressedRegion extends TestRegion {
  constructor() {
    super(10, 10);
    this.world = new World();
  }

  override initialiseRegion() {
    const player = new Player(this, { x: 2, y: 2 });
    this.addPlayer(player);
    return { player };
  }
}

function worn(player: Player) {
  const classes: Record<string, unknown> = {};
  for (const slot of Object.keys(EMPTY_EQUIPMENT)) classes[slot] = player.equipment[slot]?.constructor ?? null;
  return classes;
}

beforeAll(() => {
  // The viewport draws to a canvas jsdom lacks; dressing never reads it.
  Viewport.viewport = { reset: jest.fn(), setPlayer: jest.fn() } as never;
});

test("dressPlayer replaces what a region's player wears and carries with the loadout's items", () => {
  const { player } = new UndressedRegion().reset(false);
  dressPlayer(player, loadout({ weapon: 12006, offhand: 22322 }, [6685, 6685]));

  dressPlayer(player, loadout({ weapon: 20997, chest: 27238 }, [3024]));

  expect(worn(player)).toEqual({ ...EMPTY_EQUIPMENT, weapon: TwistedBow, chest: MasoriBodyF });
  expect(player.inventory.map((item) => item?.constructor ?? null)).toEqual([SuperRestore, ...Array(27).fill(null)]);
});

test("dressPlayer builds new items for each player", () => {
  const dressed = loadout({ weapon: 12006, offhand: 22322 }, [6685]);
  const region = new UndressedRegion();
  const first = region.reset(false).player;
  const second = region.reset(false).player;

  dressPlayer(first, dressed);
  dressPlayer(second, dressed);

  expect(worn(first)).toEqual({ ...EMPTY_EQUIPMENT, weapon: AbyssalTentacle, offhand: AvernicDefender });
  expect(second.inventory[0]).toBeInstanceOf(SaradominBrew);
  expect(second.equipment.weapon).not.toBe(first.equipment.weapon);
  expect(second.inventory[0]).not.toBe(first.inventory[0]);
});

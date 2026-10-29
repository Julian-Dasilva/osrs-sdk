import { DragonArrows, SaradominBrew, TwistedBow } from "../../src/content";
import { ItemCatalog } from "../../src/sdk/ItemCatalog";
import { parseLoadout } from "../../src/sdk/Loadout";

const catalog = new ItemCatalog([TwistedBow, SaradominBrew]);

const equipment = {
  weapon: 20997,
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

describe("parseLoadout", () => {
  test("returns every rejection, not just the first", () => {
    const inventory = [6685, ...Array(26).fill(null)];
    inventory[3] = 88888;
    const { cape: _cape, ...withoutCape } = equipment;

    const parsed = parseLoadout(catalog, {
      equipment: { ...withoutCape, weapon: 99999, helmet: 20997, ring: "ring", quiver: null },
      inventory,
    });

    expect(parsed).toEqual({
      kind: "refused",
      rejections: [
        { kind: "malformed", detail: "equipment.quiver is not an equipment slot" },
        { kind: "unknown-item", id: 99999, at: { kind: "equipment", slot: "weapon" } },
        { kind: "wrong-slot", id: 20997, at: { kind: "equipment", slot: "helmet" }, fits: "weapon" },
        { kind: "malformed", detail: "equipment.ring must be an item id or null" },
        { kind: "malformed", detail: "equipment.cape must be an item id or null" },
        { kind: "malformed", detail: "inventory has 27 slots, expected 28" },
        { kind: "unknown-item", id: 88888, at: { kind: "inventory", index: 3 } },
      ],
    });
  });

  test("refuses a value that is not a loadout", () => {
    expect(parseLoadout(catalog, "Max")).toEqual({
      kind: "refused",
      rejections: [{ kind: "malformed", detail: "loadout is not an object" }],
    });
  });

  test("resolves each id to its catalog item", () => {
    const parsed = parseLoadout(catalog, { name: "Ranged", equipment, inventory: [6685, ...Array(27).fill(null)] });

    expect(parsed.kind).toBe("parsed");
    if (parsed.kind !== "parsed") return;
    expect(parsed.loadout.equipment.weapon?.build()).toBeInstanceOf(TwistedBow);
    expect(parsed.loadout.inventory.map((item) => item?.id ?? null)).toEqual([6685, ...Array(27).fill(null)]);
  });
});

describe("ItemCatalog", () => {
  test("refuses two classes that claim one id", () => {
    expect(() => new ItemCatalog([DragonArrows, DragonArrows])).toThrow(/11212/);
  });
});

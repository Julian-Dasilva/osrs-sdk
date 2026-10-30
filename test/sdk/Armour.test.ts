import { SDK_ITEM_CATALOG } from "../../src/content";
import { Equipment } from "../../src/sdk/Equipment";

type Styles = readonly [number, number, number, number, number];
type Other = readonly [number, number, number, number];
const WIKI: readonly (readonly [number, string, string, number, Styles, Styles, Other])[] = [
  [
    13199,
    "Magma helm rev 15276020",
    "helmet",
    0.9,
    [0.0, 0.0, 0.0, -5.0, -5.0],
    [52.0, 55.0, 58.0, 0.0, 50.0],
    [5.0, 0.0, 0.0, 0.0],
  ],
  [
    11665,
    "Void melee helm rev 15260466",
    "helmet",
    0.453,
    [0.0, 0.0, 0.0, 0.0, 0.0],
    [6.0, 6.0, 6.0, 6.0, 6.0],
    [0.0, 0.0, 0.0, 0.0],
  ],
  [
    11664,
    "Void ranger helm rev 15260468",
    "helmet",
    0.453,
    [0.0, 0.0, 0.0, 0.0, 0.0],
    [6.0, 6.0, 6.0, 6.0, 6.0],
    [0.0, 0.0, 0.0, 0.0],
  ],
  [
    13072,
    "Elite void top rev 15260476",
    "chest",
    6.803,
    [0.0, 0.0, 0.0, 0.0, 0.0],
    [45.0, 45.0, 45.0, 45.0, 45.0],
    [0.0, 0.0, 0.0, 3.0],
  ],
  [
    13073,
    "Elite void robe rev 15260481",
    "legs",
    8.164,
    [0.0, 0.0, 0.0, 0.0, 0.0],
    [30.0, 30.0, 30.0, 30.0, 30.0],
    [0.0, 0.0, 0.0, 3.0],
  ],
  [
    8842,
    "Void knight gloves rev 15304461",
    "gloves",
    0.453,
    [0.0, 0.0, 0.0, 0.0, 0.0],
    [6.0, 6.0, 6.0, 4.0, 6.0],
    [0.0, 0.0, 0.0, 0.0],
  ],
  [
    29004,
    "Eclipse Moon chestplate rev 15354977",
    "chest",
    3.0,
    [0.0, 0.0, 0.0, -15.0, 31.0],
    [15.0, 18.0, 57.0, 55.0, 32.0],
    [3.0, 0.0, 0.0, 0.0],
  ],
  [
    29007,
    "Eclipse Moon tassets rev 15354995",
    "legs",
    1.0,
    [0.0, 0.0, 0.0, -15.0, 17.0],
    [9.0, 13.0, 37.0, 31.0, 17.0],
    [1.0, 0.0, 0.0, 0.0],
  ],
  [
    22249,
    "Necklace of anguish (or) rev 15188731",
    "necklace",
    0.01,
    [0.0, 0.0, 0.0, 0.0, 15.0],
    [0.0, 0.0, 0.0, 0.0, 0.0],
    [0.0, 5.0, 0.0, 2.0],
  ],
  [
    27552,
    "Ghommal's avernic defender 6 rev 15324597",
    "offhand",
    0.453,
    [30.0, 29.0, 28.0, -5.0, -4.0],
    [30.0, 29.0, 28.0, -5.0, -4.0],
    [8.0, 0.0, 0.0, 0.0],
  ],
  [
    21000,
    "Twisted buckler rev 15188072",
    "offhand",
    5.443,
    [-7.0, -8.0, -7.0, -10.0, 18.0],
    [22.0, 24.0, 22.0, 26.0, 58.0],
    [0.0, 10.0, 0.0, 0.0],
  ],
  [
    11840,
    "Dragon boots rev 15364734",
    "feet",
    1.0,
    [0.0, 0.0, 0.0, -3.0, -1.0],
    [16.0, 17.0, 18.0, 0.0, 0.0],
    [4.0, 0.0, 0.0, 0.0],
  ],
  [
    25818,
    "Book of the Dead rev 15317141",
    "offhand",
    0.2,
    [0.0, 0.0, 0.0, 6.0, 0.0],
    [0.0, 0.0, 0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0, 3.0],
  ],
  [
    22981,
    "Ferocious gloves rev 15301367",
    "gloves",
    0.226,
    [16.0, 16.0, 16.0, -16.0, -16.0],
    [0.0, 0.0, 0.0, 0.0, 0.0],
    [14.0, 0.0, 0.0, 0.0],
  ],
  [
    11773,
    "Berserker ring (i) rev 15345632",
    "ring",
    0.004,
    [0.0, 0.0, 0.0, 0.0, 0.0],
    [0.0, 0.0, 8.0, 0.0, 0.0],
    [8.0, 0.0, 0.0, 0.0],
  ],
];

test.each(WIKI)("item %i equips with the wiki stats from %s", (id, page, slot, weight, attack, defence, other) => {
  const entry = SDK_ITEM_CATALOG.get(id);
  expect(entry).toBeDefined();
  if (!entry) throw new Error(`Missing item ${id} from ${page}`);
  expect(entry.slot).toBe(slot);
  const item = entry.build();
  expect(item.itemId).toBe(id);
  expect(item.weight).toBe(weight);
  expect(item).toBeInstanceOf(Equipment);
  if (!(item instanceof Equipment)) throw new Error(`Not equipment ${id}`);
  const bonuses = item.bonuses;
  expect([
    bonuses.attack.stab,
    bonuses.attack.slash,
    bonuses.attack.crush,
    bonuses.attack.magic,
    bonuses.attack.range,
  ]).toEqual(attack);
  expect([
    bonuses.defence.stab,
    bonuses.defence.slash,
    bonuses.defence.crush,
    bonuses.defence.magic,
    bonuses.defence.range,
  ]).toEqual(defence);
  expect([
    bonuses.other.meleeStrength,
    bonuses.other.rangedStrength,
    bonuses.other.magicDamage * 100,
    bonuses.other.prayer,
  ]).toEqual(other);
});

test("Divine rune pouch is carried without an equipment or cast action", () => {
  const entry = SDK_ITEM_CATALOG.get(27281);
  expect(entry).toBeDefined();
  if (!entry) throw new Error("Missing divine rune pouch");
  expect(entry.slot).toBe("carried");
  const pouch = entry.build();
  expect(pouch.itemName).toBe("Divine rune pouch");
  expect(pouch.weight).toBe(0.878);
  expect(pouch.hasInventoryLeftClick).toBe(false);
});

test.each([
  [12701, 1],
  [12699, 2],
  [12697, 3],
  [12695, 4],
])("super combat %i names its %i doses", (id, dose) => {
  const entry = SDK_ITEM_CATALOG.get(id);
  expect(entry?.name).toBe(`Super combat potion(${dose})`);
  expect(entry?.build().itemName).toBe(`Super combat potion(${dose})`);
});

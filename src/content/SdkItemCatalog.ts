import { ItemCatalog } from "../sdk/ItemCatalog";
import * as Equipment from "./equipment";
import * as Items from "./items";
import * as Weapons from "./weapons";

// Shark and Karambwan have no item id yet, so no loadout can name them.
const { Shark: _shark, Karambwan: _karambwan, ...identifiedItems } = Items;

/** Every SDK item class a loadout can name. Importing this constructs each class once. */
export const SDK_ITEM_CATALOG = new ItemCatalog(Object.values({ ...Equipment, ...identifiedItems, ...Weapons }));

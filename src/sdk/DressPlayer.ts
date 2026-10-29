import type { CatalogLoadout } from "./Loadout";
import type { Player } from "./Player";
import { UnitEquipment } from "./Unit";

/** Replaces everything the player wears and carries with new items built from `loadout`. */
export function dressPlayer(player: Player, loadout: CatalogLoadout) {
  player.setUnitOptions({
    equipment: new UnitEquipment(),
    inventory: loadout.inventory.map((item) => item?.build() ?? null),
  });
  for (const item of Object.values(loadout.equipment)) item?.build().assignToPlayer(player);
  player.equipmentChanged();
}

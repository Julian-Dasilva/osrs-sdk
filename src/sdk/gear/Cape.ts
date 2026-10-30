import { Equipment, EquipmentTypes } from "../Equipment";
import { Player } from "../Player";
import { CACHE_ASSETS } from "../../assets/CacheAssets";

import type { Ammo } from "./Ammo";
import type { Weapon } from "./Weapon";

export class Cape extends Equipment {
  ammunitionFor(_weapon: Weapon): Ammo | null {
    return null;
  }

  override get equipSoundId(): number {
    return CACHE_ASSETS.sounds.equipFun.id;
  }

  get type(): EquipmentTypes {
    return EquipmentTypes.BACK;
  }

  assignToPlayer(player: Player) {
    player.equipment.cape = this;
  }
  unassignToPlayer(player: Player) {
    player.equipment.cape = null;
  }

  currentEquipment(player: Player): Equipment {
    return player.equipment.cape;
  }
}

import InventoryImage from "../../assets/images/potions/Alliance_log.png";
import { Item } from "../../sdk/Item";
import { ItemName } from "../../sdk/ItemName";
import { ImageLoader } from "../../sdk/utils/ImageLoader";
import { SUPPLY_VALUES } from "./SupplyValues";

export class AllianceLog extends Item {
  override defaultAction = "";
  override inventorySprite = ImageLoader.createImage(this.inventoryImage);

  override get cacheItemId(): number {
    return SUPPLY_VALUES.allianceLog.id;
  }

  override get inventoryImage(): string {
    return InventoryImage;
  }

  override get itemName(): ItemName {
    return ItemName.ALLIANCE_LOG;
  }

  override get weight(): number {
    return SUPPLY_VALUES.allianceLog.weight;
  }
}

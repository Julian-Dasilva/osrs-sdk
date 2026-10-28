import { Region } from "../Region";
import type { Loadout } from "../Loadout";

export class TestRegion extends Region {
  constructor(
    private _width: number,
    private _height: number,
    loadoutTemplates: readonly Loadout[] = [],
  ) {
    super(loadoutTemplates);
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  initialiseRegion() {
    return null;
  }
}

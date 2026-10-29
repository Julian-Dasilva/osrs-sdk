jest.unmock("../../src/sdk/MapController");

import { Chrome } from "../../src/sdk/Chrome";
import { FRAME } from "../../src/sdk/FixedLayout";
import { MapController } from "../../src/sdk/MapController";
import { Settings } from "../../src/sdk/Settings";
import { Trainer } from "../../src/sdk/Trainer";
import { Viewport } from "../../src/sdk/Viewport";

// A 1280 by 800 window: the frame scales by 800 / 503, about 1.59.
const SCALE = 800 / FRAME.height;

/** A click at a point given in frame pixels. */
function at(x: number, y: number): MouseEvent {
  return { offsetX: x * SCALE, offsetY: y * SCALE } as MouseEvent;
}

describe("fixed mode at a scale above 1", () => {
  let map: MapController;

  beforeEach(() => {
    Settings.fixedMode = true;
    jest.spyOn(Chrome, "size").mockReturnValue({ width: FRAME.width * SCALE, height: FRAME.height * SCALE });
    map = new MapController();
    jest.spyOn(map, "updateOrbsMask").mockImplementation(() => undefined);
    jest.spyOn(map, "toggleSpecialAttack").mockImplementation(() => undefined);
    // As draw leaves them: the minimap box is the frame's, at the frame's scale.
    Settings.minimapScale = SCALE;
    map.width = 249 * SCALE;
  });

  afterEach(() => {
    Settings.fixedMode = false;
    jest.restoreAllMocks();
  });

  test("clicking the middle of the XP button where draw puts it toggles XP drops", () => {
    const drawn: { image: unknown; x: number; y: number; width: number; height: number }[] = [];
    const context = new Proxy(
      {},
      {
        get: (_target, key) =>
          key === "drawImage"
            ? (image: unknown, x: number, y: number, width: number, height: number) =>
                drawn.push({ image, x, y, width, height })
            : () => undefined,
        set: () => true,
      },
    ) as CanvasRenderingContext2D;
    jest.spyOn(map, "generateMaskedMap").mockImplementation(() => undefined);
    Viewport.viewport = { getMapRotation: () => 0 } as never;
    jest.spyOn(Trainer, "player", "get").mockReturnValue({ effects: {}, running: false } as never);
    const stats = { hitpoint: 99, prayer: 99, run: 10000, specialAttack: 100 } as never;
    map.currentStats = stats;
    map.stats = stats;
    map.draw(context);

    const button = drawn.find(({ image }) => image === map.mapXpButton);
    expect(button).toBeDefined();
    const before = Settings.displayXpDrops;
    const middle = { offsetX: button.x + button.width / 2, offsetY: button.y + button.height / 2 } as MouseEvent;
    expect(map.leftClickDown(middle)).toBe(true);
    expect(Settings.displayXpDrops).toBe(!before);
    Settings.displayXpDrops = before;
  });

  test("the spec orb stays clickable and ends above the top tab row", () => {
    expect(map.leftClickDown(at(576, 155))).toBe(true);
    expect(map.toggleSpecialAttack).toHaveBeenCalledTimes(1);
    // The tab row starts at frame y 168; no point on it under the orb belongs to the minimap.
    for (let y = 168; y < 205; y++) {
      for (let x = 550; x <= 610; x += 5)
        expect({ x, y, hit: map.leftClickDown(at(x, y)) }).toEqual({ x, y, hit: false });
    }
    expect(map.toggleSpecialAttack).toHaveBeenCalledTimes(1);
  });
});

describe("GET READY countdown anchor", () => {
  afterEach(() => {
    Settings.fixedMode = false;
  });

  test("centres on the whole canvas in the resizable layout", () => {
    expect(Viewport.countdownAnchor(1280, 800)).toEqual({ x: 640, y: 350 });
  });

  test("centres on the game view in fixed mode, as the boss bar does", () => {
    Settings.fixedMode = true;
    // The game view's centre is frame (260, 171); at scale 2 that is (520, 342).
    expect(Viewport.countdownAnchor(FRAME.width * 2, FRAME.height * 2)).toEqual({ x: 520, y: 292 });
  });
});

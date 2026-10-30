import { Settings } from "./Settings";

/** A box in frame pixels, as interface 548 and chatbox 162 of cache 2746 place it. */
export type FrameBox = Readonly<{ x: number; y: number; width: number; height: number }>;
export type FrameSprite = Readonly<{
  sprite: number;
  x: number;
  y: number;
  width: number;
  height: number;
  tiled: boolean;
}>;
export type Placement = Readonly<{ left: number; top: number; scale: number }>;

export const FRAME = { width: 765, height: 503 } as const;
export const GAME_VIEW: FrameBox = { x: 4, y: 4, width: 512, height: 334 };
export const MINIMAP: FrameBox = { x: 516, y: 4, width: 249, height: 163 };
export const SIDE_PANEL: FrameBox = { x: 547, y: 205, width: 190, height: 261 };
export const CHATBOX: FrameBox = { x: 0, y: 338, width: 519, height: 165 };

const TAB_LEFTS = [526, 560, 593, 626, 659, 692, 726] as const;
const TAB_ROWS = [168, 466] as const;
export const TAB = { width: 33, height: 36 } as const;

/** In the client's draw order: later pieces overlap earlier ones. */
export const FRAME_SPRITES: readonly FrameSprite[] = [
  { sprite: 1039, x: 0, y: 0, width: 717, height: 4, tiled: true },
  { sprite: 1441, x: 717, y: 0, width: 48, height: 4, tiled: false },
  { sprite: 4, x: 0, y: 4, width: 4, height: 334, tiled: false },
  { sprite: 1037, x: 516, y: 4, width: 29, height: 156, tiled: false },
  { sprite: 1038, x: 717, y: 4, width: 48, height: 156, tiled: false },
  { sprite: 1611, x: 516, y: 160, width: 249, height: 8, tiled: false },
  { sprite: 1036, x: 516, y: 167, width: 249, height: 38, tiled: false },
  { sprite: 1033, x: 516, y: 205, width: 31, height: 133, tiled: false },
  { sprite: 1034, x: 519, y: 338, width: 28, height: 128, tiled: false },
  { sprite: 1035, x: 737, y: 205, width: 28, height: 261, tiled: false },
  { sprite: 1031, x: 547, y: 205, width: 190, height: 261, tiled: false },
  { sprite: 1032, x: 519, y: 466, width: 246, height: 37, tiled: false },
  { sprite: 1017, x: 0, y: 338, width: 519, height: 142, tiled: false },
  { sprite: 1018, x: 0, y: 480, width: 519, height: 23, tiled: false },
];
/** Kept out of FRAME_SPRITES: MapController draws it after the map and compass. */
export const MINIMAP_COVER: FrameSprite = { sprite: 1182, x: 545, y: 4, width: 172, height: 156, tiled: false };
/** By tab index. The end slots use the client's wider corner stones, so their x differs from TAB_LEFTS. */
const SELECTED_STONES: readonly (readonly [number, number])[] = [
  [1026, 520],
  [1030, 560],
  [1030, 593],
  [1030, 626],
  [1030, 659],
  [1030, 692],
  [1027, 725],
  [1028, 522],
  [1030, 560],
  [1030, 593],
  [1030, 626],
  [1030, 659],
  [1030, 692],
  [1029, 725],
];

const MISSING_SPRITE_FILL = "#3e3529";
/**
 * How far a tab pixel's channels may sit from the empty tab's and still count as stone: the tab images carry an ICC
 * profile and the empty tab a gamma, so the browser decodes the same stone a few levels apart.
 */
const STONE_TOLERANCE = 8;

export class FixedLayout {
  private static sprites = new Map<number, CanvasImageSource>();
  private static icons = new Map<HTMLImageElement, OffscreenCanvas>();

  /** Keyed by cache sprite id; replaces the previous set. A missing sprite leaves plain stone. */
  static setSprites(sprites: ReadonlyMap<number, CanvasImageSource>): void {
    FixedLayout.sprites = new Map(sprites);
  }

  static get enabled(): boolean {
    return Settings.fixedMode;
  }

  /** Where the frame sits in a playable area of the given CSS size: as large as fits, centred. */
  static place(areaWidth: number, areaHeight: number): Placement {
    const scale = Math.max(0.1, Math.min(areaWidth / FRAME.width, areaHeight / FRAME.height));
    return {
      left: Math.round((areaWidth - FRAME.width * scale) / 2),
      top: Math.round((areaHeight - FRAME.height * scale) / 2),
      scale,
    };
  }

  /** The scale of a canvas already sized to the frame. */
  static scaleOf(canvasWidth: number): number {
    return canvasWidth / FRAME.width;
  }

  static gameView(scale: number): FrameBox {
    return scaled(GAME_VIEW, scale);
  }

  static tabPosition(index: number, scale: number): Readonly<{ x: number; y: number }> {
    const slot = index % TAB_LEFTS.length;
    const row = Math.min(1, Math.floor(index / TAB_LEFTS.length));
    return { x: TAB_LEFTS[slot] * scale, y: TAB_ROWS[row] * scale };
  }

  /** Draws the frame around the game view, which stays clear for the 3D layer underneath. */
  static drawFrame(context: CanvasRenderingContext2D, scale: number): void {
    context.save();
    context.imageSmoothingEnabled = false;
    context.fillStyle = MISSING_SPRITE_FILL;
    context.fillRect(
      (GAME_VIEW.x + GAME_VIEW.width) * scale,
      0,
      (FRAME.width - GAME_VIEW.x - GAME_VIEW.width) * scale,
      FRAME.height * scale,
    );
    context.fillRect(
      0,
      (GAME_VIEW.y + GAME_VIEW.height) * scale,
      FRAME.width * scale,
      (FRAME.height - GAME_VIEW.y - GAME_VIEW.height) * scale,
    );
    // The map shows through the cover's hole; where a region has no map image, the hole is black, as in the client.
    context.fillStyle = "#000";
    context.fillRect(
      MINIMAP_COVER.x * scale,
      MINIMAP_COVER.y * scale,
      MINIMAP_COVER.width * scale,
      MINIMAP_COVER.height * scale,
    );
    for (const piece of FRAME_SPRITES) FixedLayout.drawSprite(context, piece, scale);
    context.restore();
  }

  static drawSelectedStone(context: CanvasRenderingContext2D, index: number, scale: number): void {
    const stone = SELECTED_STONES[index];
    if (stone === undefined) return;
    const [sprite, x] = stone;
    const image = FixedLayout.sprites.get(sprite);
    if (image === undefined) return;
    const y = TAB_ROWS[index < TAB_LEFTS.length ? 0 : 1];
    context.drawImage(image, x * scale, y * scale, imageWidth(image) * scale, imageHeight(image) * scale);
  }

  /** `tab` with the pixels that match `stone` made transparent. Null until both images have loaded; cached per tab. */
  static tabIcon(tab: HTMLImageElement, stone: HTMLImageElement): OffscreenCanvas | null {
    const cached = FixedLayout.icons.get(tab);
    if (cached !== undefined) return cached;
    if (!tab.complete || !stone.complete || tab.naturalWidth === 0 || stone.naturalWidth === 0) return null;
    const { naturalWidth: width, naturalHeight: height } = tab;
    const icon = new OffscreenCanvas(width, height);
    const context = icon.getContext("2d");
    const plain = new OffscreenCanvas(width, height).getContext("2d");
    context.drawImage(tab, 0, 0);
    plain.drawImage(stone, 0, 0);
    const pixels = context.getImageData(0, 0, width, height);
    const background = plain.getImageData(0, 0, width, height).data;
    for (let i = 0; i < pixels.data.length; i += 4) {
      let same = true;
      for (let channel = 0; channel < 4; channel++) {
        if (Math.abs(pixels.data[i + channel] - background[i + channel]) > STONE_TOLERANCE) same = false;
      }
      if (same) pixels.data[i + 3] = 0;
    }
    context.putImageData(pixels, 0, 0);
    FixedLayout.icons.set(tab, icon);
    return icon;
  }

  static drawSprite(context: CanvasRenderingContext2D, piece: FrameSprite, scale: number): void {
    const image = FixedLayout.sprites.get(piece.sprite);
    if (image === undefined) return;
    if (!piece.tiled) {
      context.drawImage(image, piece.x * scale, piece.y * scale, piece.width * scale, piece.height * scale);
      return;
    }
    const tileWidth = imageWidth(image);
    for (let x = 0; x < piece.width; x += tileWidth) {
      const width = Math.min(tileWidth, piece.width - x);
      context.drawImage(
        image,
        0,
        0,
        width,
        piece.height,
        (piece.x + x) * scale,
        piece.y * scale,
        width * scale,
        piece.height * scale,
      );
    }
  }
}

function scaled(box: FrameBox, scale: number): FrameBox {
  return { x: box.x * scale, y: box.y * scale, width: box.width * scale, height: box.height * scale };
}

function imageWidth(image: CanvasImageSource): number {
  return "width" in image && typeof image.width === "number" ? image.width : 0;
}

function imageHeight(image: CanvasImageSource): number {
  return "height" in image && typeof image.height === "number" ? image.height : 0;
}

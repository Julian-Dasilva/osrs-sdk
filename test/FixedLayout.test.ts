import { CHATBOX, FixedLayout, FRAME, FRAME_SPRITES, GAME_VIEW, MINIMAP, SIDE_PANEL } from "../src/sdk/FixedLayout";

test("fits the 765 by 503 frame in the playable area and centres it", () => {
  expect(FixedLayout.place(1530, 1006)).toEqual({ left: 0, top: 0, scale: 2 });
  expect(FixedLayout.place(1920, 1006)).toEqual({ left: 195, top: 0, scale: 2 });
  expect(FixedLayout.place(765, 803)).toEqual({ left: 0, top: 150, scale: 1 });
});

test("places the game view, minimap, side panel and chatbox where interface 548 and the chatbox put them", () => {
  expect(GAME_VIEW).toEqual({ x: 4, y: 4, width: 512, height: 334 });
  expect(MINIMAP).toEqual({ x: 516, y: 4, width: 249, height: 163 });
  expect(SIDE_PANEL).toEqual({ x: 547, y: 205, width: 190, height: 261 });
  expect(CHATBOX).toEqual({ x: 0, y: 338, width: 519, height: 165 });
  expect(FixedLayout.gameView(2)).toEqual({ x: 8, y: 8, width: 1024, height: 668 });
});

test("puts tabs 0 to 6 on the top row and 7 to 13 on the bottom row, in the same seven slots", () => {
  expect(FixedLayout.tabPosition(0, 1)).toEqual({ x: 526, y: 168 });
  expect(FixedLayout.tabPosition(6, 1)).toEqual({ x: 726, y: 168 });
  expect(FixedLayout.tabPosition(7, 1)).toEqual({ x: 526, y: 466 });
  expect(FixedLayout.tabPosition(13, 2)).toEqual({ x: 1452, y: 932 });
});

test("frame sprites stay inside the frame and clear of the game view", () => {
  for (const piece of FRAME_SPRITES) {
    expect(
      piece.x >= 0 && piece.y >= 0 && piece.x + piece.width <= FRAME.width && piece.y + piece.height <= FRAME.height,
    ).toBe(true);
    const overlapsGame =
      piece.x < GAME_VIEW.x + GAME_VIEW.width &&
      piece.x + piece.width > GAME_VIEW.x &&
      piece.y < GAME_VIEW.y + GAME_VIEW.height &&
      piece.y + piece.height > GAME_VIEW.y;
    expect({ sprite: piece.sprite, overlapsGame }).toEqual({ sprite: piece.sprite, overlapsGame: false });
  }
});

// jsdom has no OffscreenCanvas; this one copies an image's pixels so the cut can be read back.
type Pixels = Uint8ClampedArray;
class PixelCanvas {
  data: Pixels;
  constructor(
    public width: number,
    public height: number,
  ) {
    this.data = new Uint8ClampedArray(width * height * 4);
  }
  getContext() {
    return {
      drawImage: (image: { pixels: Pixels }) => this.data.set(image.pixels),
      getImageData: () => ({ data: new Uint8ClampedArray(this.data) }),
      putImageData: (image: { data: Pixels }) => this.data.set(image.data),
    };
  }
}

function image(pixels: number[], complete = true): HTMLImageElement {
  return {
    complete,
    naturalWidth: pixels.length / 4,
    naturalHeight: 1,
    pixels: Uint8ClampedArray.from(pixels),
  } as unknown as HTMLImageElement;
}

test("cuts a tab's icon from its plain stone so the open tab's icon can sit on the red stone", () => {
  Object.defineProperty(globalThis, "OffscreenCanvas", { configurable: true, value: PixelCanvas });
  const stone = image([100, 91, 79, 255, 100, 91, 79, 255, 100, 91, 79, 255]);
  const tab = image([100, 91, 79, 255, 103, 88, 80, 255, 232, 245, 232, 255]);
  expect(FixedLayout.tabIcon(image([1, 2, 3, 255], false), stone)).toBeNull();
  const icon = FixedLayout.tabIcon(tab, stone) as unknown as PixelCanvas;
  expect(Array.from(icon.data)).toEqual([100, 91, 79, 0, 103, 88, 80, 0, 232, 245, 232, 255]);
  expect(FixedLayout.tabIcon(tab, stone)).toBe(icon);
});

import type { ImageLoader as ImageLoaderClass } from "../../src/sdk/utils/ImageLoader";

// jsdom fetches no images, so each test dispatches the browser's load and error events itself.
describe("image loading", () => {
  let ImageLoader: typeof ImageLoaderClass;
  let settled: (Error | null)[];

  const checkImages = () => ImageLoader.checkImagesLoaded(setInterval(() => undefined, 50));

  beforeEach(() => {
    jest.useFakeTimers();
    jest.isolateModules(() => {
      ({ ImageLoader } = require("../../src/sdk/utils/ImageLoader"));
    });
    settled = [];
    ImageLoader.onAllImagesLoaded((failure?: Error) => settled.push(failure ?? null));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("waits for a failed image to load on a retry", () => {
    const orb = ImageLoader.createImage("map_prayer_orb.png");

    orb.dispatchEvent(new Event("error"));
    checkImages();
    expect(settled).toEqual([]);

    orb.dispatchEvent(new Event("load"));
    checkImages();
    expect(settled).toEqual([null]);
  });

  it("fails with the image's address once every retry has failed", () => {
    const orb = ImageLoader.createImage("map_prayer_orb.png");

    for (let attempt = 0; attempt < 5; attempt++) {
      orb.dispatchEvent(new Event("error"));
      jest.runOnlyPendingTimers();
    }
    checkImages();

    expect(settled).toEqual([new Error("Image failed to load: map_prayer_orb.png")]);
  });
});

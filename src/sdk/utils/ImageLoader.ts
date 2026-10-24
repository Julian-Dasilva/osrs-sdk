const RETRY_DELAYS_MS = [250, 500, 1000, 2000];

type ImageLoad = "loading" | "loaded" | Error;

export class ImageLoader {
  static onLoadFns: ((failure?: Error) => void)[] = [];
  static loads = new Map<string, ImageLoad>();

  static imageCache = {};

  static createImage(src: string): HTMLImageElement {
    if (!src) {
      return null;
    }

    if (this.imageCache[src]) {
      return this.imageCache[src];
    }

    ImageLoader.loads.set(src, "loading");
    const img = new Image();
    let retries = 0;
    img.addEventListener("load", () => {
      ImageLoader.loads.set(src, "loaded");
    });
    img.addEventListener("error", () => {
      if (retries === RETRY_DELAYS_MS.length) {
        ImageLoader.loads.set(src, new Error(`Image failed to load: ${src}`));
        return;
      }
      setTimeout(() => {
        img.src = src;
      }, RETRY_DELAYS_MS[retries++]);
    });
    img.src = src;
    this.imageCache[src] = img;
    return img;
  }

  static allImagesLoaded() {
    return Array.from(ImageLoader.loads.values()).every((load) => load === "loaded");
  }

  /** Calls `loadFn` once every image has loaded, or as soon as one has failed every retry, with an error naming that image. */
  static onAllImagesLoaded(loadFn: (failure?: Error) => void) {
    ImageLoader.onLoadFns.push(loadFn);
    return () => {
      ImageLoader.onLoadFns = ImageLoader.onLoadFns.filter((listener) => listener !== loadFn);
    };
  }

  static checkImagesLoaded(timer: NodeJS.Timeout) {
    const loads = Array.from(ImageLoader.loads.values());
    const failure = loads.find((load): load is Error => load instanceof Error);
    if (!failure && loads.includes("loading")) {
      return;
    }
    ImageLoader.onLoadFns.forEach((onLoadFunction) => onLoadFunction(failure));
    clearInterval(timer);
  }
}

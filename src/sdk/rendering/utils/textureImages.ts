import * as THREE from "three";
import type { CacheRenderTexture } from "../../../cache-render-format";

export function textureImages(
  textures: Readonly<Record<string, CacheRenderTexture>> | undefined,
): Map<number, THREE.DataTexture> {
  const images = new Map<number, THREE.DataTexture>();
  if (!textures) return images;
  Object.entries(textures).forEach(([id, texture]) => {
    const rgba = new Uint8Array(texture.pixels.length * 4);
    texture.pixels.forEach((pixel, index) => {
      const value = pixel >>> 0;
      rgba[index * 4] = (value >> 16) & 255;
      rgba[index * 4 + 1] = (value >> 8) & 255;
      rgba[index * 4 + 2] = value & 255;
      rgba[index * 4 + 3] = (value >> 24) & 255;
    });
    const image = new THREE.DataTexture(rgba, texture.width, texture.height, THREE.RGBAFormat);
    image.flipY = false;
    image.needsUpdate = true;
    images.set(Number(id), image);
  });
  return images;
}

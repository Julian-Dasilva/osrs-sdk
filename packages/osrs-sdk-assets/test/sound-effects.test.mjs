import { test } from "node:test";
import assert from "node:assert/strict";
import { readSoundEffects } from "../src/adapter.mts";

test("reads the sounds the cache holds and skips the ones it lacks", async () => {
  const held = new Map([
    [3, new Uint8Array([3])],
    [7, new Uint8Array([7, 7])],
  ]);
  const warnings = [];
  const getFile = async (id) => {
    if (id === 5) throw new TypeError("Cannot read properties of undefined (reading 'content')");
    return held.has(id) ? { content: held.get(id) } : undefined;
  };
  const sounds = await readSoundEffects(new Set([7, 5, 3, 9]), getFile, (message) => warnings.push(message));
  assert.deepEqual(
    sounds.map(({ id, bytes }) => [id, [...bytes]]),
    [
      [3, [3]],
      [7, [7, 7]],
    ],
  );
  assert.deepEqual(warnings, [
    "osrs-sdk-assets: sound effect 5 is not in this cache; skipped",
    "osrs-sdk-assets: sound effect 9 is not in this cache; skipped",
  ]);
});

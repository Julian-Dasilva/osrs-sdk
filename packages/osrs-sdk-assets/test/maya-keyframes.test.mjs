import { test } from "node:test";
import assert from "node:assert/strict";
import { keyframeTimeline } from "../src/maya-keyframes.mts";

const pose = (x) => [[1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, 0, 0, 1]];

// The reader's step evaluation: each cycle before a key repeats that key's pose.
const stepped = [pose(0), pose(4), pose(4), pose(4), pose(4), pose(12), pose(12), pose(12), pose(12)];

test("keeps one pose per Animaya key, lasting until the next key", () => {
  const timeline = keyframeTimeline(stepped);
  assert.deepEqual(timeline.poses, [pose(0), pose(4), pose(12)]);
  assert.deepEqual(timeline.lengths, [4, 4, 1]);
  assert.deepEqual(timeline.frameSounds, {});
});

test("starts a frame sound between keys on its own cycle with an interpolated pose", () => {
  const timeline = keyframeTimeline(stepped, { 1: ["between"], 4: ["on key"] });
  assert.deepEqual(timeline.poses, [pose(0), pose(1), pose(4), pose(12)]);
  assert.deepEqual(timeline.lengths, [1, 3, 4, 1]);
  assert.deepEqual(timeline.frameSounds, { 1: ["between"], 2: ["on key"] });
});

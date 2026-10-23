// The runtime reads these into a Float32Array and divides translations (12 to 14) by 128,
// so the dropped digits never reach the screen.
export function roundBoneMatrix(values) {
  return Array.from(values, (value, index) => {
    const scale = index >= 12 && index <= 14 ? 1e3 : 1e5;
    return Math.round(value * scale) / scale;
  });
}

const samePose = (a, b) => a.every((bone, i) => bone.every((value, j) => value === b[i][j]));

function lerpPose(from, to, t) {
  return from.map((bone, i) => roundBoneMatrix(bone.map((value, j) => value + (to[i][j] - value) * t)));
}

/**
 * The reader evaluates Animaya curves as steps: each cycle before a key already holds that key's pose.
 * Emit one pose per key on its own cycle, lasting until the next key, so the runtime's frame blend
 * spreads each move across the gap. A sound on a cycle between keys gets a pose interpolated on
 * that cycle, so it still starts there.
 */
export function keyframeTimeline(cyclePoses, frameSounds = {}) {
  const last = cyclePoses.length - 1;
  const keys = cyclePoses.flatMap((pose, cycle) =>
    cycle === 0 || cycle === last || !samePose(pose, cyclePoses[cycle + 1]) ? [cycle] : [],
  );
  const soundCycles = Object.keys(frameSounds)
    .map(Number)
    .filter((cycle) => Number.isInteger(cycle) && cycle >= 0 && cycle <= last);
  const starts = [...new Set([...keys, ...soundCycles])].sort((a, b) => a - b);

  const poses = starts.map((cycle) => {
    const next = keys.findIndex((key) => key >= cycle);
    if (keys[next] === cycle) return cyclePoses[cycle];
    const before = keys[next - 1], after = keys[next];
    return lerpPose(cyclePoses[before], cyclePoses[after], (cycle - before) / (after - before));
  });
  const lengths = starts.map((cycle, index) => (starts[index + 1] ?? cyclePoses.length) - cycle);
  const sounds = Object.fromEntries(
    soundCycles.map((cycle) => [String(starts.indexOf(cycle)), frameSounds[String(cycle)]]),
  );
  return { poses, lengths, frameSounds: sounds };
}

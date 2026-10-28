import { levelPosedFrame } from "../src/sdk/rendering/utils/animations";

test("a rising shard keeps its bind height, and a scaled-away slab returns centred", () => {
  const slab = Array.from({ length: 21 }, (_, index) => index);
  const chunk = [21, 22, 23];
  const bind = slab.reduce<number[]>((values, index) => values.concat([index * 0.1, 0.05, 0.2]), []);
  bind.push(0, 0.4, 0, 0.3, 0.4, 0, 0, 0.4, 0.3);
  const posed = Float32Array.from(bind);
  for (const vertex of slab) {
    posed[vertex * 3] = 0;
    posed[vertex * 3 + 1] = 0;
    posed[vertex * 3 + 2] = 0;
  }
  posed[21 * 3 + 1] = 2;
  posed[22 * 3 + 1] = 2;
  posed[23 * 3 + 1] = 2;

  levelPosedFrame(bind, posed, [slab, chunk]);

  const centre = slab.reduce((sum, vertex) => sum + bind[vertex * 3], 0) / slab.length;
  expect(posed[0]).toBeCloseTo((bind[0] - centre) * 0.55);
  expect(posed[1]).toBeCloseTo(0.05);
  expect(posed[2]).toBeCloseTo(0);
  expect(posed[21 * 3]).toBe(0);
  expect(posed[21 * 3 + 1]).toBeCloseTo(0.4);
  expect(posed[22 * 3]).toBeCloseTo(0.3);
});

test("restored slabs that sit apart in the bind pose gather onto one tile", () => {
  const left = Array.from({ length: 21 }, (_, index) => index);
  const right = Array.from({ length: 21 }, (_, index) => index + 21);
  const bind = left.reduce<number[]>((values, index) => values.concat([index * 0.02, 0.05, 0]), []);
  right.forEach((_, index) => bind.push(4 + index * 0.02, 0.05, 0));
  const posed = Float32Array.from(bind);
  for (let vertex = 0; vertex < 42; vertex++) {
    posed[vertex * 3] = 0;
    posed[vertex * 3 + 1] = 0;
    posed[vertex * 3 + 2] = 0;
  }

  levelPosedFrame(bind, posed, [left, right]);

  for (const verts of [left, right]) {
    let centreX = 0;
    let centreZ = 0;
    for (const vertex of verts) {
      centreX += posed[vertex * 3];
      centreZ += posed[vertex * 3 + 2];
    }
    const reach = Math.hypot(centreX / verts.length, centreZ / verts.length);
    expect(reach).toBeCloseTo(0.32);
    expect(posed[verts[0] * 3 + 1]).toBeCloseTo(0.05);
  }
  const leftEdge = posed[left[20] * 3] - posed[left[0] * 3];
  expect(leftEdge).toBeCloseTo(0.22);
});

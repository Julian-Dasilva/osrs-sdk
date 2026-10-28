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
  expect(posed[0]).toBeCloseTo(bind[0] - centre);
  expect(posed[1]).toBeCloseTo(0.05);
  expect(posed[2]).toBeCloseTo(0.2 - 0.2);
  expect(posed[21 * 3]).toBe(0);
  expect(posed[21 * 3 + 1]).toBeCloseTo(0.4);
  expect(posed[22 * 3]).toBeCloseTo(0.3);
});

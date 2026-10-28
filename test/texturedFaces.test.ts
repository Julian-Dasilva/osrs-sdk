import { splitTexturedFaces } from "../src/sdk/rendering/utils/texturedFaces";

const indices = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const available = new Set([215]);

describe("splitTexturedFaces", () => {
  it("keeps an untextured model on its original index buffer", () => {
    expect(splitTexturedFaces([-1, -1, -1, -1, -1, -1], indices, available)).toBeNull();
    expect(splitTexturedFaces(undefined, indices, available)).toBeNull();
    expect(splitTexturedFaces([215, 215, 215], indices, new Set())).toBeNull();
  });

  it("keeps a textured face out of the plain index list", () => {
    expect(splitTexturedFaces([-1, -1, -1, 215, 215, 215, 9, 9, 9], indices, available)).toEqual({
      plain: [0, 1, 2, 6, 7, 8],
      textured: [{ id: 215, indices: [3, 4, 5] }],
    });
  });
});

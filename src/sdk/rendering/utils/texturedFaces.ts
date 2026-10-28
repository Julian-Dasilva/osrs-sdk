export type TexturedTriangles = Readonly<{
  plain: readonly number[];
  textured: readonly Readonly<{ id: number; indices: readonly number[] }>[];
}>;

function listFor(grouped: Map<number, number[]>, texture: number): number[] {
  const existing = grouped.get(texture);
  if (existing) return existing;
  const created: number[] = [];
  grouped.set(texture, created);
  return created;
}

/**
 * InstancedMesh takes one material. A face whose texture is available has to
 * leave the plain index list, or that mesh draws the face as its lighting colour.
 * Null means every face stays on the original index buffer.
 */
export function splitTexturedFaces(
  textureIds: readonly number[] | undefined,
  indices: readonly number[],
  available: ReadonlySet<number>,
): TexturedTriangles | null {
  if (available.size === 0 || !textureIds?.some((id) => available.has(id))) return null;
  const plain: number[] = [];
  const grouped = new Map<number, number[]>();
  const faces = Math.floor(Math.min(textureIds.length, indices.length) / 3);
  for (let face = 0; face < faces; face++) {
    const at = face * 3;
    const texture = textureIds[at] ?? -1;
    const dest = available.has(texture) ? listFor(grouped, texture) : plain;
    dest.push(indices[at], indices[at + 1], indices[at + 2]);
  }
  for (let index = faces * 3; index < indices.length; index++) plain.push(indices[index]);
  const textured: { id: number; indices: number[] }[] = [];
  grouped.forEach((faceIndices, id) => {
    textured.push({ id, indices: faceIndices });
  });
  return { plain, textured };
}

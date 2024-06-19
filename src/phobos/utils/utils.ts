import { BufferAttribute, BufferGeometry, Color, Float32BufferAttribute, Material, Mesh, MeshBasicMaterial } from "three";

export const int32ToColor = (v: number): Color => new Color(((v >> 24) & 0xff) / 0x80, ((v >> 16) & 0xff) / 0x80, ((v >> 8) & 0xff) / 0x80);

const loadBinary = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load: ${url}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return arrayBuffer;
};

export const loadBinaries = async (urls) => {
  const entries = await Promise.all(
    Object.entries(urls).map(async ([key, url]) => [key, await loadBinary(url)])
  );
  return Object.fromEntries(entries);
};

export const constructMeshFromBufferGeometryData = (data: BufferGeometryData, material: Material | Material[]) => {
  const { faceVertexUvs, colors, indices, positions, normals } = data;

  const geometry = new BufferGeometry();

  // Set positions
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

  geometry.setAttribute('uv', new Float32BufferAttribute(faceVertexUvs, 2));
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
  geometry.setIndex(new BufferAttribute(new Uint16Array(indices), 1));
  geometry.setDrawRange(0, indices.length);
  geometry.addGroup(0, indices.length, 0);

  if (normals) {
    geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  }

  geometry.computeVertexNormals();

  const mesh = new Mesh(geometry, material);
  mesh.geometry.computeBoundingSphere();

  return mesh;
}
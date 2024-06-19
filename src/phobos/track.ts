import { DoubleSide, Vector3 } from "three";
import { TRACK_FACE_FLAGS, TrackFace, TrackTextureIndex, TrackVertex } from "./structs";
import { createMeshFaceMaterial, readImage, unpackImages } from "./materials";
import { constructMeshFromBufferGeometryData, createBufferGeometryDataFromPolygons, int32ToColor, loadBinaries } from "./utils/utils";

const test = (files) => {
  const vertexCount = files.vertices.byteLength / TrackVertex.byteLength;
  const rawVertices = TrackVertex.readStructs(files.vertices, 0, vertexCount);

  const vertices: number[] = [];
  rawVertices.forEach((vertex, i: number) => {
    vertices[i * 3] = vertex.x;
    vertices[i * 3 + 1] = -vertex.y;
    vertices[i * 3 + 2] = -vertex.z;
  });

  const faceCount = files.faces.byteLength / TrackFace.byteLength;
  const faces = TrackFace.readStructs(files.faces, 0, faceCount);

  const indices: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];

  faces.forEach((face) => {
    const color = int32ToColor(face.color);

    if (face.flags & TRACK_FACE_FLAGS.BOOST) {
      color.setRGB(0.25, 0.25, 2);
    }

    indices.push(face.indices[0], face.indices[1], face.indices[2]);
    indices.push(face.indices[2], face.indices[3], face.indices[0]);

    const flipx = (face.flags & TRACK_FACE_FLAGS.FLIP) ? 1 : 0;
    uvs.push(
      1 - flipx, 1,
      0 + flipx, 1,
      0 + flipx, 0,
      0 + flipx, 0,
      1 - flipx, 0,
      1 - flipx, 1
    );

    colors.push(color.r, color.g, color.b, color.r, color.g, color.b, color.r, color.g, color.b, color.r, color.g, color.b);

    // Compute normals for flat shading
    const v0 = new Vector3(vertices[face.indices[0] * 3], vertices[face.indices[0] * 3 + 1], vertices[face.indices[0] * 3 + 2]);
    const v1 = new Vector3(vertices[face.indices[1] * 3], vertices[face.indices[1] * 3 + 1], vertices[face.indices[1] * 3 + 2]);
    const v2 = new Vector3(vertices[face.indices[2] * 3], vertices[face.indices[2] * 3 + 1], vertices[face.indices[2] * 3 + 2]);

    const edge1 = new Vector3().subVectors(v1, v0);
    const edge2 = new Vector3().subVectors(v2, v0);
    const normal = new Vector3().crossVectors(edge1, edge2).normalize();

    for (let i = 0; i < 6; i++) {
      normals.push(normal.x, normal.y, normal.z);
    }
  });

  console.log({
    colors,
    indices,
    faceVertexUvs: uvs,
    positions: vertices
  })
}

export const createTrackFromFiles = async (paths: Record<string, string>) => {
  const files = await loadBinaries(paths);
  const rawImages = unpackImages(files.textures);
  const images = rawImages.map(readImage);

  const indexEntries = files.textureIndex.byteLength / TrackTextureIndex.byteLength;
  const textureIndex = TrackTextureIndex.readStructs(files.textureIndex, 0, indexEntries);

  const composedImages = textureIndex.map((idx) => {
    const composedImage = document.createElement('canvas');
    composedImage.width = 128;
    composedImage.height = 128;
    const ctx = composedImage.getContext('2d')!;

    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 4; y++) {
        const image = images[idx.near[y * 4 + x]];
        ctx.drawImage(image, x * 32, y * 32);
      }
    }
    return composedImage;
  });

  const trackMaterial = createMeshFaceMaterial(composedImages, true, DoubleSide);

  const vertexCount = files.vertices.byteLength / TrackVertex.byteLength;
  const vertices = TrackVertex.readStructs(files.vertices, 0, vertexCount);

  const faceCount = files.faces.byteLength / TrackFace.byteLength;
  const faces = TrackFace.readStructs(files.faces, 0, faceCount);

  const result = createBufferGeometryDataFromPolygons(faces, vertices);

  const uvs = faces.map(face => {
    const flipx = (face.flags & TRACK_FACE_FLAGS.FLIP) ? 1 : 0;
    return [
      1 - flipx, 1,
      0 + flipx, 1,
      0 + flipx, 0,
      0 + flipx, 0,
      1 - flipx, 0,
      1 - flipx, 1
    ];
  }).flat()

  const mesh = constructMeshFromBufferGeometryData({ ...result, faceVertexUvs: uvs }, trackMaterial);
  return mesh;
};
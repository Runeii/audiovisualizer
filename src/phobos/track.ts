import { DoubleSide } from "three";
import { TRACK_FACE_FLAGS, TrackFace, TrackTextureIndex, TrackVertex } from "./structs";
import { createMeshFaceMaterial, readImage, unpackImages } from "./materials";
import { constructMeshFromBufferGeometryData, createBufferGeometryDataFromPolygons, int32ToColor, loadBinaries } from "./utils/utils";

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

  const result = createBufferGeometryDataFromPolygons({
    polygons: faces,
    isQuad: () => true,
    dataOrder: [[0, 1, 2], [2, 3, 0]],
    vertices
  });

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

  const whiteColor = int32ToColor(0xffffff);
  const colors = faces.map((polygon) => {
    // Colors
    const constructedColors = [whiteColor, whiteColor, whiteColor, whiteColor];
    const hasColors = !!(polygon.color || polygon.colors);
    if (hasColors) {
      for (let j = 0; j < polygon.indices.length; j++) {
        const validColor = polygon.color || polygon.colors?.[j];

        if (!validColor) {
          continue;
        }

        constructedColors[j] = int32ToColor(validColor);
      }
    }
    const standardColors = [constructedColors[2], constructedColors[1], constructedColors[0]];
    const polygonColors = polygon.indices.length === 4
      ? [...standardColors, constructedColors[2], constructedColors[3], constructedColors[1]]
      : standardColors;

    return polygonColors;
  }).flat().flatMap(color => [color.r, color.g, color.b]);

  const mesh = constructMeshFromBufferGeometryData({ ...result, faceVertexUvs: uvs, colors }, trackMaterial);

  return mesh;
};
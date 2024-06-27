import { DoubleSide } from "three";
import { TrackFace, TrackTexture, TrackTextureIndex, TrackVertex } from "./structs";
import { createMeshFaceMaterial, readImage, unpackImages } from "./materials";
import { loadBinaries } from "./utils/utils";
import { createCameraSpline } from "./camera";
import { __deprecated_createTrack } from "./deprecated/__toupgrade";

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


  const trackMaterials = createMeshFaceMaterial(composedImages, true, DoubleSide);
  // Weapon tile
  trackMaterials[3].name = "tile-weapon";
  trackMaterials[3].vertexColors = false;

  const vertexCount = files.vertices.byteLength / TrackVertex.byteLength;
  const vertices = TrackVertex.readStructs(files.vertices, 0, vertexCount);

  const faceCount = files.faces.byteLength / TrackFace.byteLength;
  const faces = TrackFace.readStructs(files.faces, 0, faceCount);

  const trackTextureCount = files.trackTexture.byteLength / TrackTexture.byteLength;
  const trackTextures = TrackTexture.readStructs(files.trackTexture, 0, trackTextureCount);

  const polygonsWithTexturesApplied = faces.map((polygon, index) => {
    const texture = trackTextures[index];

    return {
      ...polygon,
      flags: texture.flags,
      tile: texture.tile,
    }
  });

  /*
  const result = createBufferGeometryDataFromPolygons({
    dataOrder: [[0, 1, 2], [2, 3, 0]],
    isQuad: () => true,
    polygons: polygonsWithTexturesApplied,
    vertices
  });

  const uvs = faces.map((face) => {
    const flipx = (face.flags & TRACK_FACE_FLAGS.FLIP) ? 1 : 0;

    return [
      1 - flipx, 1,
      0 + flipx, 1,
      0 + flipx, 0,
      0 + flipx, 0,
      1 - flipx, 0,
      1 - flipx, 1,
    ];
  }).flat()


  const colors = polygonsWithTexturesApplied.map(polygon => {
    if (polygon.flags & TRACK_FACE_FLAGS.BOOST) {
      //render boost tile as bright blue
      return [new Color(0.25, 0.25, 2), new Color(0.25, 0.25, 2)];
    }
    return [int32ToColor(polygon.color), int32ToColor(polygon.color)];
  }).flat().flat().flatMap(color => [color.r, color.g, color.b]);

  const track = constructMeshFromBufferGeometryData({
    ...result,
    colors,
    faceVertexUvs: uvs
  }, trackMaterials);
*/

  const track = __deprecated_createTrack({
    vertices,
    polygons: polygonsWithTexturesApplied,
    trackMaterials
  })

  const spline = createCameraSpline(files.sections, polygonsWithTexturesApplied, vertices);

  return { spline, track };
};
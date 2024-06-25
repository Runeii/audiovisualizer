import { Color, DoubleSide, Mesh, Vector2, Vector3 } from "three";
import { createCameraSpline } from "../camera";
import { createMeshFaceMaterial, readImage, unpackImages } from "../materials";
import { Face3 } from "three-stdlib";
import { int32ToColor, loadBinaries } from "../utils/utils";
import { TRACK_FACE_FLAGS, TrackFace, TrackTexture, TrackTextureIndex, TrackVertex } from "../structs";
import { Geometry } from "./Geometry";


export const createTrack = async (paths: Record<string, string>) => {
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
  trackMaterials[3].vertexColors = false;

  const geometry = new Geometry();

  // Load vertices
  const vertexCount = files.vertices.byteLength / TrackVertex.byteLength;
  const rawVertices = TrackVertex.readStructs(files.vertices, 0, vertexCount);

  for (let i = 0; i < rawVertices.length; i++) {
    geometry.vertices.push(new Vector3(rawVertices[i].x, -rawVertices[i].y, -rawVertices[i].z));
  }

  // Load Faces
  const faceCount = files.faces.byteLength / TrackFace.byteLength;
  const faces = TrackFace.readStructs(files.faces, 0, faceCount);

  // Load track texture file (WO2097/WOXL only)
  if (files.trackTexture) {
    const trackTextureCount = files.trackTexture.byteLength / TrackTexture.byteLength;
    const trackTextures = TrackTexture.readStructs(files.trackTexture, 0, trackTextureCount);

    // Copy data from TEX to TRF structure
    for (let i = 0; i < faces.length; i++) {
      const f = faces[i];
      const t = trackTextures[i];

      f.tile = t.tile;
      f.flags = t.flags;
    }
  }
  for (let i = 0; i < faces.length; i++) {
    const f = faces[i];

    let color = int32ToColor(f.color);
    const materialIndex = f.tile;

    if (f.flags & TRACK_FACE_FLAGS.BOOST) {
      //render boost tile as bright blue
      color = new Color(0.25, 0.25, 2);
    }


    geometry.faces.push(new Face3(f.indices[0], f.indices[1], f.indices[2], undefined, color, materialIndex));

    geometry.faces.push(new Face3(f.indices[2], f.indices[3], f.indices[0], undefined, color, materialIndex));

    const flipx = (f.flags & TRACK_FACE_FLAGS.FLIP) ? 1 : 0;
    geometry.faceVertexUvs[0].push([
      new Vector2(1 - flipx, 1),
      new Vector2(0 + flipx, 1),
      new Vector2(0 + flipx, 0)
    ]);

    geometry.faceVertexUvs[0].push([
      new Vector2(0 + flipx, 0),
      new Vector2(1 - flipx, 0),
      new Vector2(1 - flipx, 1)
    ]);
  }

  geometry.computeFaceNormals();
  geometry.computeFlatVertexNormals();

  const mesh = new Mesh(geometry.toBufferGeometry(), trackMaterials);

  const spline = createCameraSpline(files.sections, faces, geometry.vertices);
  return { spline, track: mesh };
};

export default createTrack;
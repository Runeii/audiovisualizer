/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Mesh,
} from 'three';
import { createObjectFromFiles } from './object';
import { loadBinaries } from './utils/utils';
import { createTrackFromFiles } from './track';

const createBufferGeometryDataObject = (bufferGeometry) => {
  const dataObject = {
    vertices: [],
    faces: [],
    faceVertexUvs: [],
    colors: [],
    indices: [],
    uvs: []
  };

  // Extract vertices
  const positionAttribute = bufferGeometry.getAttribute('position');
  for (let i = 0; i < positionAttribute.count; i++) {
    dataObject.vertices.push([positionAttribute.getX(i), positionAttribute.getY(i), positionAttribute.getZ(i)]);
  }

  // Extract indices
  const index = bufferGeometry.getIndex();
  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      dataObject.faces.push([index.getX(i), index.getX(i + 1), index.getX(i + 2)]);
      dataObject.indices.push(index.getX(i), index.getX(i + 1), index.getX(i + 2));
    }
  }

  // Extract UVs
  const uvAttribute = bufferGeometry.getAttribute('uv');
  if (uvAttribute) {
    for (let i = 0; i < uvAttribute.count; i++) {
      dataObject.uvs.push([uvAttribute.getX(i), uvAttribute.getY(i)]);
    }

    // Group UVs into faces
    for (let i = 0; i < uvAttribute.count; i += 3) {
      dataObject.faceVertexUvs.push([
        [uvAttribute.getX(i), uvAttribute.getY(i)],
        [uvAttribute.getX(i + 1), uvAttribute.getY(i + 1)],
        [uvAttribute.getX(i + 2), uvAttribute.getY(i + 2)]
      ]);
    }
  }

  // Extract colors
  const colorAttribute = bufferGeometry.getAttribute('color');
  if (colorAttribute) {
    for (let i = 0; i < colorAttribute.count; i++) {
      dataObject.colors.push([colorAttribute.getX(i), colorAttribute.getY(i), colorAttribute.getZ(i)]);
    }
  }

  return dataObject;
};

export const loadPath = async (path: string, loadTEXFile: boolean): Promise<Record<string, Mesh>> => {
  const scene = createObjectFromFiles(await loadBinaries({
    textures: `${path}/SCENE.CMP`,
    objects: `${path}/SCENE.PRM`
  }));

  const sky = createObjectFromFiles(await loadBinaries({
    textures: `${path}/SKY.CMP`,
    objects: `${path}/SKY.PRM`
  }), { scale: 48 });

  const trackFiles = {
    textures: `${path}/LIBRARY.CMP`,
    textureIndex: `${path}/LIBRARY.TTF`,
    vertices: `${path}/TRACK.TRV`,
    faces: `${path}/TRACK.TRF`,
    sections: `${path}/TRACK.TRS`
  };
  if (loadTEXFile) {
    trackFiles.trackTexture = `${path}/TRACK.TEX`;
  }
  const track = createTrackFromFiles(await loadBinaries(trackFiles));

  return {
    scene: sky,
    sky,
    track: sky
  }
};

export default loadPath;
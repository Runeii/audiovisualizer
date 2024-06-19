import {
  Mesh,
} from 'three';
import { createObjectFromFiles } from './object';
import { createTrackFromFiles } from './track';

export const loadPath = async (path: string): Promise<Record<string, Mesh>> => {
  const scene = await createObjectFromFiles({
    textures: `${path}/SCENE.CMP`,
    objects: `${path}/SCENE.PRM`
  });

  const sky = await createObjectFromFiles({
    textures: `${path}/SKY.CMP`,
    objects: `${path}/SKY.PRM`
  });

  const track = await createTrackFromFiles({
    textures: `${path}/LIBRARY.CMP`,
    textureIndex: `${path}/LIBRARY.TTF`,
    vertices: `${path}/TRACK.TRV`,
    faces: `${path}/TRACK.TRF`,
    sections: `${path}/TRACK.TRS`
  });

  return {
    scene,
    sky,
    track
  }
};

export default loadPath;
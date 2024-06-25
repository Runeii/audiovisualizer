import createTrack from './deprecated/__toupgrade';
import { createObjectFromFiles } from './object';
import { createTrackFromFiles } from './track';


export const loadPath = async (path: string) => {
  const scene = await createObjectFromFiles({
    textures: `${path}/SCENE.CMP`,
    objects: `${path}/SCENE.PRM`
  });

  const sky = await createObjectFromFiles({
    textures: `${path}/SKY.CMP`,
    objects: `${path}/SKY.PRM`
  });

  const { spline, track } = await createTrack({
    textures: `${path}/LIBRARY.CMP`,
    textureIndex: `${path}/LIBRARY.TTF`,
    vertices: `${path}/TRACK.TRV`,
    faces: `${path}/TRACK.TRF`,
    sections: `${path}/TRACK.TRS`,
    trackTexture: `${path}/TRACK.TEX`
  });

  console.log(track.geometry, spline)
  const ships = await createObjectFromFiles({
    textures: 'WIPEOUT2/COMMON/TERRY.CMP',
    objects: 'WIPEOUT2/COMMON/TERRY.PRM'
  });

  return {
    scene,
    ships,
    sky,
    spline,
    track
  }
};

export default loadPath;
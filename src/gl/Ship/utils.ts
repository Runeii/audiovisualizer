import { Mesh, Raycaster, Vector3 } from "three";

const DOWN = new Vector3(0, -1, 0);

const raycaster = new Raycaster();

export const TILE_TYPES = {
  WALL: 0,
  TRACK: 1,
  SPEED_BOOST: 2,
  WEAPON: 3,
};

export const queryCurrentTile = (position: Vector3, track: Mesh) => {
  raycaster.set(position, DOWN);

  const intersects = raycaster.intersectObject(track, true);

  if (intersects.length === 0) {
    return TILE_TYPES.WALL;
  }

  const intersectedMaterial = intersects[0].object.material[intersects[0].face.materialIndex];

  if (intersectedMaterial.userData.isTrack) {
    return TILE_TYPES.TRACK;
  }

  if (intersectedMaterial.userData.isSpeedBoost) {
    return TILE_TYPES.SPEED_BOOST;
  }

  if (intersectedMaterial.userData.isWeapon) {
    return TILE_TYPES.WEAPON;
  }

  return TILE_TYPES.WALL;
}
import { Mesh, Raycaster, Vector3 } from "three";
import useStore from "../../store";
import { NUMBER_OF_PLAYERS } from "../constants";

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

export const getSideOfLine = (p1: Vector3, p2: Vector3, p3: Vector3) => {
  // Calculate the vectors
  const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
  const v2 = { x: p3.x - p1.x, y: p3.y - p1.y };

  // Compute the cross product of v1 and v2
  const crossProduct = v1.x * v2.y - v1.y * v2.x;

  // Determine the side
  if (crossProduct > 0) {
    return 'left';
  } else if (crossProduct < 0) {
    return 'right';
  } else {
    return 'on the line';
  }
}

export const convertLoudnessToSpeed = (shipIndex: number, isPlayer: boolean) => {
  if (isPlayer) {
    return 0.5;
  }
  const NUMBER_OF_AI = NUMBER_OF_PLAYERS - 1;
  const bandsPerPlayer = Math.round(24 / NUMBER_OF_AI);
  const startOfThisPlayerBands = (bandsPerPlayer * shipIndex);
  return useStore.getState().loudness.slice(startOfThisPlayerBands, startOfThisPlayerBands + bandsPerPlayer).reduce((acc, val) => (acc + val), 0) / (bandsPerPlayer / 2);
}

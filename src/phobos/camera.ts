import { TRACK_FACE_FLAGS, TRACK_SECTION_FLAGS, TrackSection } from "./structs";
import HermiteCurve3 from "./utils/HermiteCurve3";
import { Vector3 } from "three";

export const getSectionPosition = (section: TrackSection, faces: Face[], vertices: Vertex[]): Vector3 => {
  let verticescount = 0;
  const position = new Vector3();

  for (let i = section.firstFace; i < section.firstFace + section.numFaces; i++) {
    const face = faces[i];

    if (face.flags & TRACK_FACE_FLAGS.TRACK) {
      face.indices.forEach((index: number) => {
        const vertex = vertices[index];
        position.add(vertex);
        verticescount++;
      });
    }
  }
  position.divideScalar(verticescount);
  return position;
};

export const createCameraSpline = (buffer: ArrayBuffer, faces: Face[], vertices: Vertex[]) => {
  const sectionCount = buffer.byteLength / TrackSection.byteLength;
  const sections = TrackSection.readStructs(buffer, 0, sectionCount);

  const cameraPoints = [];
  const jumpIndexes = [];

  // First curve, always skip junctions
  let index = 0;
  do {
    const s = sections[index];
    if (s.flags & TRACK_SECTION_FLAGS.JUMP)
      jumpIndexes.push(cameraPoints.length);

    const pos = getSectionPosition(s, faces, vertices);
    cameraPoints.push(pos);

    index = s.next;
  } while (index > 0 && index < sections.length);

  // Second curve, take junctions when possible
  index = 0;
  do {
    const s = sections[index];
    if (s.flags & TRACK_SECTION_FLAGS.JUMP)
      jumpIndexes.push(cameraPoints.length);

    const pos = getSectionPosition(s, faces, vertices);
    cameraPoints.push(pos);

    // Get next section, look for junctions
    if (s.nextJunction != -1 && (sections[s.nextJunction].flags & TRACK_SECTION_FLAGS.JUNCTION_START)) {
      index = s.nextJunction;
    }
    else {
      index = s.next;
    }
  } while (index > 0 && index < sections.length);

  //extend path near jumps by adding tangent vector
  for (let i = 0; i < jumpIndexes.length; i++) {
    const index = jumpIndexes[i];

    const jumpPoint = cameraPoints[index];
    const tangent = jumpPoint.clone().sub(cameraPoints[(index + cameraPoints.length - 1) % cameraPoints.length]);
    const lengthNext = cameraPoints[(index + 1) % cameraPoints.length].clone().sub(jumpPoint).length();

    jumpPoint.add(tangent.setLength(lengthNext / 4));
  }

  const cameraSpline = new HermiteCurve3({
    arcLengthDivisions: 20000,
    points: cameraPoints.map(p => {
      // FIX: Flip Z and Y axis
      const point = p.clone()
      point.z = -point.z;
      point.y = -point.y;
      return point;
    }),
    tension: 0.5,
    bias: 0.0,
  });

  return cameraSpline;
};
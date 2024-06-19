import { PerspectiveCamera, Vector3 } from "three";
import { TRACK_FACE_FLAGS, TRACK_SECTION_FLAGS, TrackSection } from "./structs";
import HermiteCurve3 from "./utils/HermiteCurve3";

const updateSplineCamera = (splineCamera: PerspectiveCamera, cameraSpline: HermiteCurve3, ticks: number) => {
  const damping = 0.90;
  const time = ticks * 1000 / 60;
  const loopTime = cameraSpline.points.length * 100;
  const tmod = (time % loopTime) / loopTime;
  const cameraPos = cameraSpline.getPointAt(tmod).clone();
  splineCamera.position.multiplyScalar(damping)
    .add(cameraPos.clone().add({ x: 0, y: 600, z: 0 }).multiplyScalar(1 - damping));

  const tmodLookAt = ((time + 800) % loopTime) / loopTime;
  const lookAtPos = cameraSpline.getPointAt(tmodLookAt).clone();
  (splineCamera as any).currentLookAt = (splineCamera as any).currentLookAt.multiplyScalar(damping)
    .add(lookAtPos.clone().multiplyScalar(1 - damping));
  splineCamera.lookAt((splineCamera as any).currentLookAt);

  const cn = cameraPos.sub(splineCamera.position);
  const tn = lookAtPos.sub((splineCamera as any).currentLookAt);
  let roll = (Math.atan2(cn.z, cn.x) - Math.atan2(tn.z, tn.x));
  roll += (roll > Math.PI) ? -Math.PI * 2 : (roll < -Math.PI) ? Math.PI * 2 : 0;

  (splineCamera as any).roll = (splineCamera as any).roll * 0.95 + (roll) * 0.1;
  splineCamera.up = (new Vector3(0, 1, 0)).applyAxisAngle(
    splineCamera.position.clone().sub((splineCamera as any).currentLookAt).normalize(),
    (splineCamera as any).roll * 0.25
  );
};

const getSectionPosition = (section: any, faces: any[], vertices: Vector3[]): Vector3 => {
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

export const createCameraSpline = (buffer: ArrayBuffer, faces: any[], vertices: Vector3[]): HermiteCurve3 => {
  const sectionCount = buffer.byteLength / TrackSection.byteLength;
  const sections = TrackSection.readStructs(buffer, 0, sectionCount);

  const cameraPoints: Vector3[] = [];
  const jumpIndexes: number[] = [];

  let index = 0;
  do {
    const s = sections[index];
    if (s.flags & TRACK_SECTION_FLAGS.JUMP)
      jumpIndexes.push(cameraPoints.length);

    const pos = getSectionPosition(s, faces, vertices);
    cameraPoints.push(pos);

    index = s.next;
  } while (index > 0 && index < sections.length);

  index = 0;
  do {
    const s = sections[index];
    if (s.flags & TRACK_SECTION_FLAGS.JUMP)
      jumpIndexes.push(cameraPoints.length);

    const pos = getSectionPosition(s, faces, vertices);
    cameraPoints.push(pos);

    if (s.nextJunction !== -1 && (sections[s.nextJunction].flags & TRACK_SECTION_FLAGS.JUNCTION_START)) {
      index = s.nextJunction;
    } else {
      index = s.next;
    }
  } while (index > 0 && index < sections.length);

  jumpIndexes.forEach(index => {
    const jumpPoint = cameraPoints[index];
    const tangent = jumpPoint.clone().sub(cameraPoints[(index + cameraPoints.length - 1) % cameraPoints.length]);
    const lengthNext = cameraPoints[(index + 1) % cameraPoints.length].clone().sub(jumpPoint).length();

    jumpPoint.add(tangent.setLength(lengthNext / 4));
  });

  const cameraSpline = new HermiteCurve3({
    arcLengthDivisions: 20000,
    points: cameraPoints,
    tension: 0.5,
    bias: 0.0
  });

  return cameraSpline;
};

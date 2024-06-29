import { forwardRef, useMemo, useRef } from "react";
import HermiteCurve3 from "../../../phobos/utils/HermiteCurve3";
import { Color, Mesh, Raycaster, Vector3 } from "three";
import { SHIP_HOVER_HEIGHT } from "../../constants";

type SplineProps = {
  spline?: HermiteCurve3;
  track: Mesh;
  x?: number;
}

const IS_VISIBLE = false;
const Spline = forwardRef<HermiteCurve3, SplineProps>(({ spline, track, x = 0 }, ref) => {
  const hasValidSpline = spline && spline.points.length > 0;

  const splineRef = useRef<Mesh>(null);

  const thisSpline = useMemo(() => {
    if (!hasValidSpline) {
      return;
    }

  
    const newSpline = spline?.clone()
    newSpline.points = spline.points.map((point, index) => {
      const tangent = spline.getTangentAt(index / spline.points.length).normalize();
      const normal = new Vector3(-tangent.z, 0, tangent.x).normalize();
      const adjustedPoint = new Vector3().copy(point).addScaledVector(normal, x);
    
      if (!track) {
        return adjustedPoint;
      }
    
      const raycaster = new Raycaster();
      const DOWN = new Vector3(0, -1, 0);

      // Move sky high to ensure we're raycasting from above the track
      adjustedPoint.y += 1000;

      raycaster.set(adjustedPoint, DOWN);
    
      const intersects = raycaster.intersectObject(track, true);
      if (intersects.length === 0) {
        adjustedPoint.y = point.y;
        return adjustedPoint;
      }

      adjustedPoint.y = intersects[0].point.y + SHIP_HOVER_HEIGHT;
      return adjustedPoint;  
    });
    newSpline.tension = 0.1;
  
    if (ref && typeof ref === 'object') {
      ref.current = newSpline;
    }

    return newSpline;
  }, [hasValidSpline, ref, spline, track, x]);

  const color = useMemo(() => new Color(Math.random(), Math.random(), Math.random()), []);
  if (!hasValidSpline || !thisSpline) {
    return null;
  }

  return (
    <mesh ref={splineRef} visible={IS_VISIBLE}>
      <tubeGeometry args={[thisSpline, thisSpline.points.length, 50, 5, true]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
});

export default Spline;
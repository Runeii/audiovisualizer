import { RefObject, forwardRef, useMemo } from "react";
import HermiteCurve3 from "../../phobos/utils/HermiteCurve3";
import { Color, Mesh, Raycaster, Vector3 } from "three";
import { SHIP_HOVER_HEIGHT } from "../constants";

type SplineProps = {
  spline?: HermiteCurve3;
  trackRef: RefObject<Mesh>;
  x?: number;
}

const Spline = forwardRef<HermiteCurve3, SplineProps>(({ spline, trackRef, x = 0 }, ref) => {
  const hasValidSpline = spline && spline.points.length > 0;

  const thisSpline = useMemo(() => {
    if (!hasValidSpline) {
      return;
    }

  
    const newSpline = spline?.clone()
    newSpline.points = spline.points.map((point) => {
      const adjustedPoint = new Vector3().copy(point).setX(point.x + x)
      if (!trackRef.current) {
        return adjustedPoint;
      }
    
      const raycaster = new Raycaster();
      const DOWN = new Vector3(0, -1, 0);

      // Move sky high to ensure we're raycasting from above the track
      adjustedPoint.y += 1000;

      raycaster.set(adjustedPoint, DOWN);
      const intersects = raycaster.intersectObject(trackRef.current, true);
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
  }, [hasValidSpline, ref, spline, x]);

  const color = useMemo(() => new Color(Math.random(), Math.random(), Math.random()), []);
  if (!hasValidSpline || !thisSpline) {
    return null;
  }

  return (
    <mesh visible={true}>
      <tubeGeometry args={[thisSpline, thisSpline.points.length, 50, 5, true]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
});

export default Spline;
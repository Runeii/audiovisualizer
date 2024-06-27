import { forwardRef, useMemo } from "react";
import HermiteCurve3 from "../../phobos/utils/HermiteCurve3";
import { Color, Vector3 } from "three";

type SplineProps = {
  spline?: HermiteCurve3;
  x?: number;
}

const Spline = forwardRef<HermiteCurve3, SplineProps>(({spline, x = 0}, ref) => {
  const hasValidSpline = spline && spline.points.length > 0;

  const thisSpline = useMemo(() => {
    if (!hasValidSpline) {
      return;
    }
    
    const newSpline = spline?.clone()
    newSpline.points = spline.points.map((point) => new Vector3().copy(point).setX(point.x + x));
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
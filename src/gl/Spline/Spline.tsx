import { forwardRef, useMemo } from "react";
import HermiteCurve3 from "../../phobos/utils/HermiteCurve3";
import { Vector3 } from "three";

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

    if (ref && typeof ref === 'object') {
      ref.current = newSpline;
    }

    return newSpline;
  }, [hasValidSpline, ref, spline, x]);

  if (!hasValidSpline || !thisSpline) {
    return null;
  }

  return (
    <mesh visible={false}>
      <tubeGeometry args={[thisSpline, thisSpline.points.length, 50, 5, true]} />
      <meshBasicMaterial color={0xff00ff} />
    </mesh>
  );
});

export default Spline;
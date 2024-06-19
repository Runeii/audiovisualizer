import { Curve, Vector3 } from 'three';

const hermiteInterpolate = (
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number,
  tension: number,
  bias: number
): number => {
  const m0 = ((p1 - p0) * (1 + bias) * (1 - tension)) / 2 + ((p2 - p1) * (1 - bias) * (1 - tension)) / 2;
  const m1 = ((p2 - p1) * (1 + bias) * (1 - tension)) / 2 + ((p3 - p2) * (1 - bias) * (1 - tension)) / 2;

  const t2 = t * t;
  const t3 = t2 * t;

  const h0 = 2 * t3 - 3 * t2 + 1;
  const h1 = t3 - 2 * t2 + t;
  const h2 = t3 - t2;
  const h3 = -2 * t3 + 3 * t2;

  return h0 * p1 + h1 * m0 + h2 * m1 + h3 * p2;
};

interface HermiteCurve3Props {
  points?: Vector3[];
  tension?: number;
  bias?: number;
  arcLengthDivisions?: number;
}

class HermiteCurve3 extends Curve<Vector3> {
  points: Vector3[];
  tension: number;
  bias: number;

  constructor({ points = [], tension = 0.0, bias = 0.0, arcLengthDivisions = 200 }: HermiteCurve3Props = {}) {
    super();
    this.points = points;
    this.tension = tension;
    this.bias = bias;
    (this as any).__arcLengthDivisions = arcLengthDivisions;
  }

  getPoint(t: number): Vector3 {
    const points = this.points;
    const point = (points.length - 1) * t;

    const intPoint = Math.floor(point);
    const weight = point - intPoint;

    const point0 = points[intPoint === 0 ? intPoint : intPoint - 1];
    const point1 = points[intPoint];
    const point2 = points[intPoint > points.length - 2 ? points.length - 1 : intPoint + 1];
    const point3 = points[intPoint > points.length - 3 ? points.length - 1 : intPoint + 2];

    const vector = new Vector3();

    vector.x = hermiteInterpolate(point0.x, point1.x, point2.x, point3.x, weight, this.tension, this.bias);
    vector.y = hermiteInterpolate(point0.y, point1.y, point2.y, point3.y, weight, this.tension, this.bias);
    vector.z = hermiteInterpolate(point0.z, point1.z, point2.z, point3.z, weight, this.tension, this.bias);

    return vector;
  }
}

export default HermiteCurve3;

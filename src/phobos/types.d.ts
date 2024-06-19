type WipeoutObject = {
  header: {
    name: string,
    vertexCount: number,
    polygonCount: number,
    position: Vector3
  },
  vertices: Vector3[],
  polygons: Polygon[],
  byteLength: number
}

type PolygonHeader = {
  type: number;
  subtype: number;
};

type UV = {
  u: number;
  v: number;
};

type Polygon = {
  header: PolygonHeader;
  unknown?: number[]; // For UNKNOWN_00 and others with unknown fields
  indices?: number[]; // For indices in various polygons
  texture?: number; // For textured polygons
  uv?: UV[]; // For textured polygons with UV coordinates
  unknown2?: number[]; // For additional unknown fields in textured polygons
  color?: number; // For polygons with face color
  colors?: number[]; // For polygons with vertex colors
  index?: number; // For SPRITE_TOP_ANCHOR
  width?: number; // For SPRITE_TOP_ANCHOR
  height?: number; // For SPRITE_TOP_ANCHOR
};

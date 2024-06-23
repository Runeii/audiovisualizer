type Files = Record<string, ArrayBuffer>;

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

type BufferGeometryData = {
  faceVertexUvs: number[],
  indices: number[],
  colors: number[],
  positions: number[],
  normals?: number[]
  sprites?: Mesh[]
}

type FixedLengthArray<T, L extends number> = {
  0: T;
  length: L;
} & ReadonlyArray<T>;

// Wipeout data struct types
type Face = {
  color: number;
  colors: number[];
  flags: number;
  indices: FixedLengthArray<number, 4>;
  normalx: number;
  normaly: number;
  normalz: number;
  tile: number;
};

type TextureIndex = {
  near: FixedLengthArray<number, 16>;
  med: FixedLengthArray<number, 4>;
  far: FixedLengthArray<number, 1>;
}

type WipeoutVector3 = {
  x: number;
  y: number;
  z: number;
};

type UV = {
  u: number;
  v: number;
};

type Vertex = {
  x: number;
  y: number;
  z: number;
};

type TrackTexture = {
  tile: number;
  flags: number;
}

type TrackTextureIndex = {
  near: FixedLengthArray<number, 16>;
  med: FixedLengthArray<number, 4>;
  far: FixedLengthArray<number, 1>;
};

type ObjectHeader = {
  name: string;
  vertexCount: number;
  polygonCount: number;
  index: number;
  origin: WipeoutVector3;
  position: WipeoutVector3;
};

type ImageFileHeader = {
  magic: number;
  type: number;
  headerLength: number;
  paletteX: number;
  paletteY: number;
  paletteColors: number;
  palettes: number;
};

type ImagePixelHeader = {
  skipX: number;
  skipY: number;
  width: number;
  height: number;
};

type TrackSection = {
  nextJunction: number;
  previous: number;
  next: number;
  x: number;
  y: number;
  z: number;
  firstFace: number;
  numFaces: number;
  flags: number;
}

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

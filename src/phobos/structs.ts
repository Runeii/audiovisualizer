import Struct from './utils/struct';

// ----------------------------------------------------------------------------
// Wipeout Data Types

// .TRV Files ---------------------------------------------

export const TrackVertex = Struct.create<Vertex>(
  Struct.int32('x'),
  Struct.int32('y'),
  Struct.int32('z'),
  Struct.int32('padding')
);


// .TRF Files ---------------------------------------------

export const TrackFace = Struct.create<Face>(
  Struct.array('indices', Struct.uint16(), 4),
  Struct.int16('normalx'),
  Struct.int16('normaly'),
  Struct.int16('normalz'),
  Struct.uint8('tile'),
  Struct.uint8('flags'),
  Struct.uint32('color')
);

export const TRACK_FACE_FLAGS = {
  WALL: 0,
  TRACK: 1,
  WEAPON: 2,
  FLIP: 4,
  WEAPON_2: 8,
  UNKNOWN: 16,
  BOOST: 32
};


// .TTF Files ---------------------------------------------

export const TrackTextureIndex = Struct.create<TrackTextureIndex>(
  Struct.array('near', Struct.uint16(), 16), // 4x4 tiles
  Struct.array('med', Struct.uint16(), 4), // 2x2 tiles
  Struct.array('far', Struct.uint16(), 1) // 1 tile
);


// .TRS Files ---------------------------------------------

export const TrackSection = Struct.create<TrackSection>(
  Struct.int32('nextJunction'),
  Struct.int32('previous'),
  Struct.int32('next'),
  Struct.int32('x'),
  Struct.int32('y'),
  Struct.int32('z'),
  Struct.skip(116),
  Struct.uint32('firstFace'),
  Struct.uint16('numFaces'),
  Struct.skip(4),
  Struct.uint16('flags'),
  Struct.skip(4)
);


// .TEX Files ---------------------------------------------

export const TrackTexture = Struct.create<TrackTexture>(
  Struct.uint8('tile'),
  Struct.uint8('flags')
);


export const TRACK_SECTION_FLAGS = {
  JUMP: 1,
  JUNCTION_END: 8,
  JUNCTION_START: 16,
  JUNCTION: 32
};


// .PRM Files ---------------------------------------------

export const WipeoutVector3 = Struct.create<WipeoutVector3>(
  Struct.int32('x'),
  Struct.int32('y'),
  Struct.int32('z')
);

export const Vertex = Struct.create<Vertex>(
  Struct.int16('x'),
  Struct.int16('y'),
  Struct.int16('z'),
  Struct.int16('padding')
);

export const UV = Struct.create<UV>(
  Struct.uint8('u'),
  Struct.uint8('v')
);

export const ObjectHeader = Struct.create<ObjectHeader>(
  Struct.string('name', 15),
  Struct.skip(1),
  Struct.uint16('vertexCount'),
  Struct.skip(14),
  Struct.uint16('polygonCount'),
  Struct.skip(20),
  Struct.uint16('index1'),
  Struct.skip(28),
  Struct.struct('origin', WipeoutVector3),
  Struct.skip(20),
  Struct.struct('position', WipeoutVector3),
  Struct.skip(16)
);

export const POLYGON_TYPE = {
  UNKNOWN_00: 0x00,
  FLAT_TRIS_FACE_COLOR: 0x01,
  TEXTURED_TRIS_FACE_COLOR: 0x02,
  FLAT_QUAD_FACE_COLOR: 0x03,
  TEXTURED_QUAD_FACE_COLOR: 0x04,
  FLAT_TRIS_VERTEX_COLOR: 0x05,
  TEXTURED_TRIS_VERTEX_COLOR: 0x06,
  FLAT_QUAD_VERTEX_COLOR: 0x07,
  TEXTURED_QUAD_VERTEX_COLOR: 0x08,
  SPRITE_TOP_ANCHOR: 0x0A,
  SPRITE_BOTTOM_ANCHOR: 0x0B
};

export const PolygonHeader = Struct.create<PolygonHeader>(
  Struct.uint16('type'),
  Struct.uint16('subtype')
);

// TODO: We can be more explicit about the structure of each polygon type
export const Polygon: Record<string, Struct<Polygon>> = {}
Polygon[POLYGON_TYPE.UNKNOWN_00] = Struct.create(
  Struct.struct('header', PolygonHeader),
  Struct.array('unknown', Struct.uint16(), 7)
);

Polygon[POLYGON_TYPE.FLAT_TRIS_FACE_COLOR] = Struct.create(
  Struct.struct('header', PolygonHeader),
  Struct.array('indices', Struct.uint16(), 3),
  Struct.uint16('unknown'),
  Struct.uint32('color')
);

Polygon[POLYGON_TYPE.TEXTURED_TRIS_FACE_COLOR] = Struct.create(
  Struct.struct('header', PolygonHeader),
  Struct.array('indices', Struct.uint16(), 3),
  Struct.uint16('texture'),
  Struct.array('unknown', Struct.uint16(), 2), // 4
  Struct.array('uv', UV, 3), // 6
  Struct.array('unknown2', Struct.uint16(), 1),
  Struct.uint32('color')
);

Polygon[POLYGON_TYPE.FLAT_QUAD_FACE_COLOR] = Struct.create(
  Struct.struct('header', PolygonHeader),
  Struct.array('indices', Struct.uint16(), 4),
  Struct.uint32('color')
);

Polygon[POLYGON_TYPE.TEXTURED_QUAD_FACE_COLOR] = Struct.create(
  Struct.struct('header', PolygonHeader),
  Struct.array('indices', Struct.uint16(), 4),
  Struct.uint16('texture'),
  Struct.array('unknown', Struct.uint16(), 2),
  Struct.array('uv', UV, 4),
  Struct.array('unknown2', Struct.uint16(), 1),
  Struct.uint32('color')
);

Polygon[POLYGON_TYPE.FLAT_TRIS_VERTEX_COLOR] = Struct.create(
  Struct.struct('header', PolygonHeader),
  Struct.array('indices', Struct.uint16(), 3),
  Struct.uint16('unknown'),
  Struct.array('colors', Struct.uint32(), 3)
);

Polygon[POLYGON_TYPE.TEXTURED_TRIS_VERTEX_COLOR] = Struct.create(
  Struct.struct('header', PolygonHeader),
  Struct.array('indices', Struct.uint16(), 3),
  Struct.uint16('texture'),
  Struct.array('unknown', Struct.uint16(), 2), // 4
  Struct.array('uv', UV, 3), // 6
  Struct.array('unknown2', Struct.uint16(), 1),
  Struct.array('colors', Struct.uint32(), 3) // ?
);

Polygon[POLYGON_TYPE.FLAT_QUAD_VERTEX_COLOR] = Struct.create(
  Struct.struct('header', PolygonHeader),
  Struct.array('indices', Struct.uint16(), 4),
  Struct.array('colors', Struct.uint32(), 4)
);

Polygon[POLYGON_TYPE.TEXTURED_QUAD_VERTEX_COLOR] = Struct.create(
  Struct.struct('header', PolygonHeader),
  Struct.array('indices', Struct.uint16(), 4),
  Struct.uint16('texture'),
  Struct.array('unknown', Struct.uint16(), 2),
  Struct.array('uv', UV, 4),
  Struct.array('unknown2', Struct.uint8(), 2),
  Struct.array('colors', Struct.uint32(), 4)
);

Polygon[POLYGON_TYPE.SPRITE_TOP_ANCHOR] = Struct.create(
  Struct.struct('header', PolygonHeader),
  Struct.uint16('index'),
  Struct.uint16('width'),
  Struct.uint16('height'),
  Struct.uint16('texture'),
  Struct.uint32('color')
);

Polygon[POLYGON_TYPE.SPRITE_BOTTOM_ANCHOR] =
  Polygon[POLYGON_TYPE.SPRITE_TOP_ANCHOR];



// .TIM Files (Little Endian!) -------------------------------

export const IMAGE_TYPE = {
  PALETTED_4_BPP: 0x08,
  PALETTED_8_BPP: 0x09,
  TRUE_COLOR_16_BPP: 0x02
};

export const ImageFileHeader = Struct.create<ImageFileHeader>(
  Struct.uint32('magic', Struct.LITTLE_ENDIAN),
  Struct.uint32('type', Struct.LITTLE_ENDIAN),
  Struct.uint32('headerLength', Struct.LITTLE_ENDIAN),
  Struct.uint16('paletteX', Struct.LITTLE_ENDIAN),
  Struct.uint16('paletteY', Struct.LITTLE_ENDIAN),
  Struct.uint16('paletteColors', Struct.LITTLE_ENDIAN),
  Struct.uint16('palettes', Struct.LITTLE_ENDIAN)
);

export const ImagePixelHeader = Struct.create<ImagePixelHeader>(
  Struct.uint16('skipX', Struct.LITTLE_ENDIAN),
  Struct.uint16('skipY', Struct.LITTLE_ENDIAN),
  Struct.uint16('width', Struct.LITTLE_ENDIAN),
  Struct.uint16('height', Struct.LITTLE_ENDIAN)
);

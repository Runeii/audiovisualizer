/* eslint-disable @typescript-eslint/no-explicit-any */
"use strict";

import {
  WebGLRenderer,
  PerspectiveCamera,
  Vector3,
  Scene,
  Color,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  NearestFilter,
  Texture,
  Vector2,
  DoubleSide,
  FrontSide,
  BackSide,
  Material,
  Float32BufferAttribute,
  BufferGeometry,
  PlaneGeometry,
  SphereGeometry,
  BufferAttribute,
  Side,
  CanvasTexture,
  RepeatWrapping,
} from 'three';
import Struct from './struct';
import { Geometry, OrbitControls } from 'three-stdlib';
import HermiteCurve3 from './hermiteCurve3';
// ----------------------------------------------------------------------------
// Wipeout Data Types

// .TRV Files ---------------------------------------------

const TrackVertex = Struct.create(
  Struct.int32('x'),
  Struct.int32('y'),
  Struct.int32('z'),
  Struct.int32('padding')
);


// .TRF Files ---------------------------------------------

const TrackFace = Struct.create(
  Struct.array('indices', Struct.uint16(), 4),
  Struct.int16('normalx'),
  Struct.int16('normaly'),
  Struct.int16('normalz'),
  Struct.uint8('tile'),
  Struct.uint8('flags'),
  Struct.uint32('color')
);

const TRACK_FACE_FLAGS = {
  WALL: 0,
  TRACK: 1,
  WEAPON: 2,
  FLIP: 4,
  WEAPON_2: 8,
  UNKNOWN: 16,
  BOOST: 32
};


// .TTF Files ---------------------------------------------

const TrackTextureIndex = Struct.create(
  Struct.array('near', Struct.uint16(), 16), // 4x4 tiles
  Struct.array('med', Struct.uint16(), 4), // 2x2 tiles
  Struct.array('far', Struct.uint16(), 1) // 1 tile
);


// .TRS Files ---------------------------------------------

const TrackSection = Struct.create(
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

const TrackTexture = Struct.create(
  Struct.uint8('tile'),
  Struct.uint8('flags')
);


const TRACK_SECTION_FLAGS = {
  JUMP: 1,
  JUNCTION_END: 8,
  JUNCTION_START: 16,
  JUNCTION: 32
};


// .PRM Files ---------------------------------------------

const WipeoutVector3 = Struct.create(
  Struct.int32('x'),
  Struct.int32('y'),
  Struct.int32('z')
);

const Vertex = Struct.create(
  Struct.int16('x'),
  Struct.int16('y'),
  Struct.int16('z'),
  Struct.int16('padding')
);

const UV = Struct.create(
  Struct.uint8('u'),
  Struct.uint8('v')
);

const ObjectHeader = Struct.create(
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

const POLYGON_TYPE = {
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

const PolygonHeader = Struct.create(
  Struct.uint16('type'),
  Struct.uint16('subtype')
);

const Polygon: Record<string, Struct> = {}
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

const IMAGE_TYPE = {
  PALETTED_4_BPP: 0x08,
  PALETTED_8_BPP: 0x09,
  TRUE_COLOR_16_BPP: 0x02
};

const ImageFileHeader = Struct.create(
  Struct.uint32('magic', Struct.LITTLE_ENDIAN),
  Struct.uint32('type', Struct.LITTLE_ENDIAN),
  Struct.uint32('headerLength', Struct.LITTLE_ENDIAN),
  Struct.uint16('paletteX', Struct.LITTLE_ENDIAN),
  Struct.uint16('paletteY', Struct.LITTLE_ENDIAN),
  Struct.uint16('paletteColors', Struct.LITTLE_ENDIAN),
  Struct.uint16('palettes', Struct.LITTLE_ENDIAN)
);

const ImagePixelHeader = Struct.create(
  Struct.uint16('skipX', Struct.LITTLE_ENDIAN),
  Struct.uint16('skipY', Struct.LITTLE_ENDIAN),
  Struct.uint16('width', Struct.LITTLE_ENDIAN),
  Struct.uint16('height', Struct.LITTLE_ENDIAN)
);

const createRenderer = (width: number, height: number): WebGLRenderer => {
  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000);
  return renderer;
};

const createCameras = (width: number, height: number) => {
  const camera = new PerspectiveCamera(45, width / height, 64, 2048576);
  camera.position.set(0, 10000, 50000);
  camera.rotation.order = 'YZX';

  const splineCamera = new PerspectiveCamera(84, window.innerWidth / window.innerHeight, 64, 2048576);
  (splineCamera as any).currentLookAt = new Vector3(0, 0, 0);
  (splineCamera as any).roll = 0;
  splineCamera.rotation.order = 'YZX';

  return { camera, splineCamera };
};

const createControls = (camera: PerspectiveCamera, renderer: WebGLRenderer): OrbitControls => {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.dampingFactor = 0.2;
  controls.zoomSpeed = 2;
  return controls;
};

const createScene = (): Scene => new Scene();

const clearScene = (scene: Scene, cameras: { camera: PerspectiveCamera; splineCamera: PerspectiveCamera }, controls: OrbitControls) => {
  scene.clear();
  const sprites: Object3D[] = [];
  const { camera, splineCamera } = cameras;
  const sceneMaterial: any = {};
  const trackMaterial: any = null;
  const weaponTileMaterial: any = null;
  const startTime = Date.now();
  const ticks = 0;

  return { sprites, sceneMaterial, trackMaterial, weaponTileMaterial, startTime, ticks, controls, camera, splineCamera };
};

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

const rotateSpritesToCamera = (sprites: Object3D[], camera: PerspectiveCamera) => {
  sprites.forEach(sprite => {
    sprite.rotation.y = camera.rotation.y;
  });
};

const updateWeaponMaterial = (weaponTileMaterial: MeshBasicMaterial, time: number) => {
  const colors = [0x800080, 0x0000ff, 0x00ffff, 0xffff00, 0xff8000];
  const t = time / 1050;
  const index = Math.floor(t);
  const alpha = t - index;

  const colorA = new Color(colors[index % colors.length]);
  const colorB = new Color(colors[(index + 1) % colors.length]);
  weaponTileMaterial.color = colorA.lerp(colorB, alpha).multiplyScalar(1.5);
};

const resizeRenderer = (camera: PerspectiveCamera, splineCamera: PerspectiveCamera, renderer: WebGLRenderer) => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  splineCamera.aspect = width / height;
  splineCamera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
};

const animate = (
  renderer: WebGLRenderer,
  scene: Scene,
  cameras: { camera: PerspectiveCamera; splineCamera: PerspectiveCamera },
  controls: OrbitControls,
  cameraSpline: HermiteCurve3 | null,
  sprites: Object3D[],
  weaponTileMaterial: MeshBasicMaterial | null,
  activeCameraMode: string,
  startTime: number,
  ticks: number
) => {
  const renderFrame = () => {
    requestAnimationFrame(renderFrame);
    const time = Date.now();

    if (weaponTileMaterial) {
      updateWeaponMaterial(weaponTileMaterial, time);
    }

    if (activeCameraMode === 'fly' && cameraSpline) {
      const elapsedTime = time - startTime;
      const elapsedTicks = elapsedTime / 1000 * 60;

      while (ticks < elapsedTicks) {
        updateSplineCamera(cameras.splineCamera, cameraSpline, ticks);
        ticks++;
      }

      rotateSpritesToCamera(sprites, cameras.splineCamera);
      renderer.render(scene, cameras.splineCamera);
    } else {
      controls.update();
      rotateSpritesToCamera(sprites, cameras.camera);
      renderer.render(scene, cameras.camera);
    }
  };

  renderFrame();
};

const int32ToColor = (v: number): Color => new Color(((v >> 24) & 0xff) / 0x80, ((v >> 16) & 0xff) / 0x80, ((v >> 8) & 0xff) / 0x80);

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

const createBufferGeometryDataObject = (bufferGeometry) => {
  const dataObject = {
    vertices: [],
    faces: [],
    faceVertexUvs: [],
    colors: [],
    indices: [],
    uvs: []
  };

  // Extract vertices
  const positionAttribute = bufferGeometry.getAttribute('position');
  for (let i = 0; i < positionAttribute.count; i++) {
    dataObject.vertices.push([positionAttribute.getX(i), positionAttribute.getY(i), positionAttribute.getZ(i)]);
  }

  // Extract indices
  const index = bufferGeometry.getIndex();
  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      dataObject.faces.push([index.getX(i), index.getX(i + 1), index.getX(i + 2)]);
      dataObject.indices.push(index.getX(i), index.getX(i + 1), index.getX(i + 2));
    }
  }

  // Extract UVs
  const uvAttribute = bufferGeometry.getAttribute('uv');
  if (uvAttribute) {
    for (let i = 0; i < uvAttribute.count; i++) {
      dataObject.uvs.push([uvAttribute.getX(i), uvAttribute.getY(i)]);
    }

    // Group UVs into faces
    for (let i = 0; i < uvAttribute.count; i += 3) {
      dataObject.faceVertexUvs.push([
        [uvAttribute.getX(i), uvAttribute.getY(i)],
        [uvAttribute.getX(i + 1), uvAttribute.getY(i + 1)],
        [uvAttribute.getX(i + 2), uvAttribute.getY(i + 2)]
      ]);
    }
  }

  // Extract colors
  const colorAttribute = bufferGeometry.getAttribute('color');
  if (colorAttribute) {
    for (let i = 0; i < colorAttribute.count; i++) {
      dataObject.colors.push([colorAttribute.getX(i), colorAttribute.getY(i), colorAttribute.getZ(i)]);
    }
  }

  return dataObject;
};


const createModelFromObject = (
  object: WipeoutObject,
  sceneMaterial: any
): Mesh => {
  const geometry = new BufferGeometry();

  // Set positions
  const positions = object.vertices.map((vertex: any) => [vertex.x, -vertex.y, -vertex.z]).flat();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

  const nullVector = new Vector2(0, 0);
  const whiteColor = new Color(1, 1, 1);

  const initialValue: {
    faceVertexUvs: number[],
    indices: number[],
    colors: number[],
  } = {
    faceVertexUvs: [],
    indices: [],
    colors: [],
  }

  const result = object.polygons.reduce((previousResult, polygon: Polygon) => {
    if (polygon.header.type === POLYGON_TYPE.SPRITE_BOTTOM_ANCHOR || polygon.header.type === POLYGON_TYPE.SPRITE_TOP_ANCHOR) {
      console.warn('Found a sprite, not currently supported!!');
      return previousResult;
    }

    if (!polygon.indices) {
      return previousResult;
    }

    // UVs
    let uvs = [nullVector, nullVector, nullVector, nullVector];
    if (polygon.texture !== undefined) {
      const img = sceneMaterial[polygon.texture].map.image;
      uvs = polygon.uv.map(({ u, v }) => new Vector2(u / img.width, 1 - v / img.height));
    }
    const standardUvs = [uvs[2], uvs[1], uvs[0]];
    const polygonUvs = polygon.indices.length === 4
      ? [...standardUvs, uvs[2], uvs[3], uvs[1]]
      : standardUvs;

    // Indices
    const standardIndices = [polygon.indices[2], polygon.indices[1], polygon.indices[0]];
    const polygonIndices = polygon.indices.length === 4
      ? [...standardIndices, polygon.indices[2], polygon.indices[3], polygon.indices[1]]
      : standardIndices;

    // Colors
    const constructedColors = [whiteColor, whiteColor, whiteColor, whiteColor];
    if (polygon.color || polygon.colors) {
      for (let j = 0; j < polygon.indices.length; j++) {
        constructedColors[j] = int32ToColor(polygon.color || polygon.colors[j]);
      }
    }
    const standardColors = [constructedColors[2], constructedColors[1], constructedColors[0]];
    const polygonColors = polygon.indices.length === 4
      ? [...standardColors, constructedColors[2], constructedColors[3], constructedColors[1]]
      : standardColors;

    return {
      faceVertexUvs: [
        ...previousResult.faceVertexUvs,
        ...polygonUvs.flatMap(uv => [uv.x, uv.y])
      ],
      indices: [
        ...previousResult.indices,
        ...polygonIndices
      ],
      colors: [
        ...previousResult.colors,
        ...polygonColors.flatMap(color => [color.r, color.g, color.b])],
    };
  }, initialValue);

  const { faceVertexUvs, indices, colors } = result;

  geometry.setAttribute('uv', new Float32BufferAttribute(faceVertexUvs, 2));
  geometry.setIndex(new BufferAttribute(new Uint16Array(indices), 1));
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
  geometry.addGroup(0, indices.length, 0);
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));

  // Compute Normals
  geometry.computeVertexNormals();

  const mesh = new Mesh(geometry, sceneMaterial);
  mesh.position.set(object.header.position.x, -object.header.position.y, -object.header.position.z);

  return mesh;
}

const createMeshFaceMaterial = (images: HTMLCanvasElement[], vertexColors: boolean, side: Side): Material[] => {
  const materials: MeshBasicMaterial[] = [];

  const baseMaterial = new MeshBasicMaterial({ wireframe: false });
  baseMaterial.vertexColors = vertexColors;

  images.forEach((image) => {
    const texture = new CanvasTexture(image);
    texture.minFilter = NearestFilter;
    texture.magFilter = NearestFilter;
    texture.needsUpdate = true;

    const material = new MeshBasicMaterial({
      map: texture,
      vertexColors,
      side,
      alphaTest: 0.5,
    });

    material.needsUpdate = true;
    materials.push(material);
  });

  materials.push(baseMaterial) - 1;

  return materials;
};

const unpackImages = (buffer: ArrayBuffer): ArrayBuffer[] => {
  const data = new DataView(buffer);

  const numberOfFiles = data.getUint32(0, true);
  const packedDataOffset = (numberOfFiles + 1) * 4;

  let unpackedLength = 0;
  for (let i = 0; i < numberOfFiles; i++) {
    unpackedLength += data.getUint32((i + 1) * 4, true);
  }

  const src = new Uint8Array(buffer, packedDataOffset);
  const dst = new Uint8Array(unpackedLength);
  const wnd = new Uint8Array(0x2000);

  let srcPos = 0,
    dstPos = 0,
    wndPos = 1,
    curBit = 0,
    curByte = 0,
    bitMask = 0x80;

  const readBitfield = (size: number): number => {
    let value = 0;
    while (size > 0) {
      if (bitMask === 0x80) {
        curByte = src[srcPos++];
      }

      if (curByte & bitMask) {
        value |= size;
      }

      size >>= 1;

      bitMask >>= 1;
      if (bitMask === 0) {
        bitMask = 0x80;
      }
    }

    return value;
  };

  while (true) {
    if (srcPos > src.byteLength || dstPos > unpackedLength) {
      break;
    }

    if (bitMask === 0x80) {
      curByte = src[srcPos++];
    }

    curBit = (curByte & bitMask);

    bitMask >>= 1;
    if (bitMask === 0) {
      bitMask = 0x80;
    }

    if (curBit) {
      wnd[wndPos & 0x1fff] = dst[dstPos] = readBitfield(0x80);
      wndPos++;
      dstPos++;
    } else {
      const position = readBitfield(0x1000);
      if (position === 0) {
        break;
      }

      const length = readBitfield(0x08) + 2;
      for (let i = 0; i <= length; i++) {
        wnd[wndPos & 0x1fff] = dst[dstPos] = wnd[(i + position) & 0x1fff];
        wndPos++;
        dstPos++;
      }
    }
  }

  const files: ArrayBuffer[] = [];
  let fileOffset = 0;
  for (let i = 0; i < numberOfFiles; i++) {
    const fileLength = data.getUint32((i + 1) * 4, true);
    files.push(dst.buffer.slice(fileOffset, fileOffset + fileLength));
    fileOffset += fileLength;
  }

  return files;
};

const readImage = (buffer: ArrayBuffer): HTMLCanvasElement => {
  const data = new DataView(buffer);
  const file = ImageFileHeader.readStructs(buffer, 0, 1)[0];
  let offset = ImageFileHeader.byteLength;

  let palette: Uint16Array | null = null;
  if (
    file.type === IMAGE_TYPE.PALETTED_4_BPP ||
    file.type === IMAGE_TYPE.PALETTED_8_BPP
  ) {
    palette = new Uint16Array(buffer, offset, file.paletteColors);
    offset += file.paletteColors * 2;
  }
  offset += 4;

  let pixelsPerShort = 1;
  if (file.type === IMAGE_TYPE.PALETTED_8_BPP) {
    pixelsPerShort = 2;
  } else if (file.type === IMAGE_TYPE.PALETTED_4_BPP) {
    pixelsPerShort = 4;
  }

  const dim = ImagePixelHeader.readStructs(buffer, offset, 1)[0];
  offset += ImagePixelHeader.byteLength;

  const width = dim.width * pixelsPerShort,
    height = dim.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const pixels = ctx.createImageData(width, height);

  const putPixel = (dst: Uint8ClampedArray, offset: number, color: number) => {
    dst[offset + 0] = (color & 0x1f) << 3;
    dst[offset + 1] = ((color >> 5) & 0x1f) << 3;
    dst[offset + 2] = ((color >> 10) & 0x1f) << 3;
    dst[offset + 3] = color === 0 ? 0 : 0xff;
  }

  const entries = dim.width * dim.height;
  if (file.type === IMAGE_TYPE.TRUE_COLOR_16_BPP) {
    for (let i = 0; i < entries; i++) {
      const c = data.getUint16(offset + i * 2, true);
      putPixel(pixels.data, i * 4, c);
    }
  } else if (file.type === IMAGE_TYPE.PALETTED_8_BPP) {
    for (let i = 0; i < entries; i++) {
      const p = data.getUint16(offset + i * 2, true);

      putPixel(pixels.data, i * 8 + 0, palette![p & 0xff]);
      putPixel(pixels.data, i * 8 + 4, palette![(p >> 8) & 0xff]);
    }
  } else if (file.type === IMAGE_TYPE.PALETTED_4_BPP) {
    for (let i = 0; i < entries; i++) {
      const p = data.getUint16(offset + i * 2, true);

      putPixel(pixels.data, i * 16 + 0, palette![p & 0xf]);
      putPixel(pixels.data, i * 16 + 4, palette![(p >> 4) & 0xf]);
      putPixel(pixels.data, i * 16 + 8, palette![(p >> 8) & 0xf]);
      putPixel(pixels.data, i * 16 + 12, palette![(p >> 12) & 0xf]);
    }
  }

  ctx.putImageData(pixels, 0, 0);
  document.body.appendChild(canvas);
  return canvas;
};

const loadBinary = (url: string): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.responseType = "arraybuffer";

    if (req.overrideMimeType) {
      req.overrideMimeType('text/plain; charset=x-user-defined');
    } else {
      req.setRequestHeader('Accept-Charset', 'x-user-defined');
    }

    req.onload = () => {
      if (req.status === 200) {
        resolve(req.response);
      } else {
        reject(new Error(`Failed to load: ${url}`));
      }
    };
    req.send();
  });
};

const loadBinaries = (urls: { [key: string]: string }): Promise<{ [key: string]: ArrayBuffer }> => {
  const promises = Object.keys(urls).map(name => loadBinary(urls[name]));
  return Promise.all(promises).then(results => {
    const files: { [key: string]: ArrayBuffer } = {};
    Object.keys(urls).forEach((name, index) => {
      files[name] = results[index];
    });
    return files;
  });
};

const readObjects = (buffer: ArrayBuffer): any[] => {
  let offset = 0;
  const objects: any[] = [];
  while (offset < buffer.byteLength) {
    const object = readObject(buffer, offset);
    offset += object.byteLength;
    objects.push(object);
  }
  return objects;
};

const readObject = (buffer: ArrayBuffer, offset: number): any => {
  const initialOffset = offset;

  const header = ObjectHeader.readStructs(buffer, offset, 1)[0];
  offset += ObjectHeader.byteLength;

  const vertices = Vertex.readStructs(buffer, offset, header.vertexCount);
  offset += Vertex.byteLength * header.vertexCount;

  const polygons: any[] = [];
  for (let i = 0; i < header.polygonCount; i++) {
    const polygonHeader = PolygonHeader.readStructs(buffer, offset, 1)[0];
    const PolygonType = Polygon[polygonHeader.type];
    const polygon = PolygonType.readStructs(buffer, offset, 1)[0];
    offset += PolygonType.byteLength;
    polygons.push(polygon);
  }

  return {
    header,
    vertices,
    polygons,
    byteLength: offset - initialOffset
  };
};

const createCameraSpline = (buffer: ArrayBuffer, faces: any[], vertices: Vector3[]): HermiteCurve3 => {
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

const createSceneFromFiles = (files: any, modify?: any) => {
  const rawImages = files.textures ? unpackImages(files.textures) : [];
  const images = rawImages.map(readImage);
  const sceneMaterial = createMeshFaceMaterial(images, true, FrontSide);

  const objects = readObjects(files.objects);
  let model: Mesh;
  objects.forEach((object, i) => {
    console.log('iterate')
    model = createModelFromObject(object, sceneMaterial);
    if (modify && modify.scale) {
      model.scale.set(modify.scale, modify.scale, modify.scale);
    }
    if (modify && modify.move) {
      model.position.add(modify.move);
    }
    if (modify && modify.space) {
      model.position.add({ x: (i + 0.5 - objects.length / 2) * modify.space, y: 0, z: 0 });
    }
  });
  return model;
};

const createTrack = (files: any): Mesh => {
  const rawImages = unpackImages(files.textures);
  const images = rawImages.map(readImage);

  const indexEntries = files.textureIndex.byteLength / TrackTextureIndex.byteLength;
  const textureIndex = TrackTextureIndex.readStructs(files.textureIndex, 0, indexEntries);

  const composedImages = textureIndex.map((idx: any) => {
    const composedImage = document.createElement('canvas');
    composedImage.width = 128;
    composedImage.height = 128;
    const ctx = composedImage.getContext('2d')!;

    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 4; y++) {
        const image = images[idx.near[y * 4 + x]];
        ctx.drawImage(image, x * 32, y * 32);
      }
    }
    return composedImage;
  });

  const trackMaterial = createMeshFaceMaterial(composedImages, true, DoubleSide);

  const geometry = new BufferGeometry();

  const vertexCount = files.vertices.byteLength / TrackVertex.byteLength;
  const rawVertices = TrackVertex.readStructs(files.vertices, 0, vertexCount);

  const vertices = new Float32Array(vertexCount * 3);
  rawVertices.forEach((vertex: any, i: number) => {
    vertices[i * 3] = vertex.x;
    vertices[i * 3 + 1] = -vertex.y;
    vertices[i * 3 + 2] = -vertex.z;
  });
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));

  const faceCount = files.faces.byteLength / TrackFace.byteLength;
  const faces = TrackFace.readStructs(files.faces, 0, faceCount);

  const indices: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];

  faces.forEach((face: any) => {
    const color = int32ToColor(face.color);

    if (face.flags & TRACK_FACE_FLAGS.BOOST) {
      color.setRGB(0.25, 0.25, 2);
    }

    indices.push(face.indices[0], face.indices[1], face.indices[2]);
    indices.push(face.indices[2], face.indices[3], face.indices[0]);

    const flipx = (face.flags & TRACK_FACE_FLAGS.FLIP) ? 1 : 0;
    uvs.push(
      1 - flipx, 1,
      0 + flipx, 1,
      0 + flipx, 0,
      0 + flipx, 0,
      1 - flipx, 0,
      1 - flipx, 1
    );

    colors.push(color.r, color.g, color.b, color.r, color.g, color.b, color.r, color.g, color.b, color.r, color.g, color.b);

    // Compute normals for flat shading
    const v0 = new Vector3(vertices[face.indices[0] * 3], vertices[face.indices[0] * 3 + 1], vertices[face.indices[0] * 3 + 2]);
    const v1 = new Vector3(vertices[face.indices[1] * 3], vertices[face.indices[1] * 3 + 1], vertices[face.indices[1] * 3 + 2]);
    const v2 = new Vector3(vertices[face.indices[2] * 3], vertices[face.indices[2] * 3 + 1], vertices[face.indices[2] * 3 + 2]);

    const edge1 = new Vector3().subVectors(v1, v0);
    const edge2 = new Vector3().subVectors(v2, v0);
    const normal = new Vector3().crossVectors(edge1, edge2).normalize();

    for (let i = 0; i < 6; i++) {
      normals.push(normal.x, normal.y, normal.z);
    }
  });

  geometry.setIndex(indices);
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setDrawRange(0, indices.length);
  geometry.computeVertexNormals();

  const mesh = new Mesh(geometry, trackMaterial);
  mesh.geometry.computeBoundingSphere();

  return mesh;
};


const loadTrack = async (path: string, loadTEXFile: boolean): Promise<Record<string, Mesh>> => {

  const sky = createSceneFromFiles(await loadBinaries({
    textures: `${path}/SKY.CMP`,
    objects: `${path}/SKY.PRM`
  }), { scale: 48 });

  return {
    sky,
  }
};

const Tracks = {
  Wipeout: [
    { path: "WIPEOUT/TRACK02", name: "Altima VII - Venom" },
    { path: "WIPEOUT/TRACK03", name: "Altima VII - Rapier" },
    { path: "WIPEOUT/TRACK04", name: "Karbonis V - Venom" },
    { path: "WIPEOUT/TRACK05", name: "Karbonis V - Rapier" },
    { path: "WIPEOUT/TRACK01", name: "Terramax - Venom" },
    { path: "WIPEOUT/TRACK06", name: "Terramax - Rapier" },
    { path: "WIPEOUT/TRACK12", name: "Korodera - Venom" },
    { path: "WIPEOUT/TRACK07", name: "Korodera - Rapier" },
    { path: "WIPEOUT/TRACK08", name: "Arridos IV - Venom" },
    { path: "WIPEOUT/TRACK11", name: "Arridos IV - Rapier" },
    { path: "WIPEOUT/TRACK09", name: "Silverstream - Venom" },
    { path: "WIPEOUT/TRACK13", name: "Silverstream - Rapier" },
    { path: "WIPEOUT/TRACK10", name: "Firestar - Venom" },
    { path: "WIPEOUT/TRACK14", name: "Firestar - Rapier" }
  ],
  Wipeout2097: [
    { path: "WIPEOUT2/TRACK01", name: "Talon's Reach", hasTEXFile: true },
    { path: "WIPEOUT2/TRACK08", name: "Sagarmatha", hasTEXFile: true },
    { path: "WIPEOUT2/TRACK13", name: "Valparaiso", hasTEXFile: true },
    { path: "WIPEOUT2/TRACK20", name: "Phenitia Park", hasTEXFile: true },
    { path: "WIPEOUT2/TRACK02", name: "Gare d'Europa", hasTEXFile: true },
    { path: "WIPEOUT2/TRACK17", name: "Odessa Keys", hasTEXFile: true },
    { path: "WIPEOUT2/TRACK06", name: "Vostok Island", hasTEXFile: true },
    { path: "WIPEOUT2/TRACK07", name: "Spilskinanke", hasTEXFile: true },
    { path: "WIPEOUT2/TRACK04", name: "Unfinished Track" },
  ]
};

export {
  createRenderer,
  createCameras,
  createControls,
  createScene,
  clearScene,
  updateSplineCamera,
  rotateSpritesToCamera,
  updateWeaponMaterial,
  resizeRenderer,
  animate,
  int32ToColor,
  createModelFromObject,
  createMeshFaceMaterial,
  unpackImages,
  readImage,
  loadBinary,
  loadBinaries,
  readObjects,
  readObject,
  createCameraSpline,
  getSectionPosition,
  createSceneFromFiles,
  createTrack,
  loadTrack,
  Tracks
};

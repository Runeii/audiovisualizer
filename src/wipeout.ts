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
} from 'three';
import Struct from './struct';
import { OrbitControls } from 'three-stdlib';
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

const createModelFromObject = (
  object: any,
  sceneMaterial: any
): Object3D => {
  const model = new Object3D();
  const geometry = new BufferGeometry();

  model.position.set(object.header.position.x, -object.header.position.y, -object.header.position.z);

  const vertices = new Float32Array(object.vertices.length * 3);
  object.vertices.forEach((vertex: any, i: number) => {
    vertices[i * 3] = vertex.x;
    vertices[i * 3 + 1] = -vertex.y;
    vertices[i * 3 + 2] = -vertex.z;
  });
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));

  const indices: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];

  object.polygons.forEach((p: any) => {
    if (
      p.header.type === POLYGON_TYPE.SPRITE_BOTTOM_ANCHOR ||
      p.header.type === POLYGON_TYPE.SPRITE_TOP_ANCHOR
    ) {
      const v = geometry.attributes.position.array.slice(p.index * 3, p.index * 3 + 3);
      const color = int32ToColor(p.color);
      const yOffset = p.header.type === POLYGON_TYPE.SPRITE_BOTTOM_ANCHOR
        ? p.height / 2
        : -p.height / 2;

      const spriteMaterial = new MeshBasicMaterial({
        map: sceneMaterial[p.texture].map,
        color: color,
        alphaTest: 0.5,
      });
      const spriteMesh = new Mesh(new PlaneGeometry(p.width, p.height), spriteMaterial);

      const sprite = new Object3D();
      sprite.position.set(v[0], v[1] + yOffset, v[2]);
      sprite.add(spriteMesh);
      model.add(sprite);
    } else if (p.indices) {
      const materialIndex = typeof p.texture !== 'undefined' ? p.texture : sceneMaterial.flatMaterialIndex;
      const c = [new Color(1, 1, 1), new Color(1, 1, 1), new Color(1, 1, 1), new Color(1, 1, 1)];
      const uv = [new Vector2(), new Vector2(), new Vector2(), new Vector2()];

      if (typeof p.texture !== 'undefined') {
        const img = sceneMaterial[materialIndex].map.image;
        for (let j = 0; j < p.uv.length; j++) {
          uv[j].set(p.uv[j].u / img.width, 1 - p.uv[j].v / img.height);
        }
      }

      if (p.color || p.colors) {
        for (let j = 0; j < p.indices.length; j++) {
          c[j].copy(int32ToColor(p.color || p.colors[j]));
        }
      }

      indices.push(p.indices[0], p.indices[1], p.indices[2]);
      colors.push(c[0].r, c[0].g, c[0].b, c[1].r, c[1].g, c[1].b, c[2].r, c[2].g, c[2].b);
      uvs.push(uv[0].x, uv[0].y, uv[1].x, uv[1].y, uv[2].x, uv[2].y);

      if (p.indices.length === 4) {
        indices.push(p.indices[2], p.indices[3], p.indices[0]);
        colors.push(c[2].r, c[2].g, c[2].b, c[3].r, c[3].g, c[3].b, c[0].r, c[0].g, c[0].b);
        uvs.push(uv[2].x, uv[2].y, uv[3].x, uv[3].y, uv[0].x, uv[0].y);
      }
    }
  });

  geometry.setIndex(indices);
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));

  if (indices.length > 0) {
    const mesh = new Mesh(geometry, sceneMaterial);
    model.add(mesh);
  }

  return model;
}
const createMeshFaceMaterial = (images: HTMLCanvasElement[], vertexColors: boolean, side: number): Material[] => {
  const materials: MeshBasicMaterial[] = [];

  images.forEach((image) => {
    const texture = new Texture(image);
    texture.minFilter = NearestFilter;
    texture.magFilter = NearestFilter;
    texture.needsUpdate = true;

    const material = new MeshBasicMaterial({
      map: texture,
      vertexColors: vertexColors ? true : false,
      side: side === FrontSide ? FrontSide : side === DoubleSide ? DoubleSide : BackSide,
      alphaTest: 0.5,
    });

    materials.push(material);
  });

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
  const sceneMaterial = createMeshFaceMaterial(images, false, FrontSide);

  const objects = readObjects(files.objects);
  const mesh = new Object3D();
  objects.forEach((object, i) => {
    const model = createModelFromObject(object, sceneMaterial);
    if (modify && modify.scale) {
      model.scale.set(modify.scale, modify.scale, modify.scale);
    }
    if (modify && modify.move) {
      model.position.add(modify.move);
    }
    if (modify && modify.space) {
      model.position.add({ x: (i + 0.5 - objects.length / 2) * modify.space, y: 0, z: 0 });
    }
    mesh.add(model);
  });

  return mesh;
};

const createTrack = (files: any): Object3D => {
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
  const model = new Object3D();
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
  model.add(mesh);

  const sphereGeometry = new SphereGeometry(mesh.geometry.boundingSphere?.radius, 32, 32);
  const sphereMaterial = new MeshBasicMaterial({ color: 0x00ff00, side: DoubleSide, wireframe: true });
  const sphereMesh = new Mesh(sphereGeometry, sphereMaterial);
  sphereMesh.position.copy(mesh.geometry.boundingSphere?.center ?? new Vector3());
  model.add(sphereMesh);

  const extractVertices = (geometry: BufferGeometry): Vector3[] => {
    const positionAttribute = geometry.getAttribute('position') as Float32BufferAttribute;
    const vertices: Vector3[] = [];

    for (let i = 0; i < positionAttribute.count; i++) {
      const vertex = new Vector3();
      vertex.fromBufferAttribute(positionAttribute, i);
      vertices.push(vertex);
    }

    return vertices;
  };

  const cameraSpline = createCameraSpline(files.sections, faces, extractVertices(geometry));

  return model;
};

const loadTrack = async (path: string, loadTEXFile: boolean): Promise<Record<string, Object3D>> => {
  const scene = createSceneFromFiles(await loadBinaries({
    textures: `${path}/SCENE.CMP`,
    objects: `${path}/SCENE.PRM`
  }));

  const sky = createSceneFromFiles(await loadBinaries({
    textures: `${path}/SKY.CMP`,
    objects: `${path}/SKY.PRM`
  }), { scale: 48 });

  const trackFiles = {
    textures: `${path}/LIBRARY.CMP`,
    textureIndex: `${path}/LIBRARY.TTF`,
    vertices: `${path}/TRACK.TRV`,
    faces: `${path}/TRACK.TRF`,
    sections: `${path}/TRACK.TRS`
  };
  if (loadTEXFile) {
    trackFiles.trackTexture = `${path}/TRACK.TEX`;
  }
  const track = createTrack(await loadBinaries(trackFiles));

  return {
    scene,
    sky,
    track
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

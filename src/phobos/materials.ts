import { CanvasTexture, Material, MeshBasicMaterial, NearestFilter, Side } from "three";
import { IMAGE_TYPE, ImageFileHeader, ImagePixelHeader } from "./structs";

export const readImage = (buffer: ArrayBuffer): HTMLCanvasElement => {
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

export const unpackImages = (buffer: ArrayBuffer): ArrayBuffer[] => {
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

export const createMeshFaceMaterial = (images: HTMLCanvasElement[], vertexColors: boolean, side: Side): Material[] => {
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
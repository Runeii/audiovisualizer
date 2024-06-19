import { Color, FrontSide, Material, Mesh, Vector2 } from "three";
import { createMeshFaceMaterial, readImage, unpackImages } from "./materials";
import { ObjectHeader, POLYGON_TYPE, Polygon, PolygonHeader, Vertex } from "./structs";
import { constructMeshFromBufferGeometryData, int32ToColor, loadBinaries } from "./utils/utils";

const nullVector = new Vector2(0, 0);
const whiteColor = new Color(1, 1, 1);

const createModelFromObject = (
  object: WipeoutObject,
  sceneMaterial: Material[]
): Mesh => {
  const initialValue: BufferGeometryData = {
    faceVertexUvs: [],
    indices: [],
    colors: [],
    positions: object.vertices.map((vertex) => [vertex.x, -vertex.y, -vertex.z]).flat(),
  }

  const result = object.polygons.reduce((previousResult: BufferGeometryData, polygon: Polygon) => {
    if (polygon.header.type === POLYGON_TYPE.SPRITE_BOTTOM_ANCHOR || polygon.header.type === POLYGON_TYPE.SPRITE_TOP_ANCHOR) {
      console.warn('Found a sprite, not currently supported!!');
      return previousResult;
    }

    if (!polygon.indices) {
      return previousResult;
    }

    // UVs
    let uvs = [nullVector, nullVector, nullVector, nullVector];
    if (polygon.texture !== undefined && polygon.uv !== undefined) {
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
      ...previousResult,
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
        ...polygonColors.flatMap(color => [color.r, color.g, color.b])
      ],
    };
  }, initialValue);

  const mesh = constructMeshFromBufferGeometryData(result, sceneMaterial);
  mesh.position.set(object.header.position.x, -object.header.position.y, -object.header.position.z);

  return mesh;
}

const readObject = (buffer: ArrayBuffer, offset: number) => {
  const initialOffset = offset;

  const header = ObjectHeader.readStructs(buffer, offset, 1)[0];
  offset += ObjectHeader.byteLength;

  const vertices = Vertex.readStructs(buffer, offset, header.vertexCount);
  offset += Vertex.byteLength * header.vertexCount;

  const polygons = Array.from({ length: header.polygonCount }, () => {
    const polygonHeader = PolygonHeader.readStructs(buffer, offset, 1)[0];
    const PolygonType = Polygon[polygonHeader.type];
    const polygon = PolygonType.readStructs(buffer, offset, 1)[0];
    offset += PolygonType.byteLength;
    return polygon;
  });

  return {
    header,
    vertices,
    polygons,
    byteLength: offset - initialOffset,
  };
};

const readObjects = (buffer: ArrayBuffer) => {
  let offset = 0;
  const objects = [];

  while (offset < buffer.byteLength) {
    const object = readObject(buffer, offset);
    offset += object.byteLength;
    objects.push(object);
  }

  return objects;
};

export const createObjectFromFiles = async (paths: Record<string, string>) => {
  const files = await loadBinaries(paths);
  const rawImages = files.textures ? unpackImages(files.textures) : [];
  const images = rawImages.map(readImage);
  const sceneMaterial = createMeshFaceMaterial(images, true, FrontSide);

  const objects = readObjects(files.objects);

  const mesh = new Mesh();
  objects.forEach((object) => {
    const model = createModelFromObject(object, sceneMaterial);
    mesh.add(model);
  });

  return mesh;
};

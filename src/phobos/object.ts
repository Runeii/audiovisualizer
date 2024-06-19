import { BufferAttribute, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, FrontSide, Mesh, MeshBasicMaterial, Vector2 } from "three";
import { createMeshFaceMaterial, readImage, unpackImages } from "./materials";
import { ObjectHeader, POLYGON_TYPE, Polygon, PolygonHeader, Vertex } from "./structs";
import { int32ToColor } from "./utils/utils";


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

  // Compute Normals
  geometry.computeVertexNormals();

  const mesh = new Mesh(geometry, sceneMaterial);
  mesh.position.set(object.header.position.x, -object.header.position.y, -object.header.position.z);

  const normalGeometry = new BufferGeometry();
  const normalPositions = [
    0, 0, 0,
    1, 0, 0,
    1, 1, 0,
    1, 1, 1,
  ]

  const normalIndices = [
    0, 1,
    2, 3,
  ];
  normalGeometry.setAttribute('position', new Float32BufferAttribute(normalPositions, 3));
  geometry.setIndex(new BufferAttribute(new Uint16Array(normalIndices), 1));

  const simpleMesh = new Mesh(normalGeometry, new MeshBasicMaterial({ color: 0xff0000, side: DoubleSide }));
  simpleMesh.scale.set(100, 100, 100);
  mesh.add(simpleMesh);
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

export const createObjectFromFiles = (files: any, modify?: any) => {
  const rawImages = files.textures ? unpackImages(files.textures) : [];
  const images = rawImages.map(readImage);
  const sceneMaterial = createMeshFaceMaterial(images, true, FrontSide);

  const objects = readObjects(files.objects);
  let model: Mesh;
  objects.forEach((object, i) => {
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
  console.log(model)
  return model;
};

import { Color, FrontSide, Mesh, MeshBasicMaterial, Object3D, PlaneGeometry, Texture, Vector2 } from "three";
import { createMeshFaceMaterial, readImage, unpackImages } from "./materials";
import { ObjectHeader, POLYGON_TYPE, Polygon, PolygonHeader, Vertex } from "./structs";
import { constructMeshFromBufferGeometryData, createBufferGeometryDataFromPolygons, int32ToColor, loadBinaries } from "./utils/utils";


const createModelFromObject = (
  object: WipeoutObject,
  sceneMaterial: MeshBasicMaterial[]
): Mesh => {
  const sprites = object.polygons.map((polygon: Polygon) => {
    const sprite = object.polygons[0];
    const map = sprite.texture ? (sceneMaterial[sprite?.texture]?.map ?? null) : null;

    if (polygon.header.type !== POLYGON_TYPE.SPRITE_BOTTOM_ANCHOR && polygon.header.type !== POLYGON_TYPE.SPRITE_TOP_ANCHOR) {
      return;
    }

    return {
      sprite,
      map
    }
  }).filter(hasValue => hasValue);

  const data = createBufferGeometryDataFromPolygons(object.polygons, object.vertices, sceneMaterial);

  const mesh = constructMeshFromBufferGeometryData({
    sprites,
    ...data,
  }, sceneMaterial);

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

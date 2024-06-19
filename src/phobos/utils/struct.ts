"use strict";

type Endian = boolean;

interface StructType {
  name?: string | null;
  readCode: string;
  byteLength: number;
  defaultValue: any;
  structProperty: boolean;
  array?: boolean;
  struct?: boolean;
}

interface StructDefinition {
  [key: string]: StructType;
}

type StructCallback = (struct: any, offset: number) => void;

interface Struct {
  struct_type_id: string;
  byteLength: number;
  readCode: string;
  readStructs: (arrayBuffer: ArrayBuffer, offset: number, count: number, callback?: StructCallback) => any[];
}

interface StructConstructor {
  int8: (name?: string, endian?: Endian) => StructType;
  uint8: (name?: string, endian?: Endian) => StructType;
  int16: (name?: string, endian?: Endian) => StructType;
  uint16: (name?: string, endian?: Endian) => StructType;
  int32: (name?: string, endian?: Endian) => StructType;
  uint32: (name?: string, endian?: Endian) => StructType;
  float32: (name?: string, endian?: Endian) => StructType;
  float64: (name?: string, endian?: Endian) => StructType;
  string: (name: string, length: number) => StructType;
  array: (name: string, type: StructType, length: number) => StructType;
  struct: (name: string, struct: Struct) => StructType;
  skip: (length: number) => StructType;
  create: (...args: (StructType | StructDefinition)[]) => Struct;
  BIG_ENDIAN: Endian;
  LITTLE_ENDIAN: Endian;
}

let nextStructId = 0;

const Struct: StructConstructor = {
  int8: (name, endian = Struct.BIG_ENDIAN) => ({
    name,
    readCode: `v.getInt8(o${endian ? ',true' : ''});`,
    byteLength: 1,
    defaultValue: 0,
    structProperty: true
  }),

  uint8: (name, endian = Struct.BIG_ENDIAN) => ({
    name,
    readCode: `v.getUint8(o${endian ? ',true' : ''});`,
    byteLength: 1,
    defaultValue: 0,
    structProperty: true
  }),

  int16: (name, endian = Struct.BIG_ENDIAN) => ({
    name,
    readCode: `v.getInt16(o${endian ? ',true' : ''});`,
    byteLength: 2,
    defaultValue: 0,
    structProperty: true
  }),

  uint16: (name, endian = Struct.BIG_ENDIAN) => ({
    name,
    readCode: `v.getUint16(o${endian ? ',true' : ''});`,
    byteLength: 2,
    defaultValue: 0,
    structProperty: true
  }),

  int32: (name, endian = Struct.BIG_ENDIAN) => ({
    name,
    readCode: `v.getInt32(o${endian ? ',true' : ''});`,
    byteLength: 4,
    defaultValue: 0,
    structProperty: true
  }),

  uint32: (name, endian = Struct.BIG_ENDIAN) => ({
    name,
    readCode: `v.getUint32(o${endian ? ',true' : ''});`,
    byteLength: 4,
    defaultValue: 0,
    structProperty: true
  }),

  float32: (name, endian = Struct.BIG_ENDIAN) => ({
    name,
    readCode: `v.getFloat32(o${endian ? ',true' : ''});`,
    byteLength: 4,
    defaultValue: 0,
    structProperty: true
  }),

  float64: (name, endian = Struct.BIG_ENDIAN) => ({
    name,
    readCode: `v.getFloat64(o${endian ? ',true' : ''});`,
    byteLength: 8,
    defaultValue: 0,
    structProperty: true
  }),

  string: (name, length) => ({
    name,
    readCode: `(function(o) {
            var str = "";
            for (var j = 0; j < ${length}; ++j) {
                var char = v.getUint8(o + j, true);
                if (char === 0) { break; }
                str += String.fromCharCode(char);
            }
            return str;
        })(o);`,
    byteLength: length,
    defaultValue: "",
    structProperty: true
  }),

  array: (name, type, length) => ({
    name,
    readCode: `(function(o) {
            var aa = new Array(${length}), av;
            for (var j = 0; j < ${length}; ++j) {
                av = ${type.readCode}
                o += ${type.byteLength};
                aa[j] = av;
            }
            return aa;
        })(o);`,
    byteLength: type.byteLength * length,
    defaultValue: null,
    array: true,
    structProperty: true
  }),

  struct: (name, struct) => ({
    name,
    readCode: struct.readCode,
    byteLength: struct.byteLength,
    defaultValue: null,
    struct: true,
    structProperty: true
  }),

  skip: (length) => ({
    name: null,
    readCode: "null;\n",
    byteLength: length,
    structProperty: true
  }),

  create: function (...args: (StructType | StructDefinition)[]): Struct {
    const properties = args[args.length - 1].structProperty ? {} : args[args.length - 1] as StructDefinition;

    let byteLength = 0;
    const struct = Object.create(Object.prototype, properties) as Struct;

    // This new struct will be assigned a unique name so that instances can be easily constructed later.
    // It is not recommended that you use these names for anything outside this class, as they are not
    // intended to be stable from run to run.
    Object.defineProperty(struct, "struct_type_id", { value: `struct_id_${nextStructId}`, enumerable: false, configurable: false, writable: false });
    Object.defineProperty(this, struct.struct_type_id, { value: struct, enumerable: false, configurable: false, writable: false });
    nextStructId += 1;

    // Build the code to read a single struct, calculate byte lengths, and define struct properties
    let readCode = `(function(o) { var st = Object.create(Struct.${struct.struct_type_id});\n`;
    for (const type of args) {
      if (!(type as StructType).structProperty) continue;
      if ((type as StructType).name) {
        Object.defineProperty(struct, (type as StructType).name!, { value: (type as StructType).defaultValue, enumerable: true, configurable: true, writable: true });
        readCode += `st.${(type as StructType).name} = ${(type as StructType).readCode}\n`;
      }
      readCode += `o += ${(type as StructType).byteLength};\n`;
      byteLength += (type as StructType).byteLength;
    }
    readCode += `return st; })(o);`;

    // Build the code to read an array of this struct type
    let parseScript = `var a = new Array(count);\n var s;\n`;
    parseScript += `var v = new DataView(arrayBuffer, offset);\n`; // TODO: I should be able to specify a length here (count * this.byteLength), but it consistently gives me an INDEX_SIZE_ERR. Wonder why?
    parseScript += `var o = 0, so = 0;\n`;
    parseScript += `for (var i = 0; i < count; ++i) {\n`;
    parseScript += `   so = o;\n`;
    parseScript += `   s = ${readCode}\n`;
    parseScript += `   o += this.byteLength;\n`;
    parseScript += `   if (callback) { callback(s, offset + so); }\n`;
    parseScript += `   a[i] = s;\n`;
    parseScript += `}\n`;
    parseScript += `return a;\n`;

    Object.defineProperty(struct, "byteLength", { value: byteLength, enumerable: true, configurable: true, writable: true });
    Object.defineProperty(struct, "readCode", { value: readCode, enumerable: true, configurable: true, writable: true });

    const parseFunc = new Function("arrayBuffer", "offset", "count", "callback", parseScript);
    Object.defineProperty(struct, "readStructs", { value: parseFunc, configurable: true, writable: true });

    return struct;
  },

  BIG_ENDIAN: false,
  LITTLE_ENDIAN: true,
};

window.Struct = Struct;

export default Struct;

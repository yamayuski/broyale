/**
 * コンポーネントフィールド型名称
 */
export type FieldType =
  | "f16"
  | "f32"
  | "f64"
  | "i8"
  | "i16"
  | "i32"
  | "u8"
  | "u16"
  | "u32"
  | "u8c"
  | "bi64"
  | "biu64"
  | "bool";

/**
 * コンポーネントスキーマ
 * @example
 * ```ts
 * export class Position {
 *   x = 0.0;
 *   y = 0.0;
 *   static readonly typeId = "Position";
 *   static readonly schema: ComponentSchema<Position> = {
 *     x: "f32",
 *     y: "f32",
 *   };
 * }
 * ```
 */
export type ComponentSchema<T> = {
  [K in keyof T]: FieldType;
};

/**
 * コンポーネントコンストラクタ定義
 */
export interface ComponentConstructor<T = unknown> {
  new (): T;
  readonly typeId: string;
  readonly schema: ComponentSchema<T>;
}

/**
 * 未定義のフィールド型
 */
export class UnsupportedFieldTypeError extends Error {
}

/**
 * 型付き配列のユニオン型
 */
export type TypedArray =
  | Float16Array
  | Float32Array
  | Float64Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | Uint8ClampedArray
  | BigInt64Array
  | BigUint64Array;

import { assertEquals, assertThrows } from "@std/assert";
import { ColumnStore } from "./columnStore.ts";
import { UnsupportedFieldTypeError } from "./types.ts";

type Comp = {
  x: number;
  flag: boolean;
  id: bigint;
  name: number;
};

const schema = {
  x: "f32",
  flag: "bool",
  id: "bi64",
  name: "i32",
} as const;

Deno.test("ColumnStore の基本的な set/get と文字列から数値への解析", () => {
  const store = new ColumnStore<Comp>(schema, 4);

  const zero: Comp = {
    x: 1.5,
    flag: true,
    id: 10n,
    name: 42,
  };

  store.set(0, zero);
  const v0 = store.get(0);

  assertEquals(typeof v0.x, "number");
  assertEquals(v0.x, zero.x);
  assertEquals(typeof v0.flag, "boolean");
  assertEquals(v0.flag, zero.flag);
  assertEquals(typeof v0.id, "bigint");
  assertEquals(v0.id, zero.id);
  assertEquals(typeof v0.name, "number");
  assertEquals(v0.name, zero.name);
});

Deno.test("ensureCapacity が拡張され、初期容量を超えた set/get", () => {
  const store = new ColumnStore<Comp>(schema, 2);

  const twenty: Comp = {
    x: -3.25,
    flag: false,
    id: 123n,
    name: 7,
  };

  // set at a large index to force growth
  store.set(
    20,
    twenty,
  );
  const v = store.get(20);
  assertEquals(v.x, twenty.x);
  assertEquals(v.flag, twenty.flag);
  assertEquals(v.id, twenty.id);
  assertEquals(v.name, twenty.name);
});

Deno.test("swapRemove が末尾要素を削除位置にコピーして縮小すること", () => {
  const store = new ColumnStore<Comp>(schema, 4);

  const zero: Comp = {
    x: 0.5,
    flag: true,
    id: 1n,
    name: 1,
  };
  const one: Comp = {
    x: 1.25,
    flag: false,
    id: 2n,
    name: 2,
  };
  const two: Comp = {
    x: 2.125,
    flag: true,
    id: 3n,
    name: 3,
  };

  const defaultComp: Comp = {
    x: 0.0,
    flag: false,
    id: 0n,
    name: 0,
  };

  store.set(0, zero);
  store.set(1, one);
  store.set(2, two);

  // index:1 を削除したので、最後である index:2 の値が 1 にコピーされる
  store.swapRemove(1);
  const after = store.get(1);
  assertEquals(after.x, two.x);
  assertEquals(after.flag, two.flag);
  assertEquals(after.id, two.id);
  assertEquals(after.name, two.name);

  // 最後の要素を削除しただけなので、コピーなしで縮小する
  store.swapRemove(1);
  // 1 を取得すると、この型のデフォルト値が返る
  const maybe = store.get(1);
  assertEquals(maybe.x, defaultComp.x);
  assertEquals(maybe.flag, defaultComp.flag);
  assertEquals(maybe.id, defaultComp.id);
  assertEquals(maybe.name, defaultComp.name);
});

Deno.test("copyFrom が別の ColumnStore から単一要素をコピーすること", () => {
  const a = new ColumnStore<Comp>(schema, 4);
  const b = new ColumnStore<Comp>(schema, 4);

  b.set(0, { x: 9.5, flag: true, id: 999n, name: 77 } as unknown as Comp);
  a.copyFrom(5, b, 0);

  const copied = a.get(5);
  assertEquals(copied.x, 9.5);
  assertEquals(copied.flag, true);
  assertEquals(copied.id, 999n);
  assertEquals(copied.name, 77);
});

Deno.test("set がサポートされていない値型に対して UnsupportedFieldTypeError を投げること", () => {
  const store = new ColumnStore<Comp>(schema, 2);
  // object is unsupported by ColumnStore.set
  assertThrows(
    () =>
      store.set(
        0,
        { x: {}, flag: false, id: 1n, name: 0 } as unknown as Comp,
      ),
    UnsupportedFieldTypeError,
  );
});

Deno.test("コンストラクタがサポートされていないスキーマフィールド型に対して例外を投げること", () => {
  // pass an invalid field type to provoke UnsupportedFieldTypeError in constructor
  const badSchema = { bad: "not_a_type" } as unknown as Record<string, string>;
  assertThrows(() => {
    // @ts-expect-error deliberately wrong schema to test runtime error
    new ColumnStore(badSchema, 2);
  }, UnsupportedFieldTypeError);
});

Deno.test("範囲外インデックスに対して swapRemove が例外を投げること", () => {
  const store = new ColumnStore<Comp>(schema, 2);
  // empty store, size == 0, removing index 0 should error
  assertThrows(() => store.swapRemove(0), Error);
});

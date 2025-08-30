import { assertEquals, assertThrows } from "@std/assert";
import { Archetype } from "./archetype.ts";

// Minimal component constructors for tests
class Position {
  static typeId = "Position";
  static schema = { x: "f32", y: "f32" } as const;
  x: number;
  y: number;
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}

class Velocity {
  static typeId = "Velocity";
  static schema = { vx: "f32", vy: "f32" } as const;
  vx: number;
  vy: number;
  constructor(vx = 0, vy = 0) {
    this.vx = vx;
    this.vy = vy;
  }
}

class Tag {
  static typeId = "Tag";
  static schema = { flag: "bool" } as const;
  flag: boolean;
  constructor(flag = false) {
    this.flag = flag;
  }
}

class Identifier {
  static typeId = "Identifier";
  static schema = { id: "bi64" } as const;
  id: bigint;
  constructor(id = 0n) {
    this.id = id;
  }
}

Deno.test("constructor sorts ctors and signature is canonical", () => {
  // supply in unsorted order: Velocity, Position, Tag
  const arch = new Archetype(
    [
      Velocity,
      Position,
      Tag,
    ],
  );
  // sorted alphabetically by typeId: "Position", "Tag", "Velocity"
  assertEquals(arch.signature, "Position|Tag|Velocity");
  const ctors = arch.copyConstructorList();
  assertEquals(ctors.map((c) => c.typeId), [
    "Position",
    "Tag",
    "Velocity",
  ]);
});

Deno.test("addEntity sets provided values and fills defaults; size/indexOf/getComponentAt", () => {
  const arch = new Archetype(
    [
      Tag,
      Velocity,
      Position,
    ],
  );
  const entityId = 42n;
  const provided = new Position(1.5, -2.5);
  const map = new Map<string, unknown>();
  map.set(Position.typeId, provided);
  // addEntity expects Map<string, unknown>
  arch.addEntity(entityId, map);
  assertEquals(arch.size, 1);
  const idx = arch.indexOf(entityId);
  assertEquals(typeof idx, "number");
  // getComponentAt should return provided Position
  const gotPos = arch.getComponentAt(Position, idx!);
  assertEquals(gotPos.x, provided.x);
  assertEquals(gotPos.y, provided.y);
  // Velocity and Tag should be default instances
  const gotVel = arch.getComponentAt(Velocity, idx!);
  assertEquals(gotVel.vx, 0);
  assertEquals(gotVel.vy, 0);
  const gotTag = arch.getComponentAt(Tag, idx!);
  assertEquals(gotTag.flag, false);
});

Deno.test("removeEntity performs swap-remove and updates indices and stores", () => {
  const arch = new Archetype([Position]);
  const e1 = 1n;
  const e2 = 2n;
  const e3 = 3n;
  // add three entities with distinct positions
  arch.addEntity(
    e1,
    new Map([[Position.typeId, new Position(10, 0)]]),
  );
  arch.addEntity(
    e2,
    new Map([[Position.typeId, new Position(20, 0)]]),
  );
  arch.addEntity(
    e3,
    new Map([[Position.typeId, new Position(30, 0)]]),
  );
  assertEquals(arch.size, 3);
  // remove middle entity e2
  arch.removeEntity(e2);
  assertEquals(arch.size, 2);
  // e2 should be gone
  assertEquals(arch.indexOf(e2), undefined);
  // e3 should have moved into e2's slot (index 1)
  const idxE3 = arch.indexOf(e3);
  assertEquals(typeof idxE3, "number");
  const posAtIdx = arch.getComponentAt(Position, idxE3!);
  assertEquals(posAtIdx.x, 30);
  // now remove e3 (which is at index 1)
  arch.removeEntity(e3);
  assertEquals(arch.size, 1);
  // remaining entity should be e1 at index 0
  const idxE1 = arch.indexOf(e1);
  assertEquals(idxE1, 0);
  const posE1 = arch.getComponentAt(Position, 0);
  assertEquals(posE1.x, 10);
});

Deno.test("getComponentAt throws when component not in archetype", () => {
  const arch = new Archetype([Position]);
  // Identifier is not part of this archetype
  assertThrows(() => {
    arch.getComponentAt(Identifier, 0);
  }, Error);
});

Deno.test("copyEntityTo copies existing components and supplies defaults for missing ones", () => {
  const src = new Archetype([Position]);
  const target = new Archetype([
    Position,
    Velocity,
  ]);
  // add entity with a Position only
  src.addEntity(
    7n,
    new Map([[Position.typeId, new Position(5, 6)]]),
  );
  const idx = src.indexOf(7n)!;
  const copied = src.copyEntityTo(idx, target);
  // copied map contains Position from source
  const pos = copied.get(Position.typeId) as Position;
  assertEquals(pos.x, 5);
  assertEquals(pos.y, 6);
  // copied map contains Velocity default instance
  const vel = copied.get(Velocity.typeId) as Velocity;
  assertEquals(vel.vx, 0);
  assertEquals(vel.vy, 0);
});

Deno.test("forEachIndexed iterates in natural order and provides indices and ids", () => {
  const arch = new Archetype([
    Tag,
    Position,
  ]);
  arch.addEntity(
    101n,
    new Map([[Position.typeId, new Position(1, 1)]]),
  );
  arch.addEntity(
    202n,
    new Map([[Position.typeId, new Position(2, 2)]]),
  );
  const seen: Array<{ idx: number; id: bigint }> = [];
  arch.forEachIndexed((index, entityId) => {
    // entityId is whatever was provided; treat as number
    seen.push({ idx: index, id: entityId });
  });
  assertEquals(seen.length, 2);
  assertEquals(seen[0].idx, 0);
  assertEquals(seen[1].idx, 1);
  assertEquals(seen[0].id, 101n);
  assertEquals(seen[1].id, 202n);
});

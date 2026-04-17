import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("problem schema exports MVP language set", async () => {
  const src = await readFile("packages/problem-schema/src/index.ts", "utf8");
  assert.ok(src.includes('"javascript"'));
  assert.ok(src.includes('"typescript"'));
  assert.ok(src.includes('"python"'));
  assert.ok(src.includes('"sql"'));
  assert.ok(src.includes('"html-css"'));
});

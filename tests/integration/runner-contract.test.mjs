import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("api contract states isolated runner execution", async () => {
  const src = await readFile("apps/api/src/index.ts", "utf8");
  assert.ok(src.includes("APIプロセスで直接実行しない"));
  assert.ok(src.includes("runnerApiBaseUrl"));
});

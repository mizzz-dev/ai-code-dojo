import assert from "node:assert/strict";
import test from "node:test";
import { sum } from "../../starter/sum.js";

test("empty array should return zero", () => {
  assert.equal(sum([]), 0);
});

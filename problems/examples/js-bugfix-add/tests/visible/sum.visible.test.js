import assert from "node:assert/strict";
import test from "node:test";
import { sum } from "../../starter/sum.js";

test("sum of positive numbers", () => {
  assert.equal(sum([1, 2, 3]), 6);
});

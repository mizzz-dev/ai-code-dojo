import assert from "node:assert/strict";
import test from "node:test";
import { formatDisplayName } from "../../starter/user";

test("returns full name", () => {
  assert.equal(formatDisplayName({ firstName: "Taro", lastName: "Yamada" }), "Taro Yamada");
});

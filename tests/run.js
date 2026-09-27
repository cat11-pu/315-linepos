import assert from "node:assert";
import { locate, insertText, deleteRange } from "../textpos.js";
import { step, close } from "../textrun.js";
import { render } from "../app.js";

const base = {
  budget: 1,
  state: { text: "ab", found: [], ledger: [], applied: [] },
  events: [{ id: 1, kind: "at", pos: 0 }],
  range_error_code: "E_OUT_OF_RANGE", span_error_code: "E_BAD_RANGE",
  event_error_code: "E_BAD_EVENT"
};

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

check("locate returns line and column", () => {
  assert.ok(Array.isArray(locate("a", 0)));
});

check("insertText returns text", () => {
  assert.strictEqual(typeof insertText("a", 1, "b"), "string");
});

check("deleteRange returns text", () => {
  assert.strictEqual(typeof deleteRange("ab", 0, 1), "string");
});

check("step returns a state", () => {
  assert.strictEqual(typeof step(base).state, "object");
});

check("close returns a state", () => {
  assert.strictEqual(typeof close(base).state, "object");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);

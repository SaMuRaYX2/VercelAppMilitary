import { test } from "node:test";
import assert from "node:assert/strict";
import { validateAnswer, TOTAL, MAX_TEXT } from "./questions.ts";

test("validateAnswer", () => {
  assert.equal(TOTAL, 59);
  assert.equal(validateAnswer("1.1", "Частково"), "Частково");
  assert.equal(validateAnswer("2.2", "Частково"), null, "option not offered for this question");
  assert.equal(validateAnswer("1.1", "<script>"), null);
  assert.equal(validateAnswer("1.1", ""), "", "clearing a choice");
  assert.equal(validateAnswer("1.6", "  текст  "), "текст");
  assert.equal(validateAnswer("1.6", "x".repeat(MAX_TEXT + 1)), null);
  assert.equal(validateAnswer("99.9", "Так"), null, "unknown question");
  assert.equal(validateAnswer("__proto__", "Так"), null);
  assert.equal(validateAnswer("1.1", 1), null);
  assert.equal(validateAnswer(["1.1"], "Так"), null);
});

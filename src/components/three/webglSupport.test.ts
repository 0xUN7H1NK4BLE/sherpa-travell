import assert from "node:assert/strict";
import { test } from "node:test";
import { isWebGLAvailable } from "./webglSupport";

test("isWebGLAvailable returns false outside a browser environment", () => {
  assert.equal(isWebGLAvailable(), false);
});

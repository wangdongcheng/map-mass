import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

test("church galleries keep the cover first, isolate directories, and exclude screenshots", () => {
  const context = vm.createContext({ photoModules: {
    "../../references/church-photos/0046/side-10.jpg": "/side-10.jpg",
    "../../references/church-photos/0046/ScreenShot_test.png": "/screenshot.png",
    "../../references/church-photos/0046/screenshot_lowercase.png": "/screenshot-lower.png",
    "../../references/church-photos/0046/0046-original.jpg": "/original.jpg",
    "../../references/church-photos/0046/0046.jpg": "/cover.jpg",
    "../../references/church-photos/0046/side-2.jpg": "/side-2.jpg",
    "../../references/church-photos/0042/0042.png": "/other.png"
  } });
  const source = readFileSync(new URL("../src/data/church-photos.js", import.meta.url), "utf8")
    .replace(/const photoModules = import\.meta\.glob\([\s\S]*?\n\);/, "")
    .replace(/export function/g, "function");
  vm.runInContext(source, context);
  assert.equal(context.getChurchPhotoUrl("0046"), "/cover.jpg");
  assert.deepEqual(Array.from(context.getChurchPhotoUrls("0046")), [
    "/cover.jpg", "/original.jpg", "/side-2.jpg", "/side-10.jpg"
  ]);
  assert.deepEqual(Array.from(context.getChurchPhotoUrls("0042")), ["/other.png"]);
  assert.deepEqual(Array.from(context.getChurchPhotoUrls("9999")), []);
  context.getChurchPhotoUrls("0046").pop();
  assert.equal(context.getChurchPhotoUrls("0046").length, 4);
});

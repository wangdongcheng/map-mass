import assert from "node:assert/strict";
import test from "node:test";
import { readFile, writeFile, mkdtemp, unlink, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { LngLat, LngLatBounds } from "maplibre-gl";
import { getHomeView, getHomePanBounds } from "../src/map/home-view.js";

// Exercise the installed library's real perspective projection without WebGL.
// The development bundle keeps this internal class named, but does not export it.
const bundleUrl = new URL("../node_modules/maplibre-gl/dist/maplibre-gl-dev.mjs", import.meta.url);
const sharedUrl = new URL("./maplibre-gl-shared-dev.mjs", bundleUrl);
const directory = await mkdtemp(join(tmpdir(), "map-mass-projection-"));
const filename = join(directory, "projection.mjs");
let MercatorTransform;
try {
  const source = (await readFile(bundleUrl, "utf8"))
    .replace('"./maplibre-gl-shared-dev.mjs"', JSON.stringify(sharedUrl.href));
  await writeFile(filename, `${source}\nexport { MercatorTransform };\n`);
  ({ MercatorTransform } = await import(pathToFileURL(filename).href));
} finally {
  await unlink(filename);
  await rmdir(directory);
}

function makeMap(width, height) {
  const transform = new MercatorTransform();
  transform.resize(width, height);
  transform.setMaxZoom(18);
  transform.setMaxBounds(new LngLatBounds([13.7, 35.4], [15.07, 36.54]));
  transform.setCenter(new LngLat(14.38, 35.935));
  transform.setZoom(12);
  return { _camera: { transform }, getMaxZoom: () => 18 };
}

const geometry = JSON.parse(await readFile(
  new URL("../references/map/malta-boundary.geojson", import.meta.url), "utf8"
));
const coastline = geometry.features.flatMap(({ geometry }) =>
  geometry.type === "MultiPolygon"
    ? geometry.coordinates.flatMap((polygon) => polygon[0])
    : geometry.coordinates[0]
).map((point) => LngLat.convert(point));

for (const [width, height] of [[320, 568], [390, 844], [844, 390], [768, 1024], [1440, 900], [1920, 953], [2560, 1440], [3840, 1907]]) {
  test(`whole islands fit at the largest home zoom on ${width}x${height}`, () => {
    const map = makeMap(width, height);
    const view = getHomeView(map);
    assert.equal(map._camera.transform.zoom, 12, "calculation must not move the map");
    const transform = map._camera.transform.clone();
    transform.setMaxBounds(new LngLatBounds(...getHomePanBounds(map, view)));
    transform.setMinZoom(view.zoom);
    transform.setPadding(view.padding);
    transform.setCenter(LngLat.convert(view.center));
    transform.setPitch(view.pitch);
    transform.setBearing(view.bearing);
    transform.setZoom(view.zoom);
    const fits = () => coastline.every((corner) => {
      const point = transform.locationToScreenPoint(corner);
      return point.x >= view.padding.left - 0.001 &&
        point.x <= width - view.padding.right + 0.001 &&
        point.y >= view.padding.top - 0.001 &&
        point.y <= height - view.padding.bottom + 0.001;
    });
    assert.ok(fits(), "every island boundary must remain inside the usable screen");
    const projected = coastline.map((point) => transform.locationToScreenPoint(point));
    const left = Math.min(...projected.map(({ x }) => x));
    const right = Math.max(...projected.map(({ x }) => x));
    const top = Math.min(...projected.map(({ y }) => y));
    const bottom = Math.max(...projected.map(({ y }) => y));
    assert.ok(Math.abs((left + right) / 2 - (view.padding.left + width - view.padding.right) / 2) < 0.01,
      "the visible islands must be horizontally centered");
    assert.ok(Math.abs((top + bottom) / 2 - (view.padding.top + height - view.padding.bottom) / 2) < 0.01,
      "the visible islands must be vertically centered");
    assert.ok(
      (right - left) / (width - view.padding.left - view.padding.right) > 0.99 ||
      (bottom - top) / (height - view.padding.top - view.padding.bottom) > 0.99,
      "the coastline must fill at least one dimension, without unused zoom capacity"
    );
    transform.setZoom(view.zoom + 0.01);
    assert.equal(fits(), false, "further zooming must exceed the usable screen");
  });
}

test("reset fit is independent of the previous church camera and padding", () => {
  const map = makeMap(390, 844);
  const home = getHomeView(map);
  map._camera.transform.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });
  map._camera.transform.setCenter(new LngLat(14.51, 35.9));
  map._camera.transform.setZoom(18);
  assert.deepEqual(getHomeView(map), home);
});

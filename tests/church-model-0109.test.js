import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as THREE from "three";
import { churchModel0109 } from "../src/map/church-models/0109/config.js";
import { churchModelRegistry } from "../src/map/church-models/registry.js";
import { disposeModel } from "../src/map/church-models/shared/dispose-model.js";

test("0109 body fits the OSM footprint and its entrance faces the road bend", () => {
  assert.equal(churchModelRegistry.get("0109"), churchModel0109);
  const context = JSON.parse(readFileSync(new URL("../references/map/0109/0109-osm-context.geojson", import.meta.url), "utf8"));
  const corners = context.features.find(({ id }) => id === "67691410-102").geometry.coordinates[0].slice(0, 4);
  const [lng, lat] = churchModel0109.coordinates;
  const metres = ([longitude, latitude]) => new THREE.Vector2(
    (longitude - lng) * 111320 * Math.cos(lat * Math.PI / 180),
    (latitude - lat) * 111320
  );
  const chapel = churchModel0109.createModel();
  chapel.rotation.y = THREE.MathUtils.degToRad(churchModel0109.bearing);
  chapel.updateMatrixWorld(true);
  const body = chapel.getObjectByName("chapel-body");
  const { width, depth } = body.geometry.parameters;
  for (const x of [-width / 2, width / 2]) {
    for (const z of [-depth / 2, depth / 2]) {
      const world = body.localToWorld(new THREE.Vector3(x, 0, z));
      const position = new THREE.Vector2(world.x, -world.z);
      assert.ok(corners.some((corner) => metres(corner).distanceTo(position) < 0.2), "body corner must match the map footprint");
    }
  }
  const front = chapel.getObjectByName("main-entrance").getWorldPosition(new THREE.Vector3());
  const heading = new THREE.Vector2(front.x, -front.z).normalize();
  const junction = metres([14.4375908375, 35.8971723424]).normalize();
  assert.ok(heading.dot(junction) > 0.65, "entrance must face toward the NW junction");
  const tower = chapel.getObjectByName("rear-belfry").getWorldPosition(new THREE.Vector3());
  assert.ok(tower.x > 0 && tower.z < 0, "belfry must lie at the NE rear");
  const bounds = new THREE.Box3().setFromObject(chapel);
  assert.ok(bounds.max.y > 18 && bounds.max.y < 21);
  chapel.traverse((node) => {
    if (!node.isMesh) return;
    assert.ok(Array.from(node.geometry.attributes.position.array).every(Number.isFinite));
  });
  disposeModel(chapel);
});

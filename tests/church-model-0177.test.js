import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as THREE from "three";
import { churchModel0177 } from "../src/map/church-models/0177/config.js";
import { churchModelRegistry } from "../src/map/church-models/registry.js";
import { disposeModel } from "../src/map/church-models/shared/dispose-model.js";

test("0177 fits the map footprint with its entrance SE, tower left and dome at the rear", () => {
  assert.equal(churchModelRegistry.get("0177"), churchModel0177);
  const context = JSON.parse(readFileSync(new URL("../references/map/0177-osm-context.geojson", import.meta.url), "utf8"));
  const corners = context.features.find(({ id }) => id === "35098320-281").geometry.coordinates[0].slice(0, 4);
  const [lng, lat] = churchModel0177.coordinates;
  const metres = ([longitude, latitude]) => new THREE.Vector2(
    (longitude - lng) * 111320 * Math.cos(lat * Math.PI / 180),
    (latitude - lat) * 111320
  );
  const church = churchModel0177.createModel();
  church.rotation.y = THREE.MathUtils.degToRad(churchModel0177.bearing);
  church.updateMatrixWorld(true);
  const body = church.getObjectByName("church-body");
  const { width, depth } = body.geometry.parameters;
  for (const x of [-width / 2, width / 2]) {
    for (const z of [-depth / 2, depth / 2]) {
      const world = body.localToWorld(new THREE.Vector3(x, 0, z));
      assert.ok(corners.some((corner) => metres(corner).distanceTo(new THREE.Vector2(world.x, -world.z)) < 0.8));
    }
  }
  const entrance = church.getObjectByName("main-entrance").getWorldPosition(new THREE.Vector3());
  assert.ok(entrance.x > 0 && entrance.z > 0, "entrance must face SE onto Republic Street");
  const dome = church.getObjectByName("rear-dome");
  assert.ok(dome.position.x > 0, "dome must be behind the nave");
  const tower = church.getObjectByName("front-left-bell-tower");
  assert.ok(tower.position.x < -15 && tower.position.z < -depth / 2, "tower must adjoin the facade on the viewer's left");
  const bounds = new THREE.Box3().setFromObject(church);
  assert.ok(bounds.min.y >= -0.01 && bounds.max.y > 24 && bounds.max.y < 26);
  let triangles = 0;
  church.traverse((node) => {
    if (!node.isMesh) return;
    assert.ok(Array.from(node.geometry.attributes.position.array).every(Number.isFinite));
    triangles += (node.geometry.index?.count ?? node.geometry.attributes.position.count) / 3;
  });
  assert.ok(triangles < 30000, "model should stay lightweight for the shared map renderer");
  disposeModel(church);
});

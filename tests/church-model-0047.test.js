import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as THREE from "three";
import { churchModel0047 } from "../src/map/church-models/0047/config.js";
import { churchModelRegistry } from "../src/map/church-models/registry.js";
import { disposeModel } from "../src/map/church-models/shared/dispose-model.js";

test("0047 fits its footprint with twin front towers, an SE entrance and a dome behind the facade", () => {
  assert.equal(churchModelRegistry.get("0047"), churchModel0047);
  const context = JSON.parse(readFileSync(new URL("../references/map/0047/0047-osm-context.geojson", import.meta.url), "utf8"));
  const corners = context.features.find(({ id }) => id === "35098320-79").geometry.coordinates[0].slice(0, 4);
  const [lng, lat] = churchModel0047.coordinates;
  const metres = ([longitude, latitude]) => new THREE.Vector2(
    (longitude - lng) * 111320 * Math.cos(lat * Math.PI / 180),
    (latitude - lat) * 111320
  );
  const church = churchModel0047.createModel();
  church.rotation.y = THREE.MathUtils.degToRad(churchModel0047.bearing);
  church.updateMatrixWorld(true);
  const body = church.getObjectByName("church-body");
  const { width, depth } = body.geometry.parameters;
  for (const x of [-width / 2, width / 2]) {
    for (const z of [-depth / 2, depth / 2]) {
      const world = body.localToWorld(new THREE.Vector3(x, 0, z));
      assert.ok(corners.some((corner) => metres(corner).distanceTo(new THREE.Vector2(world.x, -world.z)) < 0.8), "body must fit the mapped rectangle");
    }
  }
  const entrance = church.getObjectByName("main-entrance").getWorldPosition(new THREE.Vector3());
  assert.ok(entrance.x > 0 && entrance.z > 0, "entrance must face Old Bakery Street to the SE");
  const left = church.getObjectByName("left-bell-tower");
  const right = church.getObjectByName("right-bell-tower");
  assert.ok(left.position.x < -15 && right.position.x === left.position.x);
  assert.equal(left.position.z, -right.position.z);
  const dome = church.getObjectByName("front-octagonal-dome");
  assert.ok(dome.position.x > left.position.x + 8 && dome.position.x < 0, "dome must sit immediately behind the front, ahead of the rear roof");
  const bounds = new THREE.Box3().setFromObject(church);
  assert.ok(bounds.min.y >= -0.01 && bounds.max.y > 32 && bounds.max.y < 35);
  let triangles = 0;
  church.traverse((node) => {
    if (!node.isMesh) return;
    assert.ok(Array.from(node.geometry.attributes.position.array).every(Number.isFinite));
    triangles += (node.geometry.index?.count ?? node.geometry.attributes.position.count) / 3;
  });
  assert.ok(triangles < 35000, "geometry must remain lightweight for the map renderer");
  disposeModel(church);
});

import assert from "node:assert/strict";
import test from "node:test";
import { getNightAmount, getSolarAltitude } from "../src/map/daylight.js";
import { getMapNightAmount, initialiseMapAtmosphere } from "../src/map/map-atmosphere.js";

test("Malta has full daylight at local noon and full night at midnight in both seasons", () => {
  for (const time of ["2026-06-21T12:00:00+02:00", "2026-12-21T12:00:00+01:00"]) {
    assert.equal(getNightAmount(new Date(time)), 0);
  }
  for (const time of ["2026-06-21T00:00:00+02:00", "2026-12-21T00:00:00+01:00"]) {
    assert.equal(getNightAmount(new Date(time)), 1);
  }
  assert.ok(getSolarAltitude(new Date("2026-06-21T11:00:00Z")) > 70);
  assert.ok(getSolarAltitude(new Date("2026-12-21T11:00:00Z")) < 32);
});

test("autumn sunset fades gradually through twilight", () => {
  const amounts = ["16:00", "16:30", "17:00", "17:30"].map((time) =>
    getNightAmount(new Date(`2026-10-03T${time}:00Z`))
  );
  assert.equal(amounts[0], 0);
  assert.ok(amounts[1] > 0 && amounts[1] < amounts[2]);
  assert.ok(amounts[2] < 1);
  assert.equal(amounts[3], 1);
  const now = new Date("2026-10-03T16:45:00Z");
  assert.ok(Math.abs(getNightAmount(now) - getNightAmount(new Date(now.getTime() + 60_000))) < 0.04);
});

test("identical instants produce identical lighting across timezone and DST representations", () => {
  assert.equal(
    getNightAmount(new Date("2026-10-03T18:30:00+02:00")),
    getNightAmount(new Date("2026-10-03T16:30:00Z"))
  );
  for (const time of ["2024-02-29T12:00:00Z", "2026-03-29T12:00:00Z", "2026-10-25T12:00:00Z"]) {
    assert.equal(getNightAmount(new Date(time)), 0);
  }
});

test("map atmosphere refreshes after sleep, restores daylight, and cleans up on removal", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-03T00:00:00Z").getTime() });
  let intervalCallback;
  let cleared = false;
  const originalWindow = globalThis.window;
  globalThis.window = {
    setInterval(callback, delay) { intervalCallback = callback; assert.equal(delay, 60_000); return 1; },
    clearInterval(id) { assert.equal(id, 1); cleared = true; }
  };
  t.after(() => { globalThis.window = originalWindow; });
  const listeners = new Map();
  const sideLight = { setAttribute() {}, remove() { this.removed = true; } };
  const ownerDocument = {
    hidden: false,
    createElement: () => sideLight,
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name) => listeners.delete(name)
  };
  const properties = new Map();
  const container = {
    ownerDocument,
    append() {},
    style: {
      setProperty: (name, value) => properties.set(name, value),
      removeProperty: (name) => properties.delete(name)
    }
  };
  const dayLight = { anchor: "map", color: "white", position: [1.15, 210, 30], intensity: 0.5 };
  let light;
  let remove;
  const map = {
    getContainer: () => container,
    getLight: () => dayLight,
    setLight: (value) => { light = value; },
    triggerRepaint() {},
    once(name, callback) { assert.equal(name, "remove"); remove = callback; }
  };
  initialiseMapAtmosphere(map);
  assert.equal(getMapNightAmount(map), 1);
  assert.equal(properties.get("--map-night"), "1");
  assert.equal(light.position[2], 72);
  t.mock.timers.setTime(new Date("2026-10-03T12:00:00Z").getTime());
  listeners.get("visibilitychange")();
  assert.equal(getMapNightAmount(map), 0);
  assert.deepEqual(light, dayLight);
  t.mock.timers.setTime(new Date("2026-10-03T23:00:00Z").getTime());
  intervalCallback();
  assert.equal(getMapNightAmount(map), 1);
  remove();
  assert.ok(cleared && sideLight.removed);
  assert.equal(listeners.size, 0);
  assert.equal(properties.size, 0);
  assert.equal(getMapNightAmount(map), 0);
});

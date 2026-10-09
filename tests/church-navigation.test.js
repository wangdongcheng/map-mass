import assert from "node:assert/strict";
import test from "node:test";
import { createChurchNavigation } from "../src/ui/church-navigation.js";

function setup(t, { path = "/", reducedMotion = false } = {}) {
  const previousWindow = globalThis.window;
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  });
  const listeners = new Map();
  const history = [];
  const shown = [];
  const closed = [];
  const window = {
    location: { pathname: path },
    matchMedia: () => ({ matches: reducedMotion }),
    addEventListener: (type, handler) => listeners.set(type, handler),
    removeEventListener: (type, handler) => {
      if (listeners.get(type) === handler) listeners.delete(type);
    },
    history: Object.fromEntries(["pushState", "replaceState"].map((method) => [
      method,
      (state, title, pathname) => {
        history.push({ method, state, pathname });
        window.location.pathname = pathname;
      }
    ]))
  };
  globalThis.window = window;
  const churches = [
    { id: "0001", coordinates: [14.5, 35.9] },
    { id: "0002", coordinates: [14.4, 35.8] }
  ];
  const controllers = new Map(churches.map(({ id }) => [id, {
    showDetails: () => shown.push(id),
    close: () => closed.push(id)
  }]));
  const map = {
    getMaxZoom: () => 20,
    flyTo(options) { this.flight = options; },
    easeTo(options) { this.home = options; },
    once(type, handler) { this.onRemove = handler; }
  };
  const homeView = { center: [14.385, 35.94], zoom: 10.45 };
  const navigation = createChurchNavigation(map, churches, controllers, () => ({ ...homeView }));
  return { navigation, map, churches, controllers, shown, closed, history, listeners, window, homeView };
}

test("selecting a church shows its card, moves the map and updates URL once", (t) => {
  const f = setup(t);
  assert.equal(f.navigation.selectChurch("0001"), true);
  assert.deepEqual(f.shown, ["0001"]);
  assert.deepEqual(f.map.flight.center, f.churches[0].coordinates);
  assert.equal(f.map.flight.zoom, 20);
  assert.equal(f.map.flight.duration, 1600);
  assert.deepEqual(f.history[0], {
    method: "pushState", state: { churchId: "0001" }, pathname: "/0001"
  });
  f.navigation.selectChurch("0001");
  assert.equal(f.history.length, 1);
});

test("deep links with a trailing slash restore selection without adding history", (t) => {
  const f = setup(t, { path: "/0002/" });
  f.navigation.applyPath();
  assert.deepEqual(f.shown, ["0002"]);
  assert.equal(f.history.length, 0);
  assert.equal(f.window.location.pathname, "/0002/");
});

test("invalid routes return home and replace the invalid URL", (t) => {
  const f = setup(t, { path: "/9999" });
  f.navigation.applyPath();
  assert.deepEqual(f.closed, ["0001", "0002"]);
  assert.deepEqual(f.map.home, { ...f.homeView, duration: 900 });
  assert.equal(f.history[0].method, "replaceState");
  assert.equal(f.window.location.pathname, "/");
});

test("home closes all details and can preserve the existing URL", (t) => {
  const f = setup(t, { path: "/0001" });
  f.navigation.showHome({ updateUrl: false });
  assert.deepEqual(f.closed, ["0001", "0002"]);
  assert.equal(f.window.location.pathname, "/0001");
  f.navigation.showHome();
  assert.equal(f.window.location.pathname, "/");
  assert.equal(f.history.length, 1);
});

test("browser history restores the view and listener is removed with the map", (t) => {
  const f = setup(t, { path: "/0002" });
  f.listeners.get("popstate")();
  assert.deepEqual(f.shown, ["0002"]);
  f.window.location.pathname = "/";
  f.listeners.get("popstate")();
  assert.deepEqual(f.closed, ["0001", "0002"]);
  assert.equal(f.history.length, 0);
  f.map.onRemove();
  assert.equal(f.listeners.has("popstate"), false);
});

test("reduced-motion selection works even without a marker controller", (t) => {
  const f = setup(t, { reducedMotion: true });
  f.controllers.delete("0001");
  f.navigation.selectChurch("0001");
  assert.equal(f.map.flight.duration, 0);
  assert.equal(f.map.flight.essential, false);
  assert.equal(f.window.location.pathname, "/0001");
});

test("unknown church selection leaves map and URL unchanged", (t) => {
  const f = setup(t);
  assert.equal(f.navigation.selectChurch("9999"), false);
  assert.equal(f.map.flight, undefined);
  assert.equal(f.history.length, 0);
  assert.equal(f.shown.length, 0);
});

test("reset recalculates home for the current viewport", (t) => {
  const f = setup(t);
  f.navigation.showHome();
  f.homeView.zoom = 9.6;
  f.homeView.center = [14.38, 35.935];
  f.navigation.showHome();
  assert.deepEqual(f.map.home, { ...f.homeView, duration: 900 });
});

import assert from "node:assert/strict";
import test from "node:test";
import { getChurchesInView, getMapListEntries } from "../src/data/map-church-list.js";
import { createChurchFilterStore, filterChurches } from "../src/data/church-filters.js";

const filters = { language: "", region: "", dayMode: "any", date: "", from: "", to: "", showNoMass: false };
const mass = (day, time, language = "English") => ({ day, time, language });
const church = (id, coordinates, masses) => ({ id, name: id, coordinates, masses, hasMassTimes: masses.length > 0 });
const churches = [
  church("west", [14.2, 36.1], [mass("Friday", "09:00"), mass("Saturday", "08:00")]),
  church("east", [14.5, 35.9], [mass("Friday", "10:00"), mass("Friday", "08:00", "Maltese")]),
  church("empty", [14.4, 35.9], [])
];
const now = new Date("2026-10-09T07:30:00Z"); // 09:30 in Malta.

test("no-Mass toggle refreshes the region and viewport list while retaining empty schedules", () => {
  const store = createChurchFilterStore(churches);
  const updates = [];
  const unsubscribe = store.subscribe(snapshot => {
    const visible = getChurchesInView(snapshot.churches, () => ({ x: 50, y: 50 }), { width: 100, height: 100 });
    updates.push(getMapListEntries(visible, snapshot.filters, now));
  });
  store.update({ region: "malta" });
  store.update({ showNoMass: true });
  store.update({ showNoMass: false });
  assert.deepEqual(updates.map(entries => entries.map(entry => entry.church.id)), [["east"], ["east", "empty"], ["east"]]);
  assert.equal(updates[1][0].church.hasMassTimes, true);
  assert.equal(updates[1][1].church.hasMassTimes, false);
  assert.deepEqual(updates[1][1].times, []);
  unsubscribe();
});

test("viewport membership follows screen projection for a pitched and rotated map", () => {
  const positions = new Map([[churches[0].coordinates, { x: -1, y: 100 }], [churches[1].coordinates, { x: 390, y: 844 }], [churches[2].coordinates, { x: 80, y: -5 }]]);
  assert.deepEqual(getChurchesInView(churches, coordinates => positions.get(coordinates), { width: 390, height: 844 }).map(c => c.id), ["east"]);
  positions.set(churches[0].coordinates, { x: 0, y: 0 });
  positions.set(churches[1].coordinates, { x: Infinity, y: 10 });
  assert.deepEqual(getChurchesInView(churches, coordinates => positions.get(coordinates), { width: 390, height: 844 }).map(c => c.id), ["west"]);
  assert.deepEqual(getChurchesInView(churches, () => ({ x: 0, y: 0 }), { width: 0, height: 0 }), []);
});

test("default list orders churches by next Mass and retains churches without listed times", () => {
  const entries = getMapListEntries(churches, filters, now);
  assert.deepEqual(entries.map(e => e.church.id), ["east", "west", "empty"]);
  assert.equal(entries[0].times[0].mass.time, "10:00");
  assert.equal(entries[1].times[0].dayOffset, 1);
  assert.equal(entries[1].times.at(-1).dayOffset, 7);
  assert.deepEqual(entries[2].times, []);
});

test("selected date lists matching sessions including earlier hours without shifting them a week", () => {
  const dateFilters = { ...filters, dayMode: "date", date: "2026-10-09", language: "English" };
  const entries = getMapListEntries(filterChurches(churches, dateFilters, now), dateFilters, now);
  assert.deepEqual(entries.map(e => e.church.id), ["west", "east"]);
  assert.equal(entries[0].times[0].date, "2026-10-09");
  assert.equal(entries[0].times[0].mass.time, "09:00");
  assert.equal(entries[0].times[0].dayOffset, 0);
  assert.ok(entries.every(e => e.times.every(t => t.mass.language === "English" && t.mass.day === "Friday")));
});

test("list sorting handles unpadded hours and input schedules stay unchanged", () => {
  const source = [church("hours", [14, 36], [mass("Friday", "10:00"), mass("Friday", "9:00")])];
  const entries = getMapListEntries(source, { ...filters, dayMode: "today" }, now);
  assert.deepEqual(entries[0].times.map(t => t.mass.time), ["9:00", "10:00"]);
  assert.equal(source[0].masses[0].time, "10:00");
});

import assert from "node:assert/strict";
import test from "node:test";
import { createChurchFilterStore, filterChurches, getDateDay, getFilterDate, getMaltaDate, getFilterError } from "../src/data/church-filters.js";

const base = { language: "", region: "", dayMode: "any", date: "", from: "", to: "", showNoMass: false };
const mass = (day, time, language) => ({ day, time, language });
const church = (id, latitude, masses) => ({ id, name: id, coordinates: [14.3, latitude], hasMassTimes: masses.length > 0, masses });
const churches = [
  church("malta", 35.9, [mass("Friday", "08:00", "English"), mass("Friday", "18:00", "Maltese"), mass("Sunday", "18:00", "English")]),
  church("gozo", 36.04, [mass("Friday", "18:00", "English"), mass("Friday", "20:00", "English")]),
  church("comino", 36.015, [mass("Saturday", "17:00", "Maltese")]),
  church("empty", 35.9, [])
];
const friday = new Date("2026-10-09T12:00:00Z");

test("language, date and time must match the same Mass", () => {
  const matches = filterChurches(churches, { ...base, language: "English", dayMode: "date", date: "2026-10-09", from: "17", to: "19" }, friday);
  assert.deepEqual(matches.map(c => c.id), ["gozo"]);
  assert.deepEqual(matches[0].masses, [mass("Friday", "18:00", "English")]);
  assert.equal(churches[1].masses.length, 2, "filtering preserves the full source schedule");
});

test("today uses the Malta calendar through midnight and DST", () => {
  assert.equal(getMaltaDate(new Date("2026-10-09T22:30:00Z")), "2026-10-10");
  assert.equal(getMaltaDate(new Date("2026-01-09T23:30:00Z")), "2026-01-10");
  assert.deepEqual(filterChurches(churches, { ...base, dayMode: "today" }, new Date("2026-10-09T22:30:00Z")).map(c => c.id), ["comino"]);
});

test("a selected date matches its weekly day, including a future date", () => {
  assert.equal(getDateDay("2026-10-18"), "Sunday");
  assert.equal(getDateDay("2026-02-30"), null);
  assert.deepEqual(filterChurches(churches, { ...base, dayMode: "date", date: "2026-10-18" }, friday).map(c => c.id), ["malta"]);
});

test("tomorrow follows the Malta date across month, year and DST boundaries", () => {
  const filters = { ...base, dayMode: "tomorrow" };
  assert.equal(getFilterDate(filters, friday), "2026-10-10");
  assert.deepEqual(filterChurches(churches, filters, friday).map(c => c.id), ["comino"]);
  assert.equal(getFilterDate(filters, new Date("2026-10-31T23:30:00Z")), "2026-11-02");
  assert.equal(getFilterDate(filters, new Date("2026-12-31T12:00:00Z")), "2027-01-01");
  assert.equal(getFilterDate(filters, new Date("2026-03-28T23:30:00Z")), "2026-03-30");
});

test("next Sunday uses the nearest Sunday, including today when it is Sunday", () => {
  const filters = { ...base, dayMode: "next-sunday" };
  assert.equal(getFilterDate(filters, friday), "2026-10-11");
  assert.equal(getFilterDate(filters, new Date("2026-10-11T12:00:00Z")), "2026-10-11");
  assert.equal(getFilterDate(filters, new Date("2026-10-10T22:30:00Z")), "2026-10-11");
  assert.equal(getFilterDate(filters, new Date("2026-10-12T12:00:00Z")), "2026-10-18");
  assert.deepEqual(filterChurches(churches, filters, friday).map(c => c.id), ["malta"]);
});

test("island filters include Comino with Gozo and respect churches without times", () => {
  assert.deepEqual(filterChurches(churches, { ...base, region: "gozo" }).map(c => c.id), ["gozo", "comino"]);
  assert.deepEqual(filterChurches(churches, { ...base, region: "malta", showNoMass: true }).map(c => c.id), ["malta", "empty"]);
  assert.ok(!filterChurches(churches, { ...base, language: "English", showNoMass: true }).some(c => c.id === "empty"));
});

test("time bounds are inclusive and either bound may be omitted", () => {
  assert.deepEqual(filterChurches(churches, { ...base, from: "20" }).map(c => c.id), ["gozo"]);
  const matches = filterChurches(churches, { ...base, to: "08" });
  assert.deepEqual(matches.map(c => c.id), ["malta"]);
  assert.equal(matches[0].masses.length, 1);
  assert.deepEqual(filterChurches(churches, { ...base, from: "18", to: "19", dayMode: "today" }, friday).map(c => c.id), ["malta", "gozo"]);
});

test("invalid dates, equal or reversed hours report errors and return no results", () => {
  for (const patch of [{ dayMode: "date", date: "" }, { dayMode: "date", date: "2026-02-30" }, { from: "18", to: "08" }, { from: "18", to: "18" }, { from: "24" }, { to: "08:30" }]) {
    const filters = { ...base, ...patch };
    assert.ok(getFilterError(filters));
    assert.deepEqual(filterChurches(churches, filters), []);
  }
});

test("hour bounds preserve Mass minutes and support the 00 and 23 limits", () => {
  const late = church("late", 35.9, [mass("Friday", "00:00", "English"), mass("Friday", "22:30", "English"), mass("Friday", "23:00", "English"), mass("Friday", "23:30", "English")]);
  assert.equal(getFilterError({ ...base, from: "00", to: "23" }), "");
  assert.deepEqual(filterChurches([late], { ...base, from: "00", to: "23" })[0].masses.map(m => m.time), ["00:00", "22:30", "23:00"]);
  assert.deepEqual(filterChurches([late], { ...base, from: "23" })[0].masses.map(m => m.time), ["23:00", "23:30"]);
});

test("store publishes one shared result, clears filters, and releases subscriptions", () => {
  const store = createChurchFilterStore(churches);
  const snapshots = [];
  const unsubscribe = store.subscribe(snapshot => snapshots.push(snapshot));
  store.update({ region: "gozo" });
  assert.deepEqual(snapshots.at(-1).churches.map(c => c.id), ["gozo", "comino"]);
  store.update({ showNoMass: true });
  store.clear();
  assert.deepEqual(snapshots.at(-1).churches.map(c => c.id), churches.map(c => c.id));
  assert.equal(snapshots.at(-1).filters.region, "");
  const count = snapshots.length;
  unsubscribe(); store.refresh();
  assert.equal(snapshots.length, count);
});

import assert from "node:assert/strict";
import test from "node:test";
import { getMassesInProgress } from "../src/data/current-mass.js";

const mass = { day: "Monday", time: "10:00", language: "English" };

test("remaining pie shrinks from full to half to the final minute", () => {
  for (const [utcTime, minutes, fraction] of [
    ["08:00", 60, 1],
    ["08:30", 30, 0.5],
    ["08:59", 1, 1 / 60]
  ]) {
    const current = getMassesInProgress(
      [mass],
      new Date(`2026-09-28T${utcTime}:00Z`)
    );
    assert.equal(current.masses.length, 1);
    assert.equal(current.remainingMinutes, minutes);
    assert.equal(current.remainingFraction, fraction);
  }
});

test("there is no remaining slice before the start or at the end", () => {
  for (const utcTime of ["07:59", "09:00"]) {
    const current = getMassesInProgress(
      [mass],
      new Date(`2026-09-28T${utcTime}:00Z`)
    );
    assert.equal(current.masses.length, 0);
    assert.equal(current.remainingMinutes, 0);
    assert.equal(current.remainingFraction, 0);
  }
});

test("overlapping Masses show the time until the earliest ending Mass", () => {
  const current = getMassesInProgress(
    [mass, { ...mass, time: "10:30" }, { ...mass, language: "Maltese" }],
    new Date("2026-09-28T08:45:00Z")
  );
  assert.equal(current.masses.length, 3);
  assert.equal(current.remainingMinutes, 15);
  assert.equal(current.remainingFraction, 0.25);
});

test("remaining time follows Malta local time in winter too", () => {
  const current = getMassesInProgress(
    [mass],
    new Date("2026-01-05T09:30:00Z")
  );
  assert.equal(current.remainingMinutes, 30);
  assert.equal(current.remainingFraction, 0.5);
});

test("invalid times and other weekdays do not contribute to the pie", () => {
  const current = getMassesInProgress(
    [{ ...mass, time: "99:99" }, { ...mass, day: "Tuesday" }],
    new Date("2026-09-28T08:30:00Z")
  );
  assert.equal(current.masses.length, 0);
  assert.equal(current.remainingFraction, 0);
});

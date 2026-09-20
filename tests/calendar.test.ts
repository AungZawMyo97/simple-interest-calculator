import assert from "node:assert/strict";
import test from "node:test";
import { currentMyanmarDate, myanmarCalendar, MIN_YEAR, MAX_YEAR } from "../src/infrastructure/myanmar-calendar";

// Fixtures independently read from the upstream mmcal reference, version 20260909.
test("known modern dates match mmcal", () => {
  for (const [iso, year, month, name] of [
    ["2023-07-18", 1385, 4, "Second Waso"],
    ["2024-04-16", 1385, 13, "Late Tagu"],
    ["2024-04-17", 1386, 1, "Tagu"],
    ["2026-04-01", 1387, 13, "Late Tagu"],
    ["2026-04-17", 1388, 2, "Kason"],
    ["2026-09-20", 1388, 6, "Tawthalin"],
  ] as const) {
    const actual = currentMyanmarDate(new Date(`${iso}T06:00:00Z`));
    assert.equal(actual.year, year, iso); assert.equal(actual.month, month, iso); assert.equal(actual.name, name, iso);
  }
});

test("date defaults use Myanmar midnight, not the host timezone", () => {
  assert.equal(currentMyanmarDate(new Date("2024-04-16T17:29:59Z")).year, 1385);
  assert.equal(currentMyanmarDate(new Date("2024-04-16T17:30:00Z")).year, 1386);
});

test("the current Myanmar date includes the lunar day", () => {
  assert.equal(currentMyanmarDate(new Date("2026-09-20T06:00:00Z")).day, 9);
});

test("valid days follow lunar month lengths and leap days", () => {
  assert.equal(myanmarCalendar.daysInMonth(1386, 3).length, 29);
  assert.equal(myanmarCalendar.daysInMonth(1385, 3).length, 30);
  assert.equal(myanmarCalendar.daysInMonth(1385, 0).length, 30);
  assert.throws(() => myanmarCalendar.daysInMonth(1386, 0), /valid month/);
});

test("date choices exclude days outside the selected Myanmar year", () => {
  assert.deepEqual(myanmarCalendar.daysInMonth(1385, 13), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(myanmarCalendar.daysInMonth(1386, 1)[0], 9);
  assert.deepEqual(myanmarCalendar.daysInMonth(1387, 14), [1]);
  assert.equal(myanmarCalendar.daysInMonth(1388, 2)[0], 2);
});

test("watat years include both Wasos in order", () => {
  const cycle = myanmarCalendar.cycle({ year: 1385, month: 3 }, 4);
  assert.deepEqual(cycle.map((month) => month.name), ["Nayon", "First Waso", "Second Waso", "Wagaung"]);
});

test("common years have one Waso and cannot select First Waso", () => {
  assert.deepEqual(myanmarCalendar.cycle({ year: 1386, month: 3 }, 3).map((month) => month.name), ["Nayon", "Waso", "Wagaung"]);
  assert.throws(() => myanmarCalendar.cycle({ year: 1386, month: 0 }, 1));
});

test("New Year does not charge Late Tagu and Tagu as two different lunar months", () => {
  assert.deepEqual(myanmarCalendar.cycle({ year: 1385, month: 13 }, 2).map(({ year, month }) => [year, month]), [[1385, 13], [1386, 2]]);
});

test("Late Kason across New Year is one month too", () => {
  assert.deepEqual(myanmarCalendar.cycle({ year: 1387, month: 14 }, 2).map(({ year, month }) => [year, month]), [[1387, 14], [1388, 3]]);
  assert.equal(myanmarCalendar.monthsInYear(1388).some(({ month }) => month === 1), false);
});

test("year transitions preserve chronological months", () => {
  const cycle = myanmarCalendar.cycle({ year: 1385, month: 12 }, 3);
  assert.deepEqual(cycle.map(({ year, name }) => [year, name]), [[1385, "Tabaung"], [1385, "Late Tagu"], [1386, "Kason"]]);
});

test("all supported years expose valid, unique months and support a ten-year cycle", () => {
  for (let year = MIN_YEAR; year <= MAX_YEAR; year++) {
    const months = myanmarCalendar.monthsInYear(year);
    assert.equal(new Set(months.map((month) => month.month)).size, months.length);
    assert.ok(months.length >= 12 && months.length <= 14);
    const cycle = myanmarCalendar.cycle(months[0], 120);
    assert.equal(cycle.length, 120);
    assert.ok(cycle.every((month) => Boolean(month.name) && Boolean(month.burmese)));
  }
});

test("invalid years and months are rejected", () => {
  for (const year of [MIN_YEAR - 1, MAX_YEAR + 1, 1388.5, NaN]) assert.throws(() => myanmarCalendar.monthsInYear(year));
  assert.throws(() => myanmarCalendar.cycle({ year: 1388, month: 99 }, 6));
});

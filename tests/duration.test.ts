import assert from "node:assert/strict";
import test from "node:test";
import { calculateDuration } from "../src/domain/duration";
import { myanmarCalendar as calendar } from "../src/infrastructure/myanmar-calendar";

test("same day and a partial first month charge one month", () => {
  const start = { year: 1388, month: 6, day: 9 };
  const same = calculateDuration(start, start, calendar);
  assert.equal(same.months, 1);
  assert.equal(same.completedMonths, 0);
  assert.equal(same.remainingDays, 0);
  assert.equal(calculateDuration(start, { ...start, day: 10 }, calendar).months, 1);
});

test("ceiling changes only after a monthly anniversary, using the selected day", () => {
  const start = { year: 1388, month: 5, day: 9 };
  const cases = [
    [8, 1, 0, 28],
    [9, 1, 1, 0],
    [10, 2, 1, 1],
  ];
  for (const [day, months, complete, remaining] of cases) {
    const result = calculateDuration(start, { year: 1388, month: 6, day }, calendar);
    assert.equal(result.months, months);
    assert.equal(result.completedMonths, complete);
    assert.equal(result.remainingDays, remaining);
  }
});

test("29/30-day month ends clamp without permanently moving the anniversary", () => {
  const start = { year: 1388, month: 4, day: 30 };
  assert.equal(calendar.addMonths(start, 1).day, 29);
  assert.equal(calendar.addMonths(start, 2).day, 30);
  assert.equal(calculateDuration(start, { year: 1388, month: 5, day: 29 }, calendar).months, 1);
  assert.equal(calculateDuration(start, { year: 1388, month: 6, day: 1 }, calendar).months, 2);
});

test("both Wasos count as real months", () => {
  const start = { year: 1385, month: 3, day: 10 };
  const result = calculateDuration(start, { year: 1385, month: 5, day: 10 }, calendar);
  assert.equal(result.months, 3);
  assert.deepEqual(result.periods.map((period) => period.start.name), ["Nayon", "First Waso", "Second Waso"]);
});

test("New Year inside Tagu or Kason does not introduce another lunar month", () => {
  const start = { year: 1385, month: 13, day: 8 };
  assert.equal(calculateDuration(start, { year: 1386, month: 1, day: 9 }, calendar).remainingDays, 1);
  assert.equal(calculateDuration(start, { year: 1386, month: 2, day: 8 }, calendar).months, 1);
  assert.equal(calculateDuration(start, { year: 1386, month: 2, day: 9 }, calendar).months, 2);
  assert.equal(calculateDuration({ year: 1387, month: 14, day: 1 }, { year: 1388, month: 2, day: 2 }, calendar).remainingDays, 1);
});

test("reversed dates and invalid days are rejected", () => {
  assert.throws(() => calculateDuration({ year: 1388, month: 6, day: 10 }, { year: 1388, month: 6, day: 9 }, calendar), /after/);
  assert.throws(() => calculateDuration({ year: 1388, month: 6, day: 31 }, { year: 1388, month: 7, day: 1 }, calendar), /valid day/);
});

test("120 months is allowed, but one extra day exceeds the supported limit", () => {
  const start = { year: 1380, month: 6, day: 9 };
  const end = calendar.addMonths(start, 120);
  assert.equal(calculateDuration(start, end, calendar).months, 120);
  assert.throws(() => calculateDuration(start, { ...end, day: end.day + 1 }, calendar), /120-month/);
});

test("the final selectable year supports anniversary boundaries in the following year", () => {
  const month = calendar.monthsInYear(1500).at(-1)!;
  const days = calendar.daysInMonth(month.year, month.month);
  const date = { ...month, day: days.at(-1)! };
  assert.equal(calculateDuration(date, date, calendar).months, 1);
});

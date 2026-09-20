import assert from "node:assert/strict";
import test from "node:test";
import { calculateInterest } from "../src/domain/interest";
import { calculateLoan } from "../src/application/calculate-loan";
import { myanmarCalendar } from "../src/infrastructure/myanmar-calendar";
import { formatMoney } from "../src/presentation/format";

test("1,000,000 MMK at 3% for six months: 180,000 interest, 1,180,000 total", () => {
  assert.deepEqual(calculateInterest({ principal: "1000000", monthlyRate: "3", months: 6 }), {
    principalMinor: 100_000_000n, monthlyInterestMinor: 3_000_000n,
    interestMinor: 18_000_000n, totalMinor: 118_000_000n,
  });
});

test("one month is charged immediately; interest never compounds", () => {
  assert.equal(calculateInterest({ principal: "100", monthlyRate: "10", months: 1 }).totalMinor, 11_000n);
  assert.equal(calculateInterest({ principal: "100", monthlyRate: "10", months: 12 }).interestMinor, 12_000n);
});

test("zero interest keeps principal unchanged", () => {
  assert.equal(calculateInterest({ principal: "2000.25", monthlyRate: "0", months: 120 }).totalMinor, 200_025n);
});

test("Burmese digits and decimal inputs are accepted without floating-point arithmetic", () => {
  const result = calculateInterest({ principal: "၁၂၃၄၅.၆၇", monthlyRate: "၂.၅", months: 3 });
  assert.equal(result.interestMinor, 92_593n);
  assert.equal(formatMoney(result.totalMinor), "13,271.60");
});

test("half-up rounding happens once for total interest", () => {
  const result = calculateInterest({ principal: "0.50", monthlyRate: "1", months: 3 });
  assert.equal(result.monthlyInterestMinor, 1n);
  assert.equal(result.interestMinor, 2n);
  assert.equal(result.totalMinor, 52n);
});

test("upper bounds remain exact", () => {
  const result = calculateInterest({ principal: "10000000000", monthlyRate: "100", months: 120 });
  assert.equal(formatMoney(result.totalMinor), "1,210,000,000,000");
});

test("invalid amounts and rates are rejected", () => {
  for (const principal of ["", "0", "-1", "NaN", "Infinity", "1e6", "1,000", "1.001", "10000000000.01", "123456789012345678901"]) {
    assert.throws(() => calculateInterest({ principal, monthlyRate: "3", months: 6 }), Error, principal);
  }
  for (const monthlyRate of ["", "-1", "100.01", "3.555", "Infinity"]) {
    assert.throws(() => calculateInterest({ principal: "1000", monthlyRate, months: 6 }), Error, monthlyRate);
  }
});

test("invalid durations are rejected", () => {
  for (const months of [0, -1, 1.5, 121, Infinity, NaN]) {
    assert.throws(() => calculateInterest({ principal: "1000", monthlyRate: "3", months }));
  }
});

test("the loan use case combines calendar and money without off-by-one charges", () => {
  const loan = calculateLoan({ principal: "1000000", monthlyRate: "3", startYear: 1388, startMonth: 6, startDay: 9, calculationDate: { year: 1388, month: 12, day: 9 } }, myanmarCalendar);
  assert.equal(loan.months, 6);
  assert.equal(loan.periods.length, 6);
  assert.equal(loan.startDate.name, "Tawthalin");
  assert.equal(loan.endDate.name, "Tabaung");
  assert.equal(loan.interestMinor, 18_000_000n);
  assert.equal(loan.startDate.day, 9);
});

test("borrowing day changes the ceiling and the interest automatically", () => {
  const input = { principal: "1000000", monthlyRate: "3", startYear: 1388, startMonth: 6, calculationDate: { year: 1388, month: 7, day: 9 } };
  const first = calculateLoan({ ...input, startDay: 8 }, myanmarCalendar);
  const last = calculateLoan({ ...input, startDay: 9 }, myanmarCalendar);
  assert.equal(first.interestMinor, 6_000_000n);
  assert.equal(last.interestMinor, 3_000_000n);
  for (const startDay of [0, 31, 1.5, NaN]) {
    assert.throws(() => calculateLoan({ ...input, startDay }, myanmarCalendar), /valid day/);
  }
  assert.throws(() => calculateLoan({ ...input, startYear: 1386, startMonth: 1, startDay: 1 }, myanmarCalendar), /valid day/);
});

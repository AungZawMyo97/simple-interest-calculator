// Modern-era formulas adapted from Yan Naing Aye's mmcal (MIT).
// See THIRD_PARTY_NOTICES.md. No Gregorian-month approximations are used.
import type { CalendarDate, CalendarDateInput, CalendarMonth, LoanCalendar } from "../domain/calendar";

export const MIN_YEAR = 1350;
export const MAX_YEAR = 1500;
const SOLAR_YEAR = 1577917828 / 4320000;
const LUNAR_MONTH = 1577917828 / 53433336;
const EPOCH = 1954168.050623;

const NAMES = ["First Waso", "Tagu", "Kason", "Nayon", "Waso", "Wagaung", "Tawthalin", "Thadingyut", "Tazaungmon", "Nadaw", "Pyatho", "Tabodwe", "Tabaung", "Late Tagu", "Late Kason"];
const BURMESE = ["ပထမဝါဆို", "တန်ခူး", "ကဆုန်", "နယုန်", "ဝါဆို", "ဝါခေါင်", "တော်သလင်း", "သီတင်းကျွတ်", "တန်ဆောင်မုန်း", "နတ်တော်", "ပြာသို", "တပို့တွဲ", "တပေါင်း", "နှောင်းတန်ခူး", "နှောင်းကဆုန်"];

function watat(year: number) {
  let excess = (SOLAR_YEAR * (year + 3739)) % LUNAR_MONTH;
  if (excess < (SOLAR_YEAR / 12 - LUNAR_MONTH) * 4) excess += LUNAR_MONTH;
  const offset = year === 1377 ? 0.5 : -0.5;
  const fullMoon = Math.round(SOLAR_YEAR * year + EPOCH - excess + 4.5 * LUNAR_MONTH + offset);
  let leap = excess >= LUNAR_MONTH - (SOLAR_YEAR / 12 - LUNAR_MONTH) * 8 ? 1 : 0;
  if (year === 1344 || year === 1345) leap ^= 1;
  return { fullMoon, leap };
}

function yearInfo(year: number) {
  const current = watat(year);
  let distance = 1;
  while (!watat(year - distance).leap && distance < 3) distance++;
  const previous = watat(year - distance);
  const type = current.leap ? Math.floor(((current.fullMoon - previous.fullMoon) % 354) / 31) + 1 : 0;
  return { type, taguStart: previous.fullMoon + 354 * distance - 102 };
}

function fromJulianDay(julianDay: number) {
  const year = Math.floor((julianDay - 0.5 - EPOCH) / SOLAR_YEAR);
  const { type, taguStart } = yearInfo(year);
  const big = Math.floor(type / 2);
  const common = Math.floor(1 / (type + 1));
  const yearLength = 354 + (1 - common) * 30 + big;
  let days = julianDay - taguStart + 1;
  const late = Math.floor((days - 1) / yearLength);
  days -= late * yearLength;
  const adjustment = Math.floor((days + 423) / 512);
  let month = Math.floor((days - big * adjustment + common * adjustment * 30 + 29.26) / 29.544);
  const e = Math.floor((month + 12) / 16);
  const f = Math.floor((month + 11) / 16);
  const day = days - Math.floor(29.544 * month - 29.26) - big * e + common * f * 30;
  month += f * 3 - e * 4 + 12 * late;
  return { year, month, day, type };
}

function describe(date: ReturnType<typeof fromJulianDay>): CalendarMonth {
  const secondWaso = date.month === 4 && date.type > 0;
  return {
    year: date.year,
    month: date.month,
    name: secondWaso ? "Second Waso" : NAMES[date.month],
    burmese: secondWaso ? "ဒုတိယဝါဆို" : BURMESE[date.month],
  };
}

function firstDayOfYear(year: number) {
  return Math.ceil(SOLAR_YEAR * year + EPOCH + 0.5);
}

function assertYear(year: number, maximum = MAX_YEAR) {
  if (!Number.isInteger(year) || year < MIN_YEAR || year > maximum) {
    throw new Error(`Myanmar year must be between ${MIN_YEAR} and ${MAX_YEAR} ME.`);
  }
}

/** Select real solar-year month labels, including late Tagu/Kason when present. */
function monthStarts(year: number, maximum = MAX_YEAR) {
  assertYear(year, maximum);
  const starts: { julianDay: number; date: ReturnType<typeof fromJulianDay> }[] = [];
  let previousMonth = -1;
  for (let julianDay = firstDayOfYear(year); julianDay < firstDayOfYear(year + 1); julianDay++) {
    const date = fromJulianDay(julianDay);
    if (date.month !== previousMonth) {
      starts.push({ julianDay, date });
      previousMonth = date.month;
    }
  }
  return starts;
}

function monthLength(date: ReturnType<typeof fromJulianDay>): number {
  return 30 - (date.month % 2) + (date.month === 3 ? Math.floor(date.type / 2) : 0);
}

function toDayNumber(date: CalendarDateInput): number {
  // Anniversary boundaries may extend beyond the last selectable start/end year.
  const starts = monthStarts(date.year, MAX_YEAR + 10);
  const index = starts.findIndex((item) => item.date.month === date.month);
  if (index < 0) throw new Error("Select a valid month for this Myanmar year.");
  const selected = starts[index];
  const end = starts[index + 1]?.julianDay ?? firstDayOfYear(date.year + 1);
  const julianDay = selected.julianDay + date.day - selected.date.day;
  if (!Number.isInteger(date.day) || julianDay < selected.julianDay || julianDay >= end) {
    throw new Error("Select a valid day for this Myanmar month and year.");
  }
  return julianDay;
}

export const myanmarCalendar: LoanCalendar = {
  toDayNumber,
  addMonths(date, count) {
    if (!Number.isInteger(count) || count < 0 || count > 120) {
      throw new Error("Month offset must be a whole number from 0 to 120.");
    }
    const julianDay = toDayNumber(date);
    let monthStart = julianDay - date.day + 1;
    for (let offset = 0; offset < count; offset++) {
      monthStart += monthLength(fromJulianDay(monthStart));
    }
    // Always anchor to the original day: day 30 becomes 29 in a short month,
    // then returns to day 30 in the next long month. New Year is not a new month.
    const targetDay = Math.min(date.day, monthLength(fromJulianDay(monthStart)));
    const target = fromJulianDay(monthStart + targetDay - 1);
    return { ...describe(target), day: target.day };
  },
  monthsInYear(year) {
    return monthStarts(year).map(({ date }) => describe(date));
  },
  daysInMonth(year, month) {
    const starts = monthStarts(year);
    const index = starts.findIndex(({ date }) => date.month === month);
    if (index === -1) throw new Error("Select a valid month for this Myanmar year.");
    const start = starts[index];
    const end = starts[index + 1]?.julianDay ?? firstDayOfYear(year + 1);
    // Only include days belonging to this ME year. New Year can split a month.
    return Array.from({ length: end - start.julianDay }, (_, offset) => start.date.day + offset);
  },
  cycle(start, count) {
    if (!Number.isInteger(count) || count < 1 || count > 120) {
      throw new Error("Duration must be a whole number from 1 to 120 months.");
    }
    const selected = monthStarts(start.year).find(({ date }) => date.month === start.month);
    if (!selected) throw new Error("Select a valid month for this Myanmar year.");
    const result: CalendarMonth[] = [];
    let julianDay = selected.julianDay;
    for (let index = 0; index < count; index++) {
      const date = fromJulianDay(julianDay);
      result.push(describe(date));
      const monthLength = 30 - (date.month % 2) + (date.month === 3 ? Math.floor(date.type / 2) : 0);
      // Skip to the next lunar month, even when New Year falls inside this month.
      julianDay += monthLength - date.day + 1;
    }
    return result;
  },
};

/** Myanmar local civil day, independent of the server/browser timezone. */
export function currentMyanmarDate(now: Date): CalendarDate {
  const julianDay = Math.floor(now.getTime() / 86_400_000 + 2440587.5 + 6.5 / 24 + 0.5);
  const date = fromJulianDay(julianDay);
  return { ...describe(date), day: date.day };
}

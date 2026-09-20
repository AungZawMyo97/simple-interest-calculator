import type { CalendarDate, CalendarMonth } from "../domain/calendar";

const integerFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function formatMoney(minor: bigint): string {
  const whole = integerFormat.format(minor / 100n);
  const fraction = minor % 100n;
  return fraction === 0n ? whole : `${whole}.${fraction.toString().padStart(2, "0")}`;
}

export function formatMonth(month: CalendarMonth): string {
  return `${month.name} ${month.year} ME`;
}

export function formatDate(date: CalendarDate): string {
  return `${date.day} ${formatMonth(date)}`;
}

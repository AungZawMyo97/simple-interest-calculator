import type { CalendarDate, CalendarDateInput, LoanCalendar } from "./calendar";

export interface ChargedPeriod {
  start: CalendarDate;
  end: CalendarDate;
}

/** Ceiling of elapsed lunar months, with one month minimum on the borrowing day. */
export function calculateDuration(
  start: CalendarDateInput,
  end: CalendarDateInput,
  calendar: Pick<LoanCalendar, "toDayNumber" | "addMonths" | "daysInMonth">,
) {
  for (const date of [start, end]) {
    if (!calendar.daysInMonth(date.year, date.month).includes(date.day)) {
      throw new Error("Select a valid day for this Myanmar month and year.");
    }
  }
  const startDay = calendar.toDayNumber(start);
  const endDay = calendar.toDayNumber(end);
  if (startDay > endDay) throw new Error("Borrowing date cannot be after the calculation date.");

  const startDate = calendar.addMonths(start, 0);
  const endDate = calendar.addMonths(end, 0);
  const periods: ChargedPeriod[] = [];
  let previousDate = startDate;
  let previousDay = startDay;

  for (let month = 1; month <= 120; month++) {
    const anniversary = calendar.addMonths(start, month);
    const anniversaryDay = calendar.toDayNumber(anniversary);
    periods.push({ start: previousDate, end: anniversary });
    if (endDay <= anniversaryDay) {
      const completedMonths = endDay === anniversaryDay ? month : month - 1;
      const remainingDays = endDay === anniversaryDay ? 0 : endDay - previousDay;
      const months = Math.max(1, completedMonths + (remainingDays > 0 ? 1 : 0));
      return { months, completedMonths, remainingDays, startDate, endDate, periods };
    }
    previousDate = anniversary;
    previousDay = anniversaryDay;
  }
  throw new Error("The calculated duration exceeds the 120-month limit.");
}

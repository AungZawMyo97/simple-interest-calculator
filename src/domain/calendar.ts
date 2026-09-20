export interface CalendarMonth {
  year: number;
  month: number;
  name: string;
  burmese: string;
}

export interface CalendarDate extends CalendarMonth {
  day: number;
}

export type CalendarDateInput = Pick<CalendarDate, "year" | "month" | "day">;

/** Date selection and chronological month counting, independent of the UI. */
export interface LoanCalendar {
  monthsInYear(year: number): CalendarMonth[];
  daysInMonth(year: number, month: number): number[];
  toDayNumber(date: CalendarDateInput): number;
  addMonths(date: CalendarDateInput, count: number): CalendarDate;
  cycle(start: Pick<CalendarMonth, "year" | "month">, count: number): CalendarMonth[];
}

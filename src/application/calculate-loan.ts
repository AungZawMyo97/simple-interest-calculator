import type { CalendarDateInput, LoanCalendar } from "../domain/calendar";
import { calculateDuration } from "../domain/duration";
import { calculateInterest, type InterestTerms } from "../domain/interest";

export interface LoanInput extends Omit<InterestTerms, "months"> {
  startYear: number;
  startMonth: number;
  startDay: number;
  calculationDate: CalendarDateInput;
}

/** Calendar is injected: the application depends on a small domain contract. */
export function calculateLoan(input: LoanInput, calendar: LoanCalendar) {
  const duration = calculateDuration(
    { year: input.startYear, month: input.startMonth, day: input.startDay },
    input.calculationDate,
    calendar,
  );
  const amounts = calculateInterest({ ...input, months: duration.months });
  return { ...amounts, ...duration };
}

export type LoanResult = ReturnType<typeof calculateLoan>;

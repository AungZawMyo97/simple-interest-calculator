"use client";

import { useState } from "react";
import type { CalendarDate } from "../domain/calendar";
import { normalizeDigits } from "../domain/interest";
import { calculateLoan, type LoanResult } from "../application/calculate-loan";
import { myanmarCalendar } from "../infrastructure/myanmar-calendar";
import { formatDate, formatMoney } from "./format";
import { MyanmarDateFields, type DateSelection } from "./myanmar-date-fields";

export function Calculator({ initialDate }: { initialDate: CalendarDate }) {
  const initialSelection: DateSelection = {
    year: String(initialDate.year), month: initialDate.month, day: initialDate.day,
  };
  const [principal, setPrincipal] = useState("1000000");
  const [rate, setRate] = useState("3");
  const [start, setStart] = useState(initialSelection);
  const [end, setEnd] = useState(initialSelection);

  let result: LoanResult | undefined;
  let error = "";
  try {
    result = calculateLoan({
      principal, monthlyRate: rate,
      startYear: Number(normalizeDigits(start.year)), startMonth: start.month, startDay: start.day,
      calculationDate: { year: Number(normalizeDigits(end.year)), month: end.month, day: end.day },
    }, myanmarCalendar);
  } catch (issue) {
    error = issue instanceof Error ? issue.message : "Please check your entries.";
  }

  function reset() {
    setPrincipal("1000000");
    setRate("3");
    setStart(initialSelection);
    setEnd(initialSelection);
  }

  return (
    <div className="calculator">
      <div className="form-heading">
        <p>Change the example values to calculate.</p>
        <button className="reset-button" onClick={reset} type="button">Reset</button>
      </div>
      <form onSubmit={(event) => event.preventDefault()} aria-label="Loan details" aria-describedby={error ? "input-error" : undefined}>
        <div className="amount-fields">
          <div className="field">
            <label htmlFor="principal">Loan amount <span lang="my">ချေးငွေပမာဏ</span></label>
            <div className="input-with-unit">
              <input id="principal" name="principal" inputMode="decimal" autoComplete="off" spellCheck={false} value={principal} onChange={(event) => setPrincipal(event.target.value)} />
              <span>MMK</span>
            </div>
          </div>
          <div className="field">
            <label htmlFor="rate">Monthly interest rate <span lang="my">လစဉ်အတိုးနှုန်း</span></label>
            <div className="input-with-unit">
              <input id="rate" name="rate" inputMode="decimal" autoComplete="off" value={rate} onChange={(event) => setRate(event.target.value)} />
              <span>%</span>
            </div>
          </div>
        </div>
        <MyanmarDateFields kind="start" value={start} onChange={setStart} />
        <MyanmarDateFields kind="end" value={end} onChange={setEnd} />
        <div className="duration-field">
          <label htmlFor="duration">Loan duration <span lang="my">ချေးငွေကာလ</span></label>
          <output id="duration" className="duration-output" aria-live="polite" aria-describedby="duration-hint">
            {result ? `${result.months} ${result.months === 1 ? "month" : "months"}` : "—"}
          </output>
          <p id="duration-hint" className="field-hint">Calculated automatically. Partial Myanmar months round up; minimum 1 month.</p>
          {result ? <p className="field-hint elapsed-duration">{result.completedMonths} complete {result.completedMonths === 1 ? "month" : "months"} + {result.remainingDays} {result.remainingDays === 1 ? "day" : "days"}</p> : null}
        </div>
        {error ? <p id="input-error" className="error-message" role="alert">{error}</p> : null}
      </form>
      <section className="results" aria-label="Calculation results" aria-live="polite" aria-atomic="true">
        <div className="interest-box">
          <h2>Interest only</h2>
          <strong>{result ? formatMoney(result.interestMinor) : "—"}<small> MMK</small></strong>
        </div>
        <div className="total-box">
          <h2>Total to receive</h2>
          <div className="total-amount">{result ? formatMoney(result.totalMinor) : "—"}<small> MMK</small></div>
          <p>Loan amount + interest</p>
        </div>
      </section>
      {result ? (
        <div className="calendar-summary">
          <p className="borrowing-date-summary">Borrowing date: <strong>{formatDate(result.startDate)}</strong></p>
          <p className="end-date-summary">Calculated through: <strong>{formatDate(result.endDate)}</strong></p>
          <details>
            <summary>View months & calendar notes</summary>
            <p className="field-hint">Charged monthly periods · {result.months} in total. Periods end at the next anniversary; a rounded-up period may end after your chosen end date.</p>
            <ol className="month-list">
              {result.periods.map((period, index) => (
                <li key={index}>{formatDate(period.start)} → {formatDate(period.end)}</li>
              ))}
            </ol>
            <p className="field-hint">Each month ends on the same lunar day in the next Myanmar month, or its last day if shorter. Both Waso months count. New Year within a lunar month adds no extra month.</p>
            <p className="field-hint">Simple interest = loan amount × monthly rate ÷ 100 × rounded-up months. No compounding or extra fees.</p>
          </details>
        </div>
      ) : <p className="field-hint invalid-summary">Enter valid loan details to see your result.</p>}
    </div>
  );
}

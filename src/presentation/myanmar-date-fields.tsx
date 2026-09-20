import { normalizeDigits } from "../domain/interest";
import { MAX_YEAR, MIN_YEAR, myanmarCalendar } from "../infrastructure/myanmar-calendar";

export interface DateSelection {
  year: string;
  month: number;
  day: number;
}

interface DateFieldsProps {
  kind: "start" | "end";
  value: DateSelection;
  onChange: (value: DateSelection) => void;
}

export function MyanmarDateFields({ kind, value, onChange }: DateFieldsProps) {
  const year = Number(normalizeDigits(value.year));
  const validYear = Number.isInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR;
  const months = validYear ? myanmarCalendar.monthsInYear(year) : [];
  const days = months.some((month) => month.month === value.month)
    ? myanmarCalendar.daysInMonth(year, value.month) : [];
  const prefix = kind === "start" ? "Myanmar" : "End";

  function changeYear(nextYearText: string) {
    const nextYear = Number(normalizeDigits(nextYearText));
    if (!Number.isInteger(nextYear) || nextYear < MIN_YEAR || nextYear > MAX_YEAR) {
      onChange({ ...value, year: nextYearText });
      return;
    }
    const available = myanmarCalendar.monthsInYear(nextYear);
    const month = available.some((item) => item.month === value.month)
      ? value.month : available.find((item) => item.month === 4)?.month ?? available[0].month;
    changeMonth(month, nextYearText);
  }

  function changeMonth(month: number, nextYear = value.year) {
    const available = myanmarCalendar.daysInMonth(Number(normalizeDigits(nextYear)), month);
    const day = Math.min(Math.max(value.day, available[0]), available[available.length - 1]);
    onChange({ year: nextYear, month, day });
  }

  return (
    <fieldset className="calendar-date">
      <legend>{kind === "start" ? "Borrowing date" : "Calculate through"} <span lang="my">{kind === "start" ? "ငွေချေးသည့်ရက်စွဲ" : "တွက်ချက်မည့်ရက်စွဲ"}</span></legend>
      <div className="date-fields">
        <div className="field date-month">
          <label htmlFor={`${kind}-month`}>{prefix} month</label>
          <select id={`${kind}-month`} name={`${kind}-month`} value={months.length ? value.month : ""} disabled={!validYear} onChange={(event) => changeMonth(Number(event.target.value))}>
            {months.length ? months.map((month) => <option key={month.month} value={month.month}>{month.name} · {month.burmese}</option>) : <option value="">Enter a valid year</option>}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${kind}-day`}>{prefix} day</label>
          <select id={`${kind}-day`} name={`${kind}-day`} value={days.length ? value.day : ""} disabled={!days.length} onChange={(event) => onChange({ ...value, day: Number(event.target.value) })}>
            {days.length ? days.map((day) => <option key={day} value={day}>{day} · {String(day).replace(/\d/g, (digit) => String.fromCharCode(0x1040 + Number(digit)))}</option>) : <option value="">—</option>}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${kind}-year`}>{prefix} year</label>
          <div className="input-with-unit">
            <input id={`${kind}-year`} name={`${kind}-year`} inputMode="numeric" value={value.year} onChange={(event) => changeYear(event.target.value)} />
            <span>ME</span>
          </div>
        </div>
      </div>
    </fieldset>
  );
}

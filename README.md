# Simple Interest Calculator

A small Next.js + TypeScript application for monthly loans in MMK, using the
Myanmar (Burmese) calendar. Enter a loan amount, monthly rate, borrowing date
(Myanmar day, month, and year), and an end date that defaults to today in Myanmar time.
Duration is calculated automatically and rounded up to whole Myanmar months.
Interest and the total to receive update immediately.

## Run locally

Requires Node.js 22 or later and npm.

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). No database, account, environment
variables, or API keys are required.

```sh
npm test             # Money rules and Myanmar calendar edge cases
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm run build        # Production build
npm start            # Serve the production build
```

Optional browser regression checks (first install Chromium with
`npx playwright install chromium`):

```sh
npm run test:e2e
```

To use an existing Chrome or Edge installation instead, set
`PLAYWRIGHT_CHANNEL=chrome` or `PLAYWRIGHT_CHANNEL=msedge`. The browser checks
cover live updates, invalid inputs, reset, leap-month choices, and mobile layout.
Set `PLAYWRIGHT_BASE_URL` to test an already-running server, such as a production build.

## Calculation rules

```text
Interest = loan amount × (monthly rate / 100) × number of months
Total    = loan amount + interest
```

- The rate is **monthly**. Duration is automatic, with a **minimum of one month**,
  including a loan whose borrowing and end dates are the same.
- **Ceiling rule:** exactly one Myanmar month costs one month; one month plus one
  day costs two. Two months plus any extra days costs three. No manual duration input.
- Monthly anniversaries use the original borrowing day in each subsequent lunar
  month. Day 30 clamps to day 29 in a shorter month and returns to day 30 in a
  later long month. This uses real Myanmar months, not elapsed days divided by 30.
- The summary shows completed months and remaining days, the rounded duration,
  and both selected dates. The end date must not precede the borrowing date.
- Interest is simple: no compounding, repayments, fees, or day-based proration.
- Example: 1,000,000 MMK at 3% for 6 months gives **180,000 MMK interest** and
  **1,180,000 MMK total**.
- Amounts and rates accept English or Burmese digits and up to two decimal places.
  Enter ungrouped numbers, such as `1000000` or `၁၀၀၀၀၀၀`.
- Money uses `bigint` minor units. Total interest is rounded half-up once to
  0.01 MMK.
- Loan amounts must be positive and no more than 10,000,000,000 MMK; rates are
  0–100% per month; calculated durations are limited to 1–120 whole months.
  Longer periods show a validation message instead of being silently capped.

## Myanmar calendar

The calendar adapter uses modern-era formulas from
[Yan Naing Aye’s mmcal](https://github.com/yan9a/mmcal), with its MIT notice in
[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

- Start years: **1350–1500 ME**. The selected year determines available months.
- Watat years include First Waso and Second Waso as separate interest months.
- Late Tagu and Late Kason appear only when they occur in that Myanmar year.
- Day choices respect 29/30-day months, leap days, and Myanmar New Year boundaries.
  Changing the month or year adjusts the day to the nearest valid day if necessary.
- Myanmar New Year can fall inside a lunar month. Crossing New Year within the
  same lunar month does **not** add a month. For example, Late Tagu 8, 1385 to
  Kason 8, 1386 is exactly one month; ending on Kason 9 rounds up to two.
- The initial selection uses the current date in Myanmar time (UTC+06:30),
  computed on each page request. It does not subtract 638 from a Gregorian year.
- Expand the calendar notes to see charged periods, from each anniversary to
  the next (end exclusive). The last charged period may end after your chosen
  end date because of ceiling rounding. These are billing periods, not due dates.

## Architecture

```text
src/
  domain/           Money rules and the minimal LoanCalendar interface
  application/      Calculate-loan use case; calendar supplied as a dependency
  infrastructure/   Myanmar calendar implementation
  presentation/     Interactive form, summary, and formatting
  app/              Next.js routing, server page, metadata, and styles
tests/              Financial and calendar regression tests
```

Dependencies point inward: the domain has no React, Next.js, or infrastructure
imports. The use case depends on a small calendar contract, and the presentation
supplies its implementation. Pure functions have one responsibility; there are no
unnecessary services, repositories, or class hierarchies. This keeps the SOLID and
Clean Architecture boundaries useful without making a small calculator complex.

## Privacy and Git hygiene

Loan entries remain in React state in the browser. They are not sent to an API,
written to a database, stored in local storage, or added to the URL. Reloading
restores the example values. There are no analytics or external font requests.

`.gitignore` excludes environment files, credentials, keys and certificates,
customer-data folders, database files, exports, backups, dependencies, build
output, logs, and local tool settings. Keep any future customer files in `data/`
and secrets in environment files or `secrets/`. A `.gitignore` does not remove
previously tracked secrets; review staged changes before committing.

Commit `package-lock.json` for reproducible installations. This project contains
no required secrets and does not need an `.env` file.

export interface InterestTerms {
  principal: string;
  monthlyRate: string;
  months: number;
}

export interface InterestResult {
  principalMinor: bigint;
  interestMinor: bigint;
  totalMinor: bigint;
  monthlyInterestMinor: bigint;
}

export function normalizeDigits(value: string): string {
  return value.replace(/[၀-၉]/g, (digit) => String(digit.charCodeAt(0) - 0x1040)).trim();
}

/** Parse decimal text directly to integers, avoiding floating-point money arithmetic. */
function parseHundredths(value: string, label: string): bigint {
  const normalized = normalizeDigits(value);
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw new Error(`${label} must be a number with up to 2 decimal places.`);
  }
  if (normalized.length > 20) throw new Error(`${label} is too large.`);
  const [whole, fraction = ""] = normalized.split(".");
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
}

export function calculateInterest(terms: InterestTerms): InterestResult {
  const principalMinor = parseHundredths(terms.principal, "Loan amount");
  const rateHundredths = parseHundredths(terms.monthlyRate, "Monthly rate");
  if (principalMinor <= 0n || principalMinor > 1_000_000_000_000n) {
    throw new Error("Loan amount must be greater than 0 and at most 10,000,000,000 MMK.");
  }
  if (rateHundredths > 10_000n) throw new Error("Monthly rate must be between 0 and 100%.");
  if (!Number.isInteger(terms.months) || terms.months < 1 || terms.months > 120) {
    throw new Error("Duration must be a whole number from 1 to 120 months.");
  }
  // Half-up rounding to 0.01 MMK. Round total interest once, not each month.
  const monthlyNumerator = principalMinor * rateHundredths;
  const interestMinor = (monthlyNumerator * BigInt(terms.months) + 5_000n) / 10_000n;
  return {
    principalMinor,
    interestMinor,
    totalMinor: principalMinor + interestMinor,
    monthlyInterestMinor: (monthlyNumerator + 5_000n) / 10_000n,
  };
}

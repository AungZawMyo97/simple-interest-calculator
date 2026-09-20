import { expect, test, type Page } from "@playwright/test";

async function setDate(page: Page, kind: "start" | "end", year: number, month: number, day: number) {
  const label = kind === "start" ? "Myanmar" : "End";
  await page.getByLabel(`${label} year`, { exact: true }).fill(String(year));
  await page.getByLabel(`${label} month`, { exact: true }).selectOption(String(month));
  await page.getByLabel(`${label} day`, { exact: true }).selectOption(String(day));
}

test("automatic ceiling recalculates when either date changes; reset and validation work", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const total = page.locator(".total-amount");
  const duration = page.getByLabel("Loan duration", { exact: false });
  await expect(total).toContainText("1,030,000");
  await expect(duration).toHaveText("1 month");
  await expect(page.getByRole("textbox", { name: /Loan duration/ })).toHaveCount(0);
  await page.getByLabel("Loan amount", { exact: false }).fill("၂၀၀၀၀၀");
  await page.getByLabel("Monthly interest rate", { exact: false }).fill("၂.၅");
  await setDate(page, "start", 1388, 5, 9);
  await setDate(page, "end", 1388, 6, 10);
  await expect(duration).toHaveText("2 months");
  await expect(page.locator(".elapsed-duration")).toHaveText("1 complete month + 1 day");
  await expect(total).toContainText("210,000");
  await page.getByLabel("End day", { exact: true }).selectOption("9");
  await expect(duration).toHaveText("1 month");
  await expect(total).toContainText("205,000");
  await page.getByLabel("Myanmar day", { exact: true }).selectOption("8");
  await expect(duration).toHaveText("2 months");
  await setDate(page, "end", 1388, 5, 7);
  await expect(page.locator("#input-error")).toContainText("cannot be after");
  await expect(total).toContainText("—");
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(total).toContainText("1,030,000");
  await page.getByLabel("Loan amount", { exact: false }).fill("-1");
  await expect(page.locator("#input-error")).toBeVisible();
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.locator("#input-error")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("leap months and New Year use actual lunar anniversaries", async ({ page }) => {
  await page.goto("/");
  await setDate(page, "start", 1385, 3, 10);
  await setDate(page, "end", 1385, 5, 10);
  await expect(page.getByLabel("Loan duration", { exact: false })).toHaveText("3 months");
  await page.getByText("View months & calendar notes", { exact: true }).click();
  await expect(page.locator(".month-list li")).toHaveCount(3);
  await expect(page.locator(".month-list")).toContainText("First Waso");
  await expect(page.locator(".month-list")).toContainText("Second Waso");
  await setDate(page, "start", 1385, 13, 8);
  await setDate(page, "end", 1386, 2, 8);
  await expect(page.getByLabel("Loan duration", { exact: false })).toHaveText("1 month");
  await page.getByLabel("End day", { exact: true }).selectOption("9");
  await expect(page.getByLabel("Loan duration", { exact: false })).toHaveText("2 months");
});

test("desktop and mobile layouts fit, including large totals", async ({ page }) => {
  await page.goto("/");
  for (const width of [1440, 375, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(page.getByRole("heading", { name: "Total to receive" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/calculator-${width}.png`, fullPage: true });
  }
  await page.getByLabel("Loan amount", { exact: false }).fill("10000000000");
  await page.getByLabel("Monthly interest rate", { exact: false }).fill("100");
  await setDate(page, "start", 1388, 6, 9);
  await setDate(page, "end", 1388, 12, 9);
  await expect(page.locator(".total-amount")).toContainText("70,000,000,000");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("both date selectors adjust invalid days and reset to the initial Myanmar date", async ({ page }) => {
  await page.goto("/");
  const initialDay = await page.getByLabel("Myanmar day", { exact: true }).inputValue();
  for (const kind of ["start", "end"] as const) {
    const prefix = kind === "start" ? "Myanmar" : "End";
    await setDate(page, kind, 1385, 3, 30);
    await page.getByLabel(`${prefix} year`, { exact: true }).fill("1386");
    await expect(page.getByLabel(`${prefix} day`, { exact: true })).toHaveValue("29");
    await page.getByLabel(`${prefix} year`, { exact: true }).fill("");
    await expect(page.getByLabel(`${prefix} day`, { exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(page.getByLabel(`${prefix} day`, { exact: true })).toHaveValue(initialDay);
  }
  await expect(page.locator(".total-amount")).toContainText("1,030,000");
});

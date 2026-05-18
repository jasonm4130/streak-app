import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('onboard → log day → history → stats → export → wipe → back to onboarding', async ({ page, context }) => {
  // Console-error guard: collect every console.error emitted during the run.
  // Dev server (Vite) doesn't register the service worker, so no SW noise to filter.
  // If a real, unavoidable error appears we'd filter it here by exact message + a
  // comment explaining why — currently we expect zero.
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  // Always start clean. Navigate to the app origin so we have IDB access,
  // then delete the database and reload so the app boots from scratch.
  await context.clearCookies();
  await page.goto('/');
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const req = indexedDB.deleteDatabase('streak');
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        req.onblocked = () => resolve();
      }),
  );
  await page.goto('/');

  // Onboarding step 1: weight (NumberInput commits on blur)
  await page.getByTestId('onboarding-weight').fill('100');
  await page.getByTestId('onboarding-weight').press('Tab');
  await page.getByTestId('onboarding-continue').click();

  // Onboarding step 2: marathon date (defaults to DEFAULT_MARATHON_DATE)
  await page.getByTestId('onboarding-done').click();

  // Now on Today — header shows either "Pre-week", "Week N", or "Race complete"
  // Week label is unique: "Pre-week · score N/7", "Week N · day X/7", or "Race complete · day +N".
  // Match the "· score" / "· day" tail to avoid colliding with "weekly photo"/"weekly 2×".
  await expect(page.locator('text=/(Pre-week|Week \\d+|Race complete) ·/').first()).toBeVisible();

  // Log session: done
  await page.getByTestId('bg-done').click();

  // Log sleep — NumberInput commits on blur, so press Tab after fill
  await page.getByTestId('today-sleep').fill('8');
  await page.getByTestId('today-sleep').press('Tab');

  // Log weight
  await page.getByTestId('today-weight').fill('99.5');
  await page.getByTestId('today-weight').press('Tab');

  // Log protein
  await page.getByTestId('today-protein').fill('180');
  await page.getByTestId('today-protein').press('Tab');

  // Toggles: hydration, mobility, reading
  await page.getByTestId('today-hydration').click();
  await page.getByTestId('today-mobility').click();
  await page.getByTestId('today-reading').click();

  // Confirm toggles are on
  await expect(page.getByTestId('today-hydration')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('today-mobility')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('today-reading')).toHaveAttribute('aria-pressed', 'true');

  // Reload — data should survive
  await page.reload();
  // Week label is unique: "Pre-week · score N/7", "Week N · day X/7", or "Race complete · day +N".
  // Match the "· score" / "· day" tail to avoid colliding with "weekly photo"/"weekly 2×".
  await expect(page.locator('text=/(Pre-week|Week \\d+|Race complete) ·/').first()).toBeVisible();
  await expect(page.getByTestId('today-sleep')).toHaveValue('8');
  await expect(page.getByTestId('today-weight')).toHaveValue('99.5');
  await expect(page.getByTestId('today-protein')).toHaveValue('180');
  await expect(page.getByTestId('bg-done')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('today-hydration')).toHaveAttribute('aria-pressed', 'true');

  // History tab: today's row visible; click expands and shows field labels.
  await page.getByTestId('tab-history').click();
  const today = new Date().toISOString().slice(0, 10);
  const todayRow = page.getByTestId(`history-row-${today}`);
  await expect(todayRow).toBeVisible();
  await todayRow.click();
  await expect(todayRow).toHaveAttribute('aria-expanded', 'true');
  // Expanded detail lists key field labels — scope to the History pane to avoid
  // collisions with future copy elsewhere.
  await expect(page.getByText('sleep', { exact: true })).toBeVisible();
  await expect(page.getByText('weight', { exact: true })).toBeVisible();

  // Stats tab: all four section headings present.
  await page.getByTestId('tab-stats').click();
  await expect(page.getByTestId('stats-section-weight')).toBeVisible();
  await expect(page.getByTestId('stats-section-adherence')).toBeVisible();
  await expect(page.getByTestId('stats-section-fields')).toBeVisible();
  await expect(page.getByTestId('stats-section-strength')).toBeVisible();

  // Settings tab: export round-trip via download interception.
  await page.getByTestId('tab-settings').click();
  await expect(page.getByTestId('settings-export')).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('settings-export').click(),
  ]);
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();
  const dump = JSON.parse(readFileSync(downloadPath!, 'utf8')) as {
    schema: number;
    days: unknown[];
    settings: unknown;
  };
  // The export schema field is `schema` (see apps/web/src/lib/export.ts), not
  // `schemaVersion` as the issue copy describes — assert against the real shape.
  expect(typeof dump.schema).toBe('number');
  expect(Array.isArray(dump.days)).toBe(true);
  expect(dump.days).toHaveLength(1);
  expect(dump.settings).toBeTruthy();

  // Settings → wipe. confirm() dialog must be accepted before the wipe runs.
  page.on('dialog', (d) => d.accept());
  await page.getByTestId('settings-wipe').click();

  // After wipe the app re-renders Onboarding (no settings row → step === 'weight').
  await expect(page.getByTestId('onboarding-weight')).toBeVisible();

  // Final guard: no console errors emitted across the whole flow.
  expect(errors).toEqual([]);
});

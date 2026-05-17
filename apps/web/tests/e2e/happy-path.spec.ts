import { test, expect } from '@playwright/test';

test('onboard → log day → reload survives → settings export visible', async ({ page, context }) => {
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

  // Switch to Settings via tab bar; verify export button exists
  await page.getByTestId('tab-settings').click();
  await expect(page.getByTestId('settings-export')).toBeVisible();
});

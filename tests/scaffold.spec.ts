import { expect, test } from '@playwright/test';

test('Grafana loads the provisioned Interface Map plugin', async ({ page }) => {
  await page.goto('/d/interface-map-dev');
  const panel = page.getByRole('region', { name: 'Interface Map development panel' });
  await expect(panel.getByText('Development scaffold')).toBeVisible();
  await expect(panel.getByText('The router diagram editor and live interface traffic are not implemented yet.')).toBeVisible();
});

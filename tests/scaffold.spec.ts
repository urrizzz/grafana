import { expect, test, type Locator, type Page } from '@playwright/test';
import dashboard from '../provisioning/dashboards/development.json';


async function openEditor(page: Page, index = 0) {
  const menus = page.getByRole('button', { name: 'Menu for panel Interface Map layout editor', exact: true });
  await page.getByText('Interface Map layout editor', { exact: true }).nth(index).hover();
  await menus.filter({ visible: true }).click();
  await page.getByRole('menuitem', { name: /^Edit/ }).click();
}

async function choose(page: Page, scope: Locator, name: string, label: string) {
  const input = scope.getByRole('combobox', { name, exact: true });
  await input.click();
  await input.fill(label);
  await page.getByRole('option', { name: label, exact: true }).click();
}

test('Grafana loads an empty diagram from legacy scaffold options', async ({ page, request }) => {
  const uid = 'interface-map-m1-empty';
  const response = await request.post('/api/dashboards/db', {
    data: { dashboard: { ...dashboard, uid, title: 'M1 empty validation', id: null, version: 0 }, overwrite: true },
  });
  expect(response.ok()).toBeTruthy();
  await page.goto(`/d/${uid}`);
  const panel = page.getByRole('region', { name: 'Network Traffic Map diagram' });
  await expect(panel.getByText('Empty diagram. Open the panel editor to add routers.')).toBeVisible();
  await openEditor(page);
  await panel.getByRole('button', { name: 'Add router', exact: true }).click();
  await panel.getByLabel('Router name', { exact: true }).fill('Router A');
  await panel.getByRole('button', { name: 'Add router', exact: true }).click();
  await panel.getByLabel('Router name', { exact: true }).fill('Router B');
  await panel.getByLabel('X', { exact: true }).fill('500');
  await panel.getByRole('button', { name: 'Add traffic', exact: true }).click();
  await expect(panel.locator('[data-testid^="traffic-"]')).toHaveCount(1);
  await panel.getByRole('button', { name: 'Add connection', exact: true }).click();
  await expect(panel.locator('[data-testid^="connection-"]')).toHaveCount(1);
  await panel.getByRole('button', { name: 'Remove element', exact: true }).click();
  await expect(panel.locator('[data-testid^="connection-"]')).toHaveCount(0);
  await choose(page, panel, 'Selected element', 'Tunnel01');
  await panel.getByRole('button', { name: 'Remove element', exact: true }).click();
  await expect(panel.locator('[data-testid^="traffic-"]')).toHaveCount(0);
  await choose(page, panel, 'Selected element', 'Router B');
  await panel.getByRole('button', { name: 'Remove element', exact: true }).click();
  await expect(panel.locator('[data-testid^="router-"]')).toHaveCount(1);
});

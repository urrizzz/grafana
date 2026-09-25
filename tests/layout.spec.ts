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

test('edit layout, route connections, resize and protect references', async ({ page, request }) => {
  const uid = 'interface-map-m1-test';
  const response = await request.post('/api/dashboards/db', {
    data: { dashboard: { ...dashboard, uid, title: 'M1 browser validation', id: null, version: 0 }, overwrite: true },
  });
  expect(response.ok()).toBeTruthy();
  await page.goto(`/d/${uid}`);
  await expect(page.getByRole('button', { name: 'Add router', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Enter edit mode', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Add router', exact: true })).toHaveCount(0);
  const panel = page.getByRole('region', { name: 'Network Traffic Map diagram' });
  await openEditor(page);
  await panel.getByRole('button', { name: 'Load fixture layout', exact: true }).click();
  const link = panel.getByTestId('connection-c1');
  await expect(link).toHaveAttribute('data-from-side', 'right');
  await choose(page, panel, 'Selected element', 'BRANCH-01');
  await panel.getByLabel('X', { exact: true }).fill('40');
  await panel.getByLabel('Y', { exact: true }).fill('220');
  await expect(link).toHaveCount(0);
  await panel.getByLabel('Y', { exact: true }).fill('40');
  await expect(link).toHaveAttribute('data-from-side', 'top');
  await expect(link).toHaveAttribute('data-to-side', 'bottom');
  await choose(page, panel, 'Selected element', 'Connection 1');
  await choose(page, panel, 'From router', 'BRANCH-01');
  await expect(panel.getByRole('alert')).toContainText('two different');
  await expect(panel.getByLabel('From router', { exact: true })).toHaveValue('CORE-01');
  await choose(page, panel, 'Selected element', 'CORE-01');
  await expect(panel.getByRole('alert')).toHaveCount(0);
  const beforeWarning = await panel.locator('.viewport').boundingBox();
  await panel.getByRole('button', { name: 'Remove element', exact: true }).click();
  await expect(panel.getByRole('alert')).toContainText('Remove or reassign');
  expect(await panel.locator('.viewport').boundingBox()).toEqual(beforeWarning);
  const warningBox = await panel.getByRole('alert').boundingBox();
  expect(warningBox!.height).toBeLessThanOrEqual(110);
  expect(warningBox!.width).toBeLessThanOrEqual(340);
  await panel.getByRole('alert').getByRole('button').click();
  await expect(panel.getByRole('alert')).toHaveCount(0);
  await panel.getByRole('button', { name: 'Remove element', exact: true }).click();
  await expect(panel.getByTestId('router-r1')).toBeVisible();
  await panel.getByLabel('Router name', { exact: true }).fill('CORE-SAVED');
  await expect(panel.getByRole('alert')).toHaveCount(0);
  await choose(page, panel, 'Selected element', 'Tunnel10');
  await panel.getByLabel('Graph width', { exact: true }).fill('240');
  await expect(panel.getByText('240 x 140 px graph')).toBeVisible();
  await panel.getByRole('button', { name: 'Duplicate element', exact: true }).click();
  await expect(panel.locator('[data-testid^="traffic-"]')).toHaveCount(2);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(panel.getByRole('complementary', { name: 'Element settings' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(panel.getByTestId('router-r1')).toContainText('CORE-SAVED');
  await expect(panel.locator('[data-testid^="traffic-"]')).toHaveCount(2);
  await expect(link).toHaveAttribute('data-from-side', 'top');
  await expect(panel.getByRole('button', { name: 'Add router', exact: true })).toHaveCount(0);
  const saved = await (await request.get(`/api/dashboards/uid/${uid}`)).json();
  expect(saved.dashboard.panels[0].options.diagram.traffic[0].width).toBe(240);
  expect(saved.dashboard.panels[0].options.diagram.routers[1].x).toBe(40);
});

test('pointer movement respects zoom, resize and view mode', async ({ page, request }) => {
  await page.setViewportSize({ width: 1800, height: 1200 });
  const uid = 'interface-map-m1-pointer';
  await request.post('/api/dashboards/db', {
    data: { dashboard: { ...dashboard, uid, title: 'M1 pointer validation', id: null, version: 0 }, overwrite: true },
  });
  await page.goto(`/d/${uid}`);
  const panel = page.getByRole('region', { name: 'Network Traffic Map diagram' });
  await openEditor(page);
  await panel.getByRole('button', { name: 'Load fixture layout', exact: true }).click();
  for (const zoom of [0.25, 0.5, 0.75, 1, 1.25, 1.5]) {
    await choose(page, panel, 'Diagram zoom', `${zoom * 100}%`);
    for (const [id, label] of [
      ['router-r2', 'BRANCH-01'],
      ['traffic-t1', 'Tunnel10'],
    ]) {
      await choose(page, panel, 'Selected element', label);
      await panel.getByLabel('X', { exact: true }).fill('400');
      await panel.getByLabel('Y', { exact: true }).fill('100');
      await panel.locator('.viewport').evaluate((el, scale) => {
        el.scrollTop = 40 * scale;
        el.scrollLeft = 60 * scale;
      }, zoom);
      const node = panel.getByTestId(id);
      const box = (await node.boundingBox())!;
      await page.mouse.move(box.x + 30 * zoom, box.y + 20 * zoom);
      await page.mouse.down();
      await page.mouse.move(box.x + 60 * zoom, box.y + 40 * zoom);
      await page.mouse.up();
      await expect(node).toHaveCSS('left', '400px');
      await expect(node).toHaveCSS('top', '100px');
      const handle = (await node.getByRole('button', { name: `Move ${label}`, exact: true }).boundingBox())!;
      await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
      await page.mouse.down();
      await page.mouse.move(handle.x + handle.width / 2 + 70 * zoom, handle.y + handle.height / 2 + 40 * zoom, {
        steps: 8,
      });
      await page.mouse.up();
      await expect(node).toHaveCSS('left', '470px');
      await expect(node).toHaveCSS('top', '140px');
    }
  }
  await choose(page, panel, 'Diagram zoom', '100%');
  await choose(page, panel, 'Selected element', 'Tunnel10');
  const handle = await panel.getByRole('button', { name: 'Resize traffic', exact: true }).boundingBox();
  await page.mouse.move(handle!.x + 5, handle!.y + 5);
  await page.mouse.down();
  await page.mouse.move(handle!.x + 65, handle!.y + 5, { steps: 6 });
  await page.mouse.up();
  await expect(panel.getByText('180 x 105 px graph')).toBeVisible();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  const box = await panel.getByTestId('router-r2').boundingBox();
  await page.mouse.move(box!.x + 20, box!.y + 20);
  await page.mouse.down();
  await page.mouse.move(box!.x + 80, box!.y + 80);
  await page.mouse.up();
  await expect(panel.getByTestId('router-r2')).toHaveCSS('left', '470px');
});

test('native Grafana panel duplication keeps layouts independent after saving', async ({ page, request }) => {
  await page.setViewportSize({ width: 1440, height: 1800 });
  const uid = 'interface-map-m1-duplicate';
  await request.post('/api/dashboards/db', {
    data: {
      dashboard: { ...dashboard, uid, title: 'M1 duplication validation', id: null, version: 0 },
      overwrite: true,
    },
  });
  await page.goto(`/d/${uid}`);
  await page.getByRole('button', { name: 'Enter edit mode', exact: true }).click();
  let panels = page.getByRole('region', { name: 'Network Traffic Map diagram' });
  await openEditor(page);
  await panels.first().getByRole('button', { name: 'Load fixture layout', exact: true }).click();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByText('Interface Map layout editor', { exact: true }).hover();
  await page.getByRole('button', { name: 'Menu for panel Interface Map layout editor', exact: true }).click();
  await page.getByRole('menuitem', { name: 'More...' }).hover();
  await page.getByRole('menuitem', { name: /^Duplicate/ }).click();
  await expect(panels).toHaveCount(2);
  const copy = panels.first();
  await openEditor(page, 1);
  await choose(page, copy, 'Selected element', 'CORE-01');
  await copy.getByLabel('Router name', { exact: true }).fill('COPY-ONLY');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  panels = page.getByRole('region', { name: 'Network Traffic Map diagram' });
  await expect(panels.first().getByTestId('router-r1')).toContainText('CORE-01');
  await expect(panels.nth(1).getByTestId('router-r1')).toContainText('COPY-ONLY');
  await expect(panels.nth(1).getByTestId('connection-c1')).toBeVisible();
});

test('discarding the panel editor restores the previous diagram', async ({ page, request }) => {
  const uid = 'interface-map-m1-discard';
  await request.post('/api/dashboards/db', {
    data: { dashboard: { ...dashboard, uid, title: 'M1 discard validation', id: null, version: 0 }, overwrite: true },
  });
  await page.goto(`/d/${uid}`);
  await openEditor(page);
  const panel = page.getByRole('region', { name: 'Network Traffic Map diagram' });
  await panel.getByRole('button', { name: 'Load fixture layout', exact: true }).click();
  await expect(panel.getByTestId('router-r1')).toBeVisible();
  await page.getByRole('button', { name: 'Discard', exact: true }).click();
  await expect(panel.getByTestId('router-r1')).toHaveCount(0);
  await expect(panel.getByRole('button', { name: 'Add router', exact: true })).toHaveCount(0);
});

test('router resize follows zoom, updates connections and persists dimensions', async ({ page, request }) => {
  await page.setViewportSize({ width: 1800, height: 1200 });
  const uid = 'network-map-router-resize';
  await request.post('/api/dashboards/db', {
    data: { dashboard: { ...dashboard, uid, id: null, version: 0, title: 'Router resize checks' }, overwrite: true },
  });
  await page.goto(`/d/${uid}`);
  await openEditor(page);
  const panel = page.getByRole('region', { name: 'Network Traffic Map diagram' });
  await panel.getByRole('button', { name: 'Load fixture layout', exact: true }).click();
  await choose(page, panel, 'Selected element', 'CORE-01');
  const router = panel.getByTestId('router-r1');
  let width = 150,
    height = 64;
  for (const zoom of [0.5, 1, 1.5]) {
    await choose(page, panel, 'Diagram zoom', `${zoom * 100}%`);
    const handle = router.getByRole('button', { name: 'Resize router', exact: true });
    await expect(handle.getByTestId('resize-icon')).toBeVisible();
    await handle.scrollIntoViewIfNeeded();
    const box = (await handle.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 60 * zoom, box.y + box.height / 2 + 36 * zoom, { steps: 8 });
    await page.mouse.up();
    width += 60;
    height += 36;
    await expect(router).toHaveCSS('width', `${width}px`);
    await expect(router).toHaveCSS('height', `${height}px`);
    await expect(router).toHaveCSS('left', '40px');
    await expect(router).toHaveCSS('top', '220px');
    await expect(panel.getByTestId('connection-c1')).toHaveAttribute(
      'd',
      new RegExp(`^M${40 + width},${220 + height / 2} `)
    );
  }
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(panel.getByRole('button', { name: 'Resize router', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(router).toHaveCSS('width', '330px');
  await expect(router).toHaveCSS('height', '172px');
  const saved = await (await request.get(`/api/dashboards/uid/${uid}`)).json();
  expect(saved.dashboard.panels[0].options.diagram.routers[0]).toMatchObject({
    width: 330,
    height: 172,
    x: 40,
    y: 220,
  });
});

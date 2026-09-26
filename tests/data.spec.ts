import { expect, test, type Locator, type Page } from '@playwright/test';
import sourceDemo from '../provisioning/dashboards/data-preview.json';
const demo = structuredClone(sourceDemo);
for (const traffic of demo.panels[0].options.diagram.traffic) {
  Object.assign(traffic, { showInterfaceDetails: true });
}

async function choose(page: Page, panel: Locator, name: string, value: string) {
  const input = panel.getByRole('combobox', { name, exact: true });
  await input.click();
  await input.fill(value);
  await page.getByRole('option', { name: value, exact: true }).click();
}
async function editor(page: Page) {
  await page.getByText('Network Traffic Map data preview', { exact: true }).hover();
  await page.getByRole('button', { name: 'Menu for panel Network Traffic Map data preview', exact: true }).click();
  await page.getByRole('menuitem', { name: /^Edit/ }).click();
}
test('returned router/channel selection, automatic metadata, missing data and persistence', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 1600, height: 1200 });
  const uid = 'network-map-m2-test';
  const created = await request.post('/api/dashboards/db', {
    data: { dashboard: { ...demo, uid, title: 'M2 validation', id: null, version: 0 }, overwrite: true },
  });
  expect(created.ok()).toBeTruthy();
  await page.goto(`/d/${uid}`);
  const panel = page.getByRole('region', { name: 'Network Traffic Map diagram' });
  await expect(panel.getByLabel('Data diagnostics')).toContainText('2 routers / 4 channels');
  await expect(panel.getByTestId('traffic-t1')).toContainText('Primary WAN');
  await expect(panel.getByTestId('traffic-t1')).toContainText('UP');
  await expect(panel.getByTestId('traffic-t1')).toContainText('Capacity 100 Mbit/s');
  await expect(panel.getByTestId('traffic-t2')).toContainText('Backup WAN');
  await expect(panel.getByTestId('traffic-t2')).toContainText('DOWN');
  await expect(panel.getByTestId('traffic-t2').getByTestId('current-in')).toHaveText('--');
  await editor(page);
  await choose(page, panel, 'Selected element', 'CORE-01');
  await panel.getByRole('combobox', { name: 'Router instance', exact: true }).click();
  await expect(page.getByRole('option', { name: '192.0.2.21', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  // Select through the body; duplicate channel names are valid across routers.
  await panel.getByTestId('traffic-t1').getByTestId('bandwidth-plot').click();
  await expect(panel.getByLabel('Alias', { exact: true })).toHaveCount(0);
  await expect(panel.getByLabel('Description', { exact: true })).toHaveCount(0);
  await panel.getByRole('combobox', { name: 'Channel', exact: true }).click();
  await expect(page.getByRole('option', { name: 'GigabitEthernet0/1', exact: true })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Tunnel99', exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  let queries = 0;
  page.on('request', (request) => {
    if (request.url().includes('/api/ds/query')) {
      queries++;
    }
  });
  await choose(page, panel, 'Channel', 'GigabitEthernet0/1');
  await expect(panel.getByTestId('traffic-t1')).toContainText('Physical uplink');
  await expect(panel.getByTestId('traffic-t1')).toContainText('Capacity 1 Gbit/s');
  await choose(page, panel, 'Router', 'BRANCH-01');
  await expect(panel.getByTestId('traffic-t1')).toContainText('UNKNOWN');
  await expect(panel.getByTestId('traffic-t1')).toContainText('Selected channel unavailable');
  await expect(panel.getByTestId('traffic-t1')).not.toContainText('Physical uplink');
  await choose(page, panel, 'Channel', 'Tunnel99');
  await expect(panel.getByTestId('traffic-t1')).toContainText('Metadata only');
  await expect(panel.getByTestId('traffic-t1')).toContainText('UNKNOWN');
  expect(queries).toBe(0);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(panel.getByTestId('traffic-t1')).toContainText('Metadata only');
  const saved = await (await request.get(`/api/dashboards/uid/${uid}`)).json();
  expect(saved.dashboard.panels[0].options.diagram.traffic[0].routerId).toBe('r2');
  expect(saved.dashboard.panels[0].options.mapping.sourceTime).toBe('sourceTimestamp');
  expect(saved.dashboard.panels[0].targets.map((target: { refId: string }) => target.refId)).toEqual([
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
  ]);
  for (const target of saved.dashboard.panels[0].targets) {
    expect(target.scenarioId).toBe('raw_frame');
    expect(target.rawFrameContent).toBe(
      demo.panels[0].targets.find((original) => original.refId === target.refId)!.rawFrameContent
    );
  }
});

test('single-valued dashboard variables select data and All is rejected', async ({ page, request }) => {
  const uid = 'network-map-m2-variables';
  const config = structuredClone(demo);
  config.panels[0].options.diagram.routers[0].instance = '$router';
  const variable = {
    name: 'router',
    type: 'custom',
    query: '192.0.2.10,192.0.2.21',
    multi: false,
    includeAll: true,
    allValue: '192.0.2.10',
    current: { text: '192.0.2.10', value: '192.0.2.10' },
    options: [
      { text: '192.0.2.10', value: '192.0.2.10', selected: true },
      { text: '192.0.2.21', value: '192.0.2.21' },
    ],
  };
  await request.post('/api/dashboards/db', {
    data: {
      dashboard: { ...config, uid, title: 'M2 variables', id: null, version: 0, templating: { list: [variable] } },
      overwrite: true,
    },
  });
  await page.goto(`/d/${uid}?var-router=192.0.2.10`);
  const traffic = page.getByTestId('traffic-t1');
  await expect(traffic).toContainText('Primary WAN');
  await page.goto(`/d/${uid}?var-router=192.0.2.21`);
  await expect(traffic).toContainText('Backup WAN');
  await page.goto(`/d/${uid}?var-router=All`);
  await expect(traffic).toContainText('UNKNOWN');
  await expect(traffic).toContainText('Selected channel unavailable or invalid variable');
});

test('panel option mappings change the interpretation of returned data', async ({ page, request }) => {
  const uid = 'network-map-m2-mappings';
  await request.post('/api/dashboards/db', {
    data: { dashboard: { ...demo, uid, title: 'M2 mapping validation', id: null, version: 0 }, overwrite: true },
  });
  await page.goto(`/d/${uid}?editPanel=1`);
  const panel = page.getByRole('region', { name: 'Network Traffic Map diagram' });
  await expect(panel.getByTestId('traffic-t1')).toContainText('Primary WAN');
  const identity = page.getByRole('textbox', { name: /^Router identity / });
  await identity.fill('missing_label');
  await identity.press('Tab');
  await expect(panel.getByLabel('Data diagnostics')).toContainText('0 routers / 0 channels');
  await expect(panel.getByTestId('traffic-t1')).toContainText('UNKNOWN');
  await identity.fill('instance');
  await identity.press('Tab');
  await expect(panel.getByLabel('Data diagnostics')).toContainText('2 routers / 4 channels');
  const alias = page.getByRole('textbox', { name: /^Interface alias / });
  await alias.fill('ifDescr');
  await alias.press('Tab');
  await expect(panel.getByTestId('traffic-t1')).not.toContainText('Primary WAN');
  await expect(panel.getByTestId('traffic-t1')).toContainText('Cisco tunnel');
  const field = page.getByRole('textbox', { name: /^Capacity field / });
  await field.fill('no_such_field');
  await field.press('Tab');
  await expect(panel.getByTestId('traffic-t1')).toContainText('Capacity --');
  await field.fill('Value');
  await field.press('Tab');
  await expect(panel.getByTestId('traffic-t1')).toContainText('Capacity 100 Mbit/s');
});

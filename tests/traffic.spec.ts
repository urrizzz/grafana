import { expect, test } from '@playwright/test';
import demo from '../provisioning/dashboards/data-preview.json';

test('compact graphs retain history and hover actual samples in light and dark themes', async ({ page, request }) => {
  await page.setViewportSize({ width: 1600, height: 1100 });
  const uid = 'network-map-m3-graphs';
  const config = structuredClone(demo);
  config.panels[0].options.diagram.traffic[0].width = 120;
  await request.post('/api/dashboards/db', {
    data: { dashboard: { ...config, uid, id: null, version: 0, title: 'M3 graph checks' }, overwrite: true },
  });
  for (const theme of ['dark', 'light']) {
    await page.goto(`/d/${uid}?theme=${theme}`);
    const up = page.getByTestId('traffic-t1').getByTestId('bandwidth-plot');
    const down = page.getByTestId('traffic-t2').getByTestId('bandwidth-plot');
    await expect(up.locator('rect[data-direction="in"]')).toHaveCount(144);
    await expect(down.locator('rect[data-direction="out"]')).toHaveCount(144);
    await expect(up).toHaveCSS('border-top-color', 'rgb(115, 191, 105)');
    await expect(down).toHaveCSS('border-top-color', 'rgb(242, 73, 92)');
    await expect(down.getByTestId('current-in')).toHaveText('--');
    await expect(up.getByTestId('in-limit')).toHaveText((await up.getByTestId('out-limit').textContent())!);
    const bounds = (await up.boundingBox())!;
    expect(bounds.width).toBeCloseTo(120, 0);
    expect(bounds.height).toBeCloseTo(70, 0);
    const segments = await up
      .getByTestId('outage-segment')
      .evaluateAll((nodes) => nodes.map((n) => Number(n.getAttribute('x2')) - Number(n.getAttribute('x1'))));
    await expect(up).not.toContainText('5m @');
    await expect(page.getByTestId('traffic-t1').getByTestId('interface-details')).toHaveCount(0);
    await expect(up.getByTestId('outage-segment')).toHaveAttribute('data-from', '1790297400000');
    await expect(up.getByTestId('outage-segment')).toHaveAttribute('data-to', '1790298000000');
    await expect(up.getByTestId('outage-segment')).toHaveCSS('stroke-width', '3px');
    const heading = await page.getByTestId('traffic-t1').getByTestId('compact-channel-name').boundingBox();
    expect(heading!.x + heading!.width / 2).toBeCloseTo(bounds.x + bounds.width / 2, 0);
    expect(heading!.y + heading!.height).toBeLessThanOrEqual(bounds.y);
    await up.hover({ position: { x: 31, y: 32 } });
    await expect(page.getByRole('tooltip')).toContainText('DOWN 00:50 - 01:00');
    expect(segments.length).toBeGreaterThan(0);
    expect(segments.every((w) => w < 94)).toBeTruthy();
    await up.hover({ position: { x: 60, y: 12 } });
    await expect(up.getByTestId('hover-cursor')).toHaveCount(1);
    await expect(page.getByRole('tooltip')).toContainText('IN');
    await expect(page.getByRole('tooltip')).toContainText('OUT');
    await expect(page.getByRole('tooltip')).toContainText('2026');
    expect(await page.getByRole('tooltip').evaluate((n) => n.parentElement === document.body)).toBeTruthy();
    await page.mouse.move(1, 1);
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    await page.screenshot({ path: `test-results/m3-${theme}.png` });
  }
});

test('details collapse, status moves inside, size and visibility persist independently', async ({ page, request }) => {
  await page.setViewportSize({ width: 1600, height: 1200 });
  const uid = 'network-map-m3-details';
  await request.post('/api/dashboards/db', {
    data: { dashboard: { ...demo, uid, id: null, version: 0, title: 'M3 details checks' }, overwrite: true },
  });
  await page.goto(`/d/${uid}?editPanel=1`);
  const panel = page.getByRole('region', { name: 'Network Traffic Map diagram' });
  const traffic = panel.getByTestId('traffic-t1');
  await traffic.getByRole('button', { name: 'Move Tunnel10', exact: true }).click();
  await expect(panel.getByRole('checkbox', { name: 'Show interface details', exact: true })).not.toBeChecked();
  await expect(traffic.getByTestId('compact-channel-name')).toHaveText('Tunnel10');
  await panel.getByRole('checkbox', { name: 'Show interface details', exact: true }).check();
  const before = (await traffic.boundingBox())!;
  await panel.getByText('Visible details', { exact: true }).click();
  await panel.getByRole('checkbox', { name: 'alias', exact: true }).uncheck();
  await panel.getByRole('checkbox', { name: 'Show interface details', exact: true }).uncheck();
  await expect(traffic.getByTestId('interface-details')).toHaveCount(0);
  await expect(traffic.getByTestId('internal-status')).toHaveAttribute('aria-label', 'UP');
  expect((await traffic.boundingBox())!.width).toBeLessThan(before.width - 100);
  expect((await traffic.boundingBox())!.x).toBe(before.x);
  for (const width of [180, 240, 120]) {
    await panel.getByRole('slider', { name: 'Graph width' }).fill(String(width));
    await expect(traffic.getByTestId('bandwidth-plot')).toHaveAttribute('width', String(width));
    await traffic.getByTestId('bandwidth-plot').hover({ position: { x: width / 2, y: 15 } });
    await expect(page.getByRole('tooltip')).toBeVisible();
  }
  await panel.getByRole('button', { name: 'Duplicate element', exact: true }).click();
  await panel.getByRole('checkbox', { name: 'Show interface details', exact: true }).check();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(traffic.getByTestId('internal-status')).toBeVisible();
  const saved = await (await request.get(`/api/dashboards/uid/${uid}`)).json();
  const blocks = saved.dashboard.panels[0].options.diagram.traffic;
  expect(blocks[0].showInterfaceDetails).toBe(false);
  expect(blocks[0].visibleFields.alias).toBe(false);
  expect(blocks[2].showInterfaceDetails).toBe(true);
  expect(blocks[2].visibleFields.alias).toBe(false);
});

test('unknown retains history, gaps differ from zeros and hidden state circles cover all states', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 1600, height: 1100 });
  const config = structuredClone(demo);
  const uid = 'network-map-m3-states';
  const blocks = config.panels[0].options.diagram.traffic as Array<Record<string, unknown>>;
  blocks[0].showInterfaceDetails = false;
  blocks[1].showInterfaceDetails = false;
  blocks.push({ ...blocks[0], id: 'unknown', width: 240, ifName: 'GigabitEthernet0/1', x: 300, y: 420 });
  for (const target of config.panels[0].targets) {
    const frames = JSON.parse(target.rawFrameContent);
    if (['A', 'B'].includes(target.refId)) {
      frames[1].data.values[1][60] = null;
      frames[1].data.values[1][61] = 0;
    }
    if (target.refId === 'F') {
      frames[1].data.values[1][0] = 4;
    }
    target.rawFrameContent = JSON.stringify(frames);
  }
  await request.post('/api/dashboards/db', {
    data: { dashboard: { ...config, uid, id: null, version: 0, title: 'M3 status checks' }, overwrite: true },
  });
  await page.goto(`/d/${uid}`);
  for (const [id, state] of [
    ['t1', 'UP'],
    ['t2', 'DOWN'],
    ['unknown', 'UNKNOWN'],
  ]) {
    await expect(page.getByTestId(`traffic-${id}`).getByTestId('internal-status')).toHaveAttribute('aria-label', state);
  }
  const graph = page.getByTestId('traffic-unknown').getByTestId('bandwidth-plot');
  await expect(graph).toHaveCSS('border-top-color', 'rgb(164, 175, 191)');
  await expect(graph.getByTestId('current-in')).toHaveText('--');
  await expect(graph.locator('rect[data-direction="in"]')).toHaveCount(143);
  await expect(graph.locator('rect[data-direction="in"][data-time="1790312400000"]')).toHaveCount(0);
  await expect(graph.locator('rect[data-direction="in"][data-time="1790312700000"]')).toHaveAttribute('height', '0');
  async function hoverBucket(bucket: number) {
    const point = await graph.evaluate((svg, n) => {
      const p = new DOMPoint(24 + (n / 144) * 94, 12).matrixTransform((svg as SVGSVGElement).getScreenCTM()!);
      return { x: p.x, y: p.y };
    }, bucket);
    await page.mouse.move(point.x, point.y);
  }
  // Halfway through bucket 60 = [04:55,05:00], whose incoming sample is missing.
  await hoverBucket(59.5);
  await expect(page.getByRole('tooltip')).toContainText('IN --');
  await hoverBucket(60.5);
  await expect(page.getByRole('tooltip')).toContainText('IN 0 bit/s');
});

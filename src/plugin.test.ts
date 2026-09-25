import plugin from './plugin.json';
import dashboard from '../provisioning/dashboards/development.json';

test('provisioned dashboard loads the declared panel and options schema', () => {
  expect(plugin.type).toBe('panel');
  expect(dashboard.panels[0].type).toBe(plugin.id);
  expect(dashboard.panels[0].options.schemaVersion).toBe(1);
});

import { PanelPlugin } from '@grafana/data';
import { InterfaceMapPanel } from './components/InterfaceMapPanel';
import { InterfaceMapOptions } from './types';

export const plugin = new PanelPlugin<InterfaceMapOptions>(InterfaceMapPanel).setPanelOptions((builder) =>
  builder.addNumberInput({ path: 'schemaVersion', name: 'Options schema', defaultValue: 1, showIf: () => false })
);

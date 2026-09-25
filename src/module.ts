import { PanelPlugin } from '@grafana/data';
import { InterfaceMapPanel } from './components/InterfaceMapPanel';
import { InterfaceMapOptions } from './types';
import { defaultMapping, roles } from './data/model';

export const plugin = new PanelPlugin<InterfaceMapOptions>(InterfaceMapPanel).setPanelOptions((builder) => {
  builder.addNumberInput({ path: 'schemaVersion', name: 'Options schema', defaultValue: 1, showIf: () => false });
  const labels = {
    instance: 'Router identity',
    channel: 'Channel identity',
    routerName: 'Router name',
    alias: 'Interface alias',
    description: 'Interface description',
    sourceTime: 'Source timestamp',
    sampleCount: 'Sample count',
  };
  const roleLabels = {
    inHistory: 'Incoming history',
    outHistory: 'Outgoing history',
    inCurrent: 'Incoming current',
    outCurrent: 'Outgoing current',
    statusHistory: 'Status history',
    statusCurrent: 'Status current',
    capacity: 'Capacity',
    metadata: 'Metadata',
  };
  for (const key of [
    'instance',
    'channel',
    'routerName',
    'alias',
    'description',
    'sourceTime',
    'sampleCount',
  ] as const) {
    builder.addTextInput({
      path: `mapping.${key}`,
      name: labels[key],
      category: ['Identity and quality mappings'],
      defaultValue: defaultMapping[key],
      description:
        key === 'sourceTime'
          ? 'Optional source timestamp field, epoch milliseconds'
          : key === 'sampleCount'
            ? 'Optional raw sample count per 5-minute rate window'
            : 'Returned label or table column name',
    });
  }
  for (const role of roles) {
    builder.addTextInput({
      path: `mapping.roles.${role}.refId`,
      name: `${roleLabels[role]} query`,
      category: ['Query result mappings'],
      defaultValue: defaultMapping.roles[role].refId,
      description: 'Query reference ID. Empty disables this role; configure metric expressions in the query editor.',
    });
    builder.addTextInput({
      path: `mapping.roles.${role}.field`,
      name: `${roleLabels[role]} field`,
      category: ['Query result mappings'],
      defaultValue: '',
      description: 'Exact numeric field name; empty selects numeric fields except mapped identity/quality fields.',
    });
  }
  return builder;
});

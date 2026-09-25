export const roles = [
  'inHistory',
  'outHistory',
  'inCurrent',
  'outCurrent',
  'statusHistory',
  'statusCurrent',
  'capacity',
  'metadata',
] as const;
export type Role = (typeof roles)[number];
export interface RoleMapping {
  refId: string;
  field: string;
}
export interface DataMapping {
  instance: string;
  channel: string;
  routerName: string;
  alias: string;
  description: string;
  sourceTime: string;
  sampleCount: string;
  roles: Record<Role, RoleMapping>;
}
export const defaultMapping: DataMapping = {
  instance: 'instance',
  channel: 'ifName',
  routerName: 'name',
  alias: 'ifAlias',
  description: 'ifDescr',
  sourceTime: '',
  sampleCount: '',
  roles: {
    inHistory: { refId: 'A', field: '' },
    outHistory: { refId: 'B', field: '' },
    inCurrent: { refId: 'C', field: '' },
    outCurrent: { refId: 'D', field: '' },
    statusHistory: { refId: 'E', field: '' },
    statusCurrent: { refId: 'F', field: '' },
    capacity: { refId: 'G', field: '' },
    metadata: { refId: 'H', field: '' },
  },
};
export function mappingWithDefaults(value?: Partial<DataMapping>): DataMapping {
  return {
    ...defaultMapping,
    ...value,
    roles: Object.fromEntries(
      roles.map((role) => [role, { ...defaultMapping.roles[role], ...value?.roles?.[role] }])
    ) as Record<Role, RoleMapping>,
  };
}
export interface Sample {
  time: number;
  value: number | null;
  sourceTime?: number;
  sampleCount?: number;
}
export type LinkState = 'UP' | 'DOWN' | 'UNKNOWN';
export interface ChannelData {
  instance: string;
  channel: string;
  routerName: string;
  alias: string;
  description: string;
  history: { in: Sample[]; out: Sample[] };
  statusHistory: Sample[];
  downIntervals: Array<{ from: number; to: number }>;
  current: { in: number | null; out: number | null; at: number };
  status: LinkState;
  capacity: number | null;
  issues: string[];
  ambiguous: boolean;
}
export interface DataIndex {
  channels: Map<string, ChannelData>;
  issues: string[];
}
export const channelKey = (instance: string, channel: string) => JSON.stringify([instance, channel]);

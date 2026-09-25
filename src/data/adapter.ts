import { DataFrame, Field, FieldType, InterpolateFunction, LoadingState, PanelData } from '@grafana/data';
import {
  ChannelData,
  channelKey,
  DataIndex,
  DataMapping,
  LinkState,
  mappingWithDefaults,
  Role,
  roles,
  Sample,
} from './model';

const number = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;
export const stateOf = (code: number | null | undefined): LinkState =>
  code === 1 ? 'UP' : [2, 3, 5, 6, 7].includes(code ?? 0) ? 'DOWN' : 'UNKNOWN';
const add = (issues: string[], issue: string) => {
  if (!issues.includes(issue)) {
    issues.push(issue);
  }
};
interface Working {
  result: ChannelData;
  samples: Record<Role, Sample[]>;
  streams: Map<Role, Set<string>>;
  dimensions: Map<string, string>;
  metadataAt: Record<string, number>;
}
function fresh(sample: Sample, end: number) {
  return (
    sample.time <= end &&
    end - sample.time <= 180000 &&
    (sample.sourceTime === undefined || (sample.sourceTime <= sample.time && sample.time - sample.sourceTime <= 180000))
  );
}
export function downIntervals(samples: Sample[], from: number, to: number) {
  const result: Array<{ from: number; to: number }> = [];
  samples.forEach((sample, i) => {
    if (stateOf(sample.value) !== 'DOWN' || !fresh(sample, sample.time)) {
      return;
    }
    const start = Math.max(from, sample.time);
    const end = Math.min(to, sample.time + 60000, samples[i + 1]?.time ?? to);
    if (start >= end) {
      return;
    }
    const previous = result[result.length - 1];
    if (previous?.to === start) {
      previous.to = end;
    } else {
      result.push({ from: start, to: end });
    }
  });
  return result;
}

/** Consume returned frames only. All timestamps (including optional source timestamps) are epoch milliseconds. */
export function adaptFrames(
  data: PanelData,
  supplied: Partial<DataMapping> | undefined,
  from: number,
  to: number
): DataIndex {
  const mapping = mappingWithDefaults(supplied);
  const working = new Map<string, Working>();
  const issues: string[] = [];
  if (data.state === LoadingState.Loading || data.state === LoadingState.Streaming) {
    add(issues, 'Queries loading; current values unavailable');
  }
  if (data.state === LoadingState.Error || data.errors?.length) {
    add(issues, 'Query error; current values unavailable');
  }
  const queryUnavailable = issues.length > 0;
  const excluded = new Set([
    mapping.instance,
    mapping.channel,
    mapping.routerName,
    mapping.alias,
    mapping.description,
    mapping.sourceTime,
    mapping.sampleCount,
  ]);
  data.series.forEach((frame: DataFrame, frameIndex) => {
    const timeFields = frame.fields.filter((field) => field.type === FieldType.time);
    if (frame.fields.some((field) => field.values.length !== frame.length) || timeFields.length > 1) {
      add(issues, 'Unsupported frame: unequal field lengths or multiple time fields');
      return;
    }
    const read = (name: string, row: number, field?: Field): unknown => {
      if (!name) {
        return undefined;
      }
      const columns = frame.fields.filter((candidate) => candidate.name === name);
      const label = field?.labels?.[name];
      if (columns.length > 1) {
        add(issues, `Ambiguous column: ${name}`);
        return undefined;
      }
      const value = columns[0]?.values[row];
      if (label !== undefined && value !== undefined && String(value) !== label) {
        add(issues, `Conflicting label/column: ${name}`);
        return undefined;
      }
      return label ?? value;
    };
    roles.forEach((role) => {
      const selector = mapping.roles[role];
      if (!selector.refId || frame.refId !== selector.refId) {
        return;
      }
      let fields = frame.fields.filter(
        (field) =>
          field.type === FieldType.number &&
          !excluded.has(field.name) &&
          (!selector.field || field.name === selector.field)
      );
      if (role === 'metadata' && !selector.field && !fields.length) {
        fields = frame.fields.filter((field) => field.name === mapping.channel).slice(0, 1);
      }
      if (!fields.length) {
        add(issues, `No matching field for ${role} in query ${selector.refId}`);
      }
      fields.forEach((field, fieldIndex) => {
        for (let row = 0; row < frame.length; row++) {
          const instance = read(mapping.instance, row, field),
            channel = read(mapping.channel, row, field);
          if (typeof instance !== 'string' || !instance || typeof channel !== 'string' || !channel) {
            add(issues, `Missing identity in query ${selector.refId}; check label/field mappings`);
            continue;
          }
          const key = channelKey(instance, channel);
          let item = working.get(key);
          if (!item) {
            const result: ChannelData = {
              instance,
              channel,
              routerName: '',
              alias: '',
              description: '',
              history: { in: [], out: [] },
              statusHistory: [],
              downIntervals: [],
              current: { in: null, out: null, at: to },
              status: 'UNKNOWN',
              capacity: null,
              issues: [],
              ambiguous: false,
            };
            item = {
              result,
              samples: Object.fromEntries(roles.map((r) => [r, []])) as unknown as Record<Role, Sample[]>,
              streams: new Map(),
              dimensions: new Map(),
              metadataAt: {},
            };
            working.set(key, item);
          }
          const result = item.result;
          const time = number(timeFields[0]?.values[row]);
          if (time !== undefined && time > to) {
            continue;
          }
          // Extra dimensions must agree across roles. Query authors must filter duplicate job/site series.
          const dimensions: Record<string, unknown> = { ...field.labels };
          frame.fields
            .filter((f) => f.type === FieldType.string)
            .forEach((f) => {
              dimensions[f.name] = f.values[row];
            });
          Object.entries(dimensions).forEach(([name, value]) => {
            if (excluded.has(name) || name === '__name__' || value === undefined || value === null) {
              return;
            }
            const old = item!.dimensions.get(name);
            if (old !== undefined && old !== String(value)) {
              result.ambiguous = true;
            }
            item!.dimensions.set(name, String(value));
          });
          for (const [target, name] of [
            ['routerName', mapping.routerName],
            ['alias', mapping.alias],
            ['description', mapping.description],
          ] as const) {
            const value = read(name, row, field);
            if (typeof value !== 'string') {
              continue;
            }
            const at = time ?? -Infinity,
              previous = item.metadataAt[target];
            if (previous === at && result[target] !== value) {
              result.ambiguous = true;
            }
            if (previous === undefined || at >= previous) {
              result[target] = value;
              item.metadataAt[target] = at;
            }
          }
          const streams = item.streams.get(role) ?? new Set<string>();
          streams.add(`${frameIndex}:${fieldIndex}`);
          item.streams.set(role, streams);
          if (streams.size > 1) {
            result.ambiguous = true;
          }
          if (role === 'metadata') {
            continue;
          }
          if (time === undefined) {
            add(result.issues, `${role}: timestamp required`);
            continue;
          }
          const value = number(field.values[row]);
          const sourceTime = number(read(mapping.sourceTime, row, field));
          const sampleCount = number(read(mapping.sampleCount, row, field));
          const isRate = role.startsWith('in') || role.startsWith('out');
          if (value === undefined || (isRate && value < 0)) {
            add(result.issues, `${role}: missing/invalid samples`);
          }
          item.samples[role].push({
            time,
            value: value === undefined || (isRate && value < 0) ? null : value,
            sourceTime,
            sampleCount,
          });
        }
      });
    });
  });
  for (const item of working.values()) {
    const result = item.result;
    for (const role of roles) {
      const samples = item.samples[role];
      samples.sort((a, b) => a.time - b.time);
      if (samples.some((sample, i) => i > 0 && sample.time === samples[i - 1].time)) {
        result.ambiguous = true;
      }
    }
    if (result.ambiguous) {
      result.alias = '';
      result.description = '';
      result.routerName = '';
      add(result.issues, 'Ambiguous channel: filter duplicate series or conflicting job/site/metadata');
      continue;
    }
    for (const direction of ['in', 'out'] as const) {
      const history = item.samples[`${direction}History`];
      if (!history.length) {
        add(result.issues, `${direction}: history missing`);
      }
      if (
        history.some(
          (sample, i) => sample.time % 300000 !== 0 || (i > 0 && sample.time - history[i - 1].time !== 300000)
        )
      ) {
        add(result.issues, `${direction}: history is not continuous aligned 5-minute data; gaps retained`);
      }
      result.history[direction] = history
        .filter((sample) => sample.time - 300000 >= from && sample.time <= to && sample.time % 300000 === 0)
        .map((sample) => ({
          ...sample,
          value:
            (sample.sampleCount !== undefined && sample.sampleCount < 4) || !fresh(sample, sample.time)
              ? null
              : sample.value,
        }));
      const current =
        item.samples[`${direction}Current`].find((sample) => sample.time === to) ??
        history.find((sample) => sample.time === to);
      if (!current) {
        add(result.issues, `${direction}: no current value evaluated at range end`);
      } else {
        if (current.sampleCount === undefined) {
          add(result.issues, `${direction}: sample coverage unverified`);
        }
        if (current.sourceTime === undefined) {
          add(result.issues, `${direction}: source freshness unverified`);
        }
        if (fresh(current, to) && (current.sampleCount === undefined || current.sampleCount >= 4)) {
          result.current[direction] = current.value;
        } else {
          add(result.issues, `${direction}: stale or insufficient source samples`);
        }
      }
    }
    const status =
      item.samples.statusCurrent.filter((sample) => sample.time <= to).at(-1) ??
      item.samples.statusHistory.filter((sample) => sample.time <= to).at(-1);
    if (status && fresh(status, to)) {
      result.status = stateOf(status.value);
    } else {
      add(result.issues, 'Status missing or stale');
    }
    if (status?.sourceTime === undefined) {
      add(result.issues, 'Status source freshness unverified');
    }
    result.statusHistory = item.samples.statusHistory.filter(
      (sample) => sample.time >= from - 60000 && sample.time <= to
    );
    result.downIntervals = downIntervals(result.statusHistory, from, to);
    const capacity = item.samples.capacity.filter((sample) => sample.time <= to).at(-1);
    if (
      capacity &&
      fresh(capacity, to) &&
      capacity.value !== null &&
      capacity.value > 0 &&
      Number.isFinite(capacity.value * 1000000)
    ) {
      result.capacity = capacity.value * 1000000;
    } else {
      add(result.issues, 'Capacity missing or invalid');
    }
    if (queryUnavailable) {
      result.status = 'UNKNOWN';
      add(result.issues, 'Queries unavailable');
    }
    if (result.status !== 'UP') {
      result.current.in = null;
      result.current.out = null;
    }
  }
  return { channels: new Map([...working].map(([key, item]) => [key, item.result])), issues };
}

/** JSON variable formatting distinguishes a scalar value from multi-select/All and unresolved values. */
export function resolveIdentity(
  value: string,
  replace: InterpolateFunction,
  variables: Array<{ name: string; multi?: boolean; current?: { value?: unknown } }> = []
): string | undefined {
  for (const match of value.matchAll(/\$(?:\{(\w+)(?::[^}]+)?\}|(\w+))/g)) {
    const variable = variables.find((item) => item.name === (match[1] ?? match[2]));
    if (variable && 'multi' in variable && variable.multi === true) {
      return undefined;
    }
    if (
      variable &&
      'current' in variable &&
      variable.current &&
      typeof variable.current === 'object' &&
      'value' in variable.current
    ) {
      const current = variable.current.value;
      if (Array.isArray(current) || current === '$__all') {
        return undefined;
      }
    }
  }
  if (!value.includes('$')) {
    return value || undefined;
  }
  const expanded = replace(value, {}, 'json');
  if (expanded.includes('$') || expanded === '$__all' || expanded === 'All') {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(expanded);
    return typeof parsed === 'string' && parsed && parsed !== 'All' && parsed !== '$__all' ? parsed : undefined;
  } catch {
    return expanded && !/[{}\[\],|]/.test(expanded) ? expanded : undefined;
  }
}

import React, { useEffect, useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme2 } from '@grafana/ui';
import { ChannelData, Sample } from '../data/model';
import { axisLimit, BUCKET, formatRate, hoveredBucket, plot, timeText, xFor } from './trafficGeometry';

export const statusColors = { UP: '#73bf69', DOWN: '#f2495c', UNKNOWN: '#a4afbf' };
interface Props {
  channel?: ChannelData;
  width: number;
  from: number;
  to: number;
  timeZone: string;
}
export function TrafficPlot({ channel, width, from, to, timeZone }: Props) {
  const theme = useTheme2();
  const background = theme.colors.background.primary;
  const foreground = theme.colors.text.primary;
  const muted = theme.colors.text.secondary;
  const colors = { in: theme.isDark ? '#439aff' : '#1264cc', out: theme.isDark ? '#b782ff' : '#8338ce' };
  const clip = useId().replace(/:/g, '');
  const history = channel?.history;
  const incoming = useMemo(() => new Map(history?.in.map((s) => [s.time, s.value]) ?? []), [history]);
  const outgoing = useMemo(() => new Map(history?.out.map((s) => [s.time, s.value]) ?? []), [history]);
  const limit = axisLimit([...(history?.in ?? []), ...(history?.out ?? [])]);
  const state = channel?.status ?? 'UNKNOWN';
  const [hover, setHover] = useState<{ endpoint: number; x: number; y: number } | null>(null);
  useEffect(() => {
    const clear = () => setHover(null);
    window.addEventListener('scroll', clear, true);
    window.addEventListener('resize', clear);
    window.addEventListener('blur', clear);
    window.addEventListener('pointerdown', clear);
    return () => {
      window.removeEventListener('scroll', clear, true);
      window.removeEventListener('resize', clear);
      window.removeEventListener('blur', clear);
      window.removeEventListener('pointerdown', clear);
    };
  }, []);
  const textStyle = {
    paintOrder: 'stroke' as const,
    stroke: background,
    strokeWidth: 2.5,
    strokeLinejoin: 'round' as const,
  };
  const bars = (samples: Sample[], direction: 'in' | 'out') =>
    samples.map((sample) => {
      if (
        sample.value == null ||
        !Number.isFinite(sample.value) ||
        sample.value < 0 ||
        sample.time - BUCKET < from ||
        sample.time > to
      ) {
        return null;
      }
      const x = xFor(sample.time - BUCKET, from, to);
      const w = xFor(sample.time, from, to) - x;
      const h = (sample.value / limit) * 28;
      return (
        <rect
          key={sample.time}
          data-direction={direction}
          data-time={sample.time}
          x={x}
          y={direction === 'in' ? plot.middle - h : plot.middle}
          width={Math.max(0, w * 0.92)}
          height={h}
          fill={colors[direction]}
        />
      );
    });
  const tooltip =
    hover && typeof document !== 'undefined'
      ? createPortal(
          <div
            role="tooltip"
            style={{
              position: 'fixed',
              zIndex: 10000,
              pointerEvents: 'none',
              left: Math.max(4, Math.min(hover.x + 12, window.innerWidth - 276)),
              top: hover.y <= window.innerHeight / 2 ? hover.y + 12 : undefined,
              bottom: hover.y > window.innerHeight / 2 ? window.innerHeight - hover.y + 12 : undefined,
              width: 268,
              maxWidth: 'calc(100vw - 8px)',
              padding: '8px 10px',
              border: `1px solid ${theme.colors.border.medium}`,
              borderRadius: 4,
              background,
              color: foreground,
              fontSize: 12,
              lineHeight: '18px',
              boxShadow: '0 3px 10px #0005',
            }}
          >
            <div>
              {timeText(hover.endpoint - BUCKET, timeZone, true)} - {timeText(hover.endpoint, timeZone)} (
              {timeZone || 'browser'})
            </div>
            {channel?.downIntervals
              .filter((interval) => interval.from < hover.endpoint && interval.to > hover.endpoint - BUCKET)
              .map((interval) => (
                <div key={interval.from} style={{ color: statusColors.DOWN }}>
                  DOWN {timeText(interval.from, timeZone)} - {timeText(interval.to, timeZone)}
                </div>
              ))}
            <div style={{ color: colors.in }}>IN {formatRate(incoming.get(hover.endpoint))}</div>
            <div style={{ color: colors.out }}>OUT {formatRate(outgoing.get(hover.endpoint))}</div>
          </div>,
          document.body
        )
      : null;
  return (
    <>
      <svg
        data-testid="bandwidth-plot"
        aria-label={`Traffic history, ${state}, current 5-minute rates at ${timeText(to, timeZone, true)}`}
        role="img"
        width={width}
        height={(width * 70) / 120}
        viewBox="0 0 120 70"
        style={{
          display: 'block',
          flexShrink: 0,
          background,
          border: `1px solid ${statusColors[state]}`,
          borderRadius: 3,
          overflow: 'hidden',
        }}
        onPointerLeave={() => setHover(null)}
        onPointerDown={() => setHover(null)}
        onPointerMove={(event) => {
          if (event.buttons) {
            setHover(null);
            return;
          }
          const matrix = event.currentTarget.getScreenCTM();
          if (!matrix) {
            return;
          }
          const { x, y } = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
          const endpoint = hoveredBucket(x, from, to);
          setHover(
            endpoint !== undefined && y >= plot.top && y <= plot.bottom
              ? { endpoint, x: event.clientX, y: event.clientY }
              : null
          );
        }}
      >
        <defs>
          <clipPath id={clip}>
            <rect x="24" y="3" width="94" height="56" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clip})`}>
          {bars(history?.in ?? [], 'in')}
          {bars(history?.out ?? [], 'out')}
          <line x1="24" x2="118" y1="31" y2="31" stroke={theme.colors.border.strong} strokeWidth="0.6" />
          {channel?.downIntervals.map((interval) => {
            const a = Math.max(from, interval.from),
              b = Math.min(to, interval.to);
            return a < b ? (
              <line
                key={`${a}:${b}`}
                data-testid="outage-segment"
                data-from={a}
                data-to={b}
                x1={xFor(a, from, to)}
                x2={xFor(b, from, to)}
                y1="31"
                y2="31"
                stroke="#f2495c"
                strokeWidth="3"
              />
            ) : null;
          })}
        </g>
        <g fill={muted} fontSize="7" style={textStyle}>
          <text x="2" y="9" data-testid="in-limit">
            {formatRate(limit, true)}
          </text>
          <text x="2" y="58" data-testid="out-limit">
            {formatRate(limit, true)}
          </text>
          <text x="24" y="68">
            {timeText(from, timeZone)}
          </text>
          <text x="118" y="68" textAnchor="end">
            {timeText(to, timeZone)}
          </text>
        </g>
        <g style={textStyle}>
          <text x="2" y="20" fontSize="8" fill={colors.in}>
            IN
          </text>
          <text x="2" y="47" fontSize="8" fill={colors.out}>
            OUT
          </text>
          <text
            x="71"
            y="20"
            textAnchor="middle"
            fontSize="11.5"
            fontWeight="600"
            fill={colors.in}
            data-testid="current-in"
          >
            {formatRate(channel?.current.in)}
          </text>
          <text
            x="71"
            y="49"
            textAnchor="middle"
            fontSize="11.5"
            fontWeight="600"
            fill={colors.out}
            data-testid="current-out"
          >
            {formatRate(channel?.current.out)}
          </text>
        </g>
        <circle
          data-testid="internal-status"
          aria-label={state}
          cx="113"
          cy="7"
          r="3"
          fill={statusColors[state]}
          stroke={background}
          strokeWidth="1"
        />
        {channel?.issues.length ? (
          <text
            aria-label="Data quality warning"
            x="2"
            y="35"
            fontSize="8"
            fill={theme.colors.warning.text}
            style={textStyle}
          >
            !
          </text>
        ) : null}
        {hover && (
          <line
            data-testid="hover-cursor"
            x1={xFor(hover.endpoint - BUCKET / 2, from, to)}
            x2={xFor(hover.endpoint - BUCKET / 2, from, to)}
            y1="3"
            y2="59"
            stroke={foreground}
            strokeWidth="0.6"
            pointerEvents="none"
          />
        )}
      </svg>
      {tooltip}
    </>
  );
}

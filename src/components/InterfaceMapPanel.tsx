import React from 'react';
import { PanelProps } from '@grafana/data';
import { InterfaceMapOptions } from '../types';

export function InterfaceMapPanel({ width, height }: PanelProps<InterfaceMapOptions>) {
  return (
    <section style={{ width, height, padding: 16, overflow: 'auto' }} aria-label="Interface Map development panel">
      <h2>Interface Map</h2>
      <p>Development scaffold</p>
      <p>The router diagram editor and live interface traffic are not implemented yet.</p>
    </section>
  );
}

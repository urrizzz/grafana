import { DataMapping } from './data/model';
export interface Position {
  x: number;
  y: number;
}
export interface RouterNode extends Position {
  id: string;
  name: string;
  instance: string;
  width?: number;
  height?: number;
}
export interface TrafficNode extends Position {
  id: string;
  routerId: string;
  ifName: string;
  alias: string;
  description: string;
  width: number;
  showInterfaceDetails?: boolean;
  visibleFields?: Partial<
    Record<'instance' | 'routerName' | 'channel' | 'alias' | 'description' | 'capacity', boolean>
  >;
}
export interface Connection {
  id: string;
  source: string;
  target: string;
}
export interface Diagram {
  routers: RouterNode[];
  traffic: TrafficNode[];
  connections: Connection[];
}
export interface InterfaceMapOptions {
  schemaVersion: number;
  diagram?: Diagram;
  mapping?: Partial<DataMapping>;
}

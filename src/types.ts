import { DataMapping } from './data/model';
export interface Position {
  x: number;
  y: number;
}
export interface RouterNode extends Position {
  id: string;
  name: string;
  instance: string;
}
export interface TrafficNode extends Position {
  id: string;
  routerId: string;
  ifName: string;
  alias: string;
  description: string;
  width: number;
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

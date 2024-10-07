export interface Capabilities {
  [key: string]: any;
}

export interface ICapabilitiesFactory {
  get<T>(capability: string): T;
}

export interface Logger {
  log(message: string, ...params: any[]): void;
  error(message: string, ...params: any[]): void;
  warn(message: string, ...params: any[]): void;
  info?(message: string, ...params: any[]): void; // Optional verbose logging
}

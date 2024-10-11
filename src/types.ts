export interface Capabilities {
  [key: string]: any;
}

// export interface ICapabilitiesFactory {
//   get<T>(capability: string): T;
// }

export interface CapabilityFactory {
  createCapabilities(caps: Array<string>): Promise<{ [key: string]: any }>;
}

export interface LoggingCapability {
  log(message: string, ...params: any[]): void;
  error(message: string, ...params: any[]): void;
  warn(message: string, ...params: any[]): void;
  info?(message: string, ...params: any[]): void; // Optional verbose logging
}

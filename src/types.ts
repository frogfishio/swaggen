export interface Capability {}

export interface Capabilities {
  [key: string]: any;
}

export interface CapabilityFactory {
  create(capabilities: Array<string>): Promise<Capabilities>;
}

export interface LoggingCapability extends Capability {
  error(message: string, ...params: any[]): void;
  warn(message: string, ...params: any[]): void;
  info?(message: string, ...params: any[]): void; // Optional verbose logging
}

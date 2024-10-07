import { Logger } from "../capabilities";

export class LambdaLoggerFactory {
  static create(): Logger {
    return new AWSLogger();
  }
}

export class AWSLogger implements Logger {
  log(message: string, ...params: any[]): void {
    console.log(`[AWS]: ${message}`, ...params);
  }

  error(message: string, ...params: any[]): void {
    console.error(`[AWS ERROR]: ${message}`, ...params);
  }

  warn(message: string, ...params: any[]): void {
    console.warn(`[AWS WARN]: ${message}`, ...params);
  }

  info(message: string, ...params: any[]): void {
    console.info(`[AWS INFO]: ${message}`, ...params);
  }
}

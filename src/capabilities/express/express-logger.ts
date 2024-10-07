import { createLogger, format, transports } from "winston";
import { Log } from "../capabilities";

export class ExpressLoggerFactory {
  public createLogger(): Log {
    const winstonLogger = createLogger({
      level: "info",
      format: format.combine(
        format.timestamp(),
        format.printf(
          ({ timestamp, level, message }) =>
            `${timestamp} [${level.toUpperCase()}]: ${message}`
        )
      ),
      transports: [
        new transports.Console({
          format: format.combine(format.colorize(), format.simple()),
        }),
      ],
    });

    // Return an object adhering to the Log interface
    return {
      log: (message: string, ...params: any[]) =>
        winstonLogger.info(message, ...params),
      error: (message: string, ...params: any[]) =>
        winstonLogger.error(message, ...params),
      warn: (message: string, ...params: any[]) =>
        winstonLogger.warn(message, ...params),
      info: (message: string, ...params: any[]) =>
        winstonLogger.info(message, ...params), // Optional verbose logging
    };
  }
}

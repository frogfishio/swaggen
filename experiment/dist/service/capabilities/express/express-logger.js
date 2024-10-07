"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressLoggerFactory = void 0;
const winston_1 = require("winston");
class ExpressLoggerFactory {
    createLogger() {
        const winstonLogger = (0, winston_1.createLogger)({
            level: "info",
            format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)),
            transports: [
                new winston_1.transports.Console({
                    format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.simple()),
                }),
            ],
        });
        // Return an object adhering to the Log interface
        return {
            log: (message, ...params) => winstonLogger.info(message, ...params),
            error: (message, ...params) => winstonLogger.error(message, ...params),
            warn: (message, ...params) => winstonLogger.warn(message, ...params),
            info: (message, ...params) => winstonLogger.info(message, ...params), // Optional verbose logging
        };
    }
}
exports.ExpressLoggerFactory = ExpressLoggerFactory;

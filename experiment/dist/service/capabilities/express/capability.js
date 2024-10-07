"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressCapabilityFactory = void 0;
const express_logger_1 = require("./express-logger");
class ExpressCapabilityFactory {
    // Create capabilities for Express
    createCapabilities(caps) {
        return __awaiter(this, void 0, void 0, function* () {
            const capabilities = {};
            // Iterate through each capability in the array
            for (const cap of caps) {
                switch (cap) {
                    case "log":
                        // Initialize the logger using ExpressLoggerFactory
                        const loggerFactory = new express_logger_1.ExpressLoggerFactory();
                        capabilities.logger = loggerFactory.createLogger();
                        break;
                    // Add additional cases for other capabilities here
                    // case 'db':
                    //   capabilities.db = await someDbFactory.createConnection();
                    //   break;
                    // Ignore unrecognized capabilities
                    default:
                        console.warn(`Unrecognized capability: ${cap}`);
                        break;
                }
            }
            // Return only the recognized capabilities
            return capabilities;
        });
    }
}
exports.ExpressCapabilityFactory = ExpressCapabilityFactory;

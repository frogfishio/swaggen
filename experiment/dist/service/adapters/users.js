"use strict";
// Auto-generated by Invoker Generator
// Adapter Class for UsersHandler
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
exports.UsersAdapter = void 0;
const users_1 = require("../handlers/users");
const _1 = require("../handlers/_");
const capability_1 = require("../capabilities/express/capability"); // Import Express capability factory
class UsersAdapter {
    constructor() {
        // Initialize capabilities
        this.initializeHandler();
    }
    // Method to initialize handler with Express capabilities
    initializeHandler() {
        return __awaiter(this, void 0, void 0, function* () {
            const expressFactory = new capability_1.ExpressCapabilityFactory();
            const capabilities = yield expressFactory.createCapabilities(["log"]);
            // Pass the capabilities to the handler
            this.handler = new users_1.UsersHandler(capabilities);
        });
    }
    // Express route handler for GET requests
    get(req, res) {
        // Create an instance of your custom Request class
        const internalReq = new _1.Request(req.method, req.headers, req.body, `${req.protocol}://${req.get('host')}${req.originalUrl}`);
        // Invoke the handler method and handle response
        this.handler.get(internalReq)
            .then((handlerResponse) => {
            res.status(handlerResponse.statusCode)
                .set(handlerResponse.headers)
                .json(handlerResponse.body);
        })
            .catch((error) => {
            console.error("Error processing request:", error);
            res.status(500).json({ error: "Internal Server Error" });
        });
    }
    // Express route handler for POST requests
    post(req, res) {
        // Create an instance of your custom Request class
        const internalReq = new _1.Request(req.method, req.headers, req.body, `${req.protocol}://${req.get('host')}${req.originalUrl}`);
        // Invoke the handler method and handle response
        this.handler.post(internalReq)
            .then((handlerResponse) => {
            res.status(handlerResponse.statusCode)
                .set(handlerResponse.headers)
                .json(handlerResponse.body);
        })
            .catch((error) => {
            console.error("Error processing request:", error);
            res.status(500).json({ error: "Internal Server Error" });
        });
    }
}
exports.UsersAdapter = UsersAdapter;

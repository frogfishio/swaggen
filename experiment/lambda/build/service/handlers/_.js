"use strict";
// Auto-generated by Invoker Generator
// This file contains the Request, Response, and BaseHandler classes.
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
exports.BaseHandler = exports.Response = exports.Request = void 0;
class Request {
    constructor(method, headers = {}, body = null, url = "") {
        this.method = method.toUpperCase(); // Ensure HTTP method is uppercase
        this.headers = this.normalizeHeaders(headers);
        this.body = body;
        this.url = url;
        this.urlInstance = new URL(url);
    }
    // Utility to get query parameters
    getQueryParam(name) {
        return this.urlInstance.searchParams.get(name);
    }
    // Utility to get all query parameters as an object
    getAllQueryParams() {
        return Object.fromEntries(this.urlInstance.searchParams.entries());
    }
    // Utility to get a header value (case-insensitive)
    getHeader(name) {
        return this.headers[name.toLowerCase()] || null;
    }
    // Utility to normalize headers (case-insensitive storage)
    normalizeHeaders(headers) {
        const normalizedHeaders = {};
        for (const [key, value] of Object.entries(headers)) {
            normalizedHeaders[key.toLowerCase()] = value;
        }
        return normalizedHeaders;
    }
    // Utility to safely parse JSON body
    parseJsonBody() {
        if (typeof this.body === "string") {
            try {
                return JSON.parse(this.body);
            }
            catch (error) {
                console.warn("Failed to parse JSON body:", error);
                return null;
            }
        }
        return this.body;
    }
    // Get path name from URL
    get path() {
        return this.urlInstance.pathname;
    }
}
exports.Request = Request;
class Response {
    constructor(statusCode = 200, headers = {}, body = null) {
        this.statusCode = statusCode;
        this.headers = this.normalizeHeaders(headers);
        this.body = body;
    }
    // Set status code
    setStatus(code) {
        this.statusCode = code;
        return this;
    }
    // Add or update a header
    setHeader(name, value) {
        this.headers[name.toLowerCase()] = value;
        return this;
    }
    // Convenience method to set multiple headers
    setHeaders(headers) {
        for (const [key, value] of Object.entries(headers)) {
            this.setHeader(key, value);
        }
        return this;
    }
    // Send a JSON response
    sendJson(body) {
        this.setHeader("Content-Type", "application/json");
        this.body = body;
        return this;
    }
    // Normalize headers (case-insensitive)
    normalizeHeaders(headers) {
        const normalizedHeaders = {};
        for (const [key, value] of Object.entries(headers)) {
            normalizedHeaders[key.toLowerCase()] = value;
        }
        return normalizedHeaders;
    }
}
exports.Response = Response;
class BaseHandler {
    constructor(capabilities) {
        this.logger = null;
        this.capabilities = capabilities;
        if (capabilities && capabilities.logging) {
            this.logger = capabilities.logging;
        }
    }
    // Handle GET request
    get(req) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.info("GET request received");
            return this.methodNotImplemented("GET");
        });
    }
    // Handle POST request
    post(req) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.info("POST request received");
            return this.methodNotImplemented("POST");
        });
    }
    // Handle PUT request
    put(req) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.info("PUT request received");
            return this.methodNotImplemented("PUT");
        });
    }
    // Handle DELETE request
    delete(req) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.info("DELETE request received");
            return this.methodNotImplemented("DELETE");
        });
    }
    // Handle PATCH request
    patch(req) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.info("PATCH request received");
            return this.methodNotImplemented("PATCH");
        });
    }
    // Handle HEAD request
    head(req) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.info("HEAD request received");
            return this.methodNotImplemented("HEAD");
        });
    }
    // Handle OPTIONS request
    options(req) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.info("OPTIONS request received");
            return this.methodNotImplemented("OPTIONS");
        });
    }
    // Utility to return a 501 Not Implemented response
    methodNotImplemented(method) {
        var _a;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.warn(`${method} method not implemented`);
        return new Response(501, { "Content-Type": "application/json" }, { error: `${method} method not implemented` });
    }
    // Utility to return a 400 Bad Request response
    badRequest(message = "Bad Request") {
        var _a;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.warn(`Bad Request: ${message}`);
        return new Response(400, { "Content-Type": "application/json" }, { error: message });
    }
    // Utility to return a 401 Unauthorized response
    unauthorized(message = "Unauthorized") {
        var _a;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.warn(`Unauthorized: ${message}`);
        return new Response(401, { "Content-Type": "application/json" }, { error: message });
    }
    // Utility to return a 403 Forbidden response
    forbidden(message = "Forbidden") {
        var _a;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.warn(`Forbidden: ${message}`);
        return new Response(403, { "Content-Type": "application/json" }, { error: message });
    }
    // Utility to return a 404 Not Found response
    notFound(message = "Not Found") {
        var _a;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.warn(`Not Found: ${message}`);
        return new Response(404, { "Content-Type": "application/json" }, { error: message });
    }
    // Utility to return a 409 Conflict response
    conflict(message = "Conflict") {
        var _a;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.warn(`Conflict: ${message}`);
        return new Response(409, { "Content-Type": "application/json" }, { error: message });
    }
    // Utility to return a 422 Unprocessable Entity response
    unprocessableEntity(message = "Unprocessable Entity") {
        var _a;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.warn(`Unprocessable Entity: ${message}`);
        return new Response(422, { "Content-Type": "application/json" }, { error: message });
    }
    // Utility to return a 500 Internal Server Error response
    internalServerError(message = "Internal Server Error") {
        var _a;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.error(`Internal Server Error: ${message}`);
        return new Response(500, { "Content-Type": "application/json" }, { error: message });
    }
    // Utility to return a 503 Service Unavailable response
    serviceUnavailable(message = "Service Unavailable") {
        var _a;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.warn(`Service Unavailable: ${message}`);
        return new Response(503, { "Content-Type": "application/json" }, { error: message });
    }
}
exports.BaseHandler = BaseHandler;

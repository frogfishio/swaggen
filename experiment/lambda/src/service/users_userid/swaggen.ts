// Auto-generated by Invoker Generator
// This file contains the SwaggenRequest, SwaggenResponse, and BaseHandler classes.

import { Capabilities, LoggingCapability } from "@frogfish/swaggen-types"; // Import capabilities and logger types
import Ajv, { JSONSchemaType } from "ajv"; // JSON schema validation

const ajv = new Ajv();

export class SwaggenRequest {
  method: string;
  headers: Record<string, string>;
  body: any;
  url: string;

  private urlInstance: URL | null;
  private parsedBody: any;

  constructor(
    method: string,
    headers: Record<string, string> = {},
    body: any = null,
    url: string = ""
  ) {
    this.method = method.toUpperCase();
    this.headers = this.normalizeHeaders(headers);
    this.body = body;
    this.url = url;

    // Safe URL parsing with error handling
    try {
      this.urlInstance = new URL(url);
    } catch {
      console.warn("Invalid URL provided:", url);
      this.urlInstance = null;
    }

    // Parse the body based on the Content-Type header
    this.parsedBody = this.parseBody();
  }

  /**
   * Parses the body based on the `Content-Type` header.
   * Supports `application/json` and `application/x-www-form-urlencoded`.
   * @returns Parsed body as an object or null if parsing fails.
   */
   private parseBody<T = any>(): T | null {
    if (typeof this.body === "string") {
      const contentType = this.getHeader("content-type") || "";
  
      try {
        if (contentType.includes("application/json")) {
          return JSON.parse(this.body);
        } else if (contentType.includes("application/x-www-form-urlencoded")) {
          return Object.fromEntries(new URLSearchParams(this.body)) as Record<string, string> as T;
        }
      } catch (error) {
        console.warn("Failed to parse body:", error);
        return null;
      }
    }
    return this.body as T;
  }
  
  /**
   * Retrieve a query parameter as a string.
   * @param name The name of the query parameter.
   * @returns The parameter value or null if not present.
   */
  getQueryParam(name: string): string | null {
    return this.urlInstance?.searchParams.get(name) || null;
  }

  /**
   * Retrieve a query parameter as a number.
   * @param name The name of the query parameter.
   * @returns The parameter value as a number, or null if not present or not a valid number.
   */
  getQueryParamAsNumber(name: string): number | null {
    const value = this.getQueryParam(name);
    const num = parseFloat(value || "");
    return isNaN(num) ? null : num;
  }

  /**
   * Retrieve a query parameter as a boolean.
   * Recognizes 'true' as true, and 'false' as false.
   * @param name The name of the query parameter.
   * @returns The parameter value as a boolean or null if not valid.
   */
  getQueryParamAsBoolean(name: string): boolean | null {
    const value = this.getQueryParam(name);
    if (value === "true") return true;
    if (value === "false") return false;
    return null;
  }

  /**
   * Retrieve all query parameters as an object.
   * @returns An object representing all query parameters.
   */
  getAllQueryParams(): Record<string, string> {
    return this.urlInstance ? Object.fromEntries(this.urlInstance.searchParams.entries()) : {};
  }

  /**
   * Retrieve a header value (case-insensitive).
   * @param name The name of the header.
   * @returns The header value or null if not present.
   */
  getHeader(name: string): string | null {
    return this.headers[name.toLowerCase()] || null;
  }

  /**
   * Normalizes headers to be case-insensitive by storing in lowercase.
   * @param headers An object representing request headers.
   * @returns A normalized headers object.
   */
  private normalizeHeaders(headers: Record<string, string>): Record<string, string> {
    const normalizedHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      normalizedHeaders[key.toLowerCase()] = value;
    }
    return normalizedHeaders;
  }

  /**
   * Retrieve the path from the URL.
   * @returns The path string from the URL or an empty string if URL is invalid.
   */
  get path(): string {
    return this.urlInstance?.pathname || "";
  }

  /**
   * Validates the parsed body against a JSON schema.
   * @param schema A JSON schema used to validate the request body.
   * @returns The validated body as type T, or null if validation fails.
   */
  validateBody<T>(schema: JSONSchemaType<T>): T | null {
    if (!this.parsedBody) {
      console.warn("No body to validate");
      return null;
    }

    const validate = ajv.compile(schema);
    if (!validate(this.parsedBody)) {
      console.warn("Body validation failed:", validate.errors);
      return null;
    }
    return this.parsedBody as T;
  }
}

export class SwaggenResponse<T = any> {
  statusCode: number;
  headers: Record<string, string>;
  body: T;

  constructor(
    statusCode: number = 200,
    headers: Record<string, string> = {},
    body: T = null as any
  ) {
    this.statusCode = this.validateStatusCode(statusCode);
    this.headers = this.normalizeHeaders(headers);
    this.body = body;
  }

  /**
   * Set the status code with validation.
   * @param code HTTP status code.
   * @returns The response instance.
   */
  setStatus(code: number): this {
    this.statusCode = this.validateStatusCode(code);
    return this;
  }

  /**
   * Add or update a header, case-insensitive.
   * @param name Header name.
   * @param value Header value.
   * @returns The response instance.
   */
  setHeader(name: string, value: string): this {
    this.headers[name.toLowerCase()] = value;
    return this;
  }

  /**
   * Set multiple headers at once.
   * @param headers Record of headers.
   * @returns The response instance.
   */
  setHeaders(headers: Record<string, string>): this {
    for (const [key, value] of Object.entries(headers)) {
      this.setHeader(key, value);
    }
    return this;
  }

  /**
   * Retrieve a header value (case-insensitive).
   * @param name The header name.
   * @returns The header value, or null if not present.
   */
  getHeader(name: string): string | null {
    return this.headers[name.toLowerCase()] || null;
  }

  /**
   * Send a JSON response with the correct header.
   * @param body The response body of type T.
   * @returns The response instance.
   */
  sendJson(body: T): this {
    this.setHeader("Content-Type", "application/json");
    this.body = body;
    return this;
  }

  /**
   * Send a plain text response with the correct header.
   * @param body The response body as a string.
   * @returns The response instance.
   */
  sendText(body: string): this {
    this.setHeader("Content-Type", "text/plain");
    this.body = body as any;
    return this;
  }

  /**
   * Send an HTML response with the correct header.
   * @param body The response body as HTML content.
   * @returns The response instance.
   */
  sendHtml(body: string): this {
    this.setHeader("Content-Type", "text/html");
    this.body = body as any;
    return this;
  }

  /**
   * Send an error response with a message and optional status code.
   * @param message Error message.
   * @param code HTTP status code (defaults to 500).
   * @returns The response instance.
   */
  sendError(message: string, code: number = 500): this {
    this.setStatus(code);
    this.setHeader("Content-Type", "application/json");
    this.body = { error: message } as any;
    return this;
  }

  /**
   * Normalize headers to be case-insensitive by storing in lowercase.
   * @param headers The headers object.
   * @returns A normalized headers object.
   */
  private normalizeHeaders(headers: Record<string, string>): Record<string, string> {
    const normalizedHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      normalizedHeaders[key.toLowerCase()] = value;
    }
    return normalizedHeaders;
  }

  /**
   * Validate the status code, ensuring it falls within the standard range.
   * @param code HTTP status code.
   * @returns The validated status code.
   */
  private validateStatusCode(code: number): number {
    if (code < 100 || code > 599) {
      console.warn(`Invalid status code ${code}; defaulting to 500.`);
      return 500;
    }
    return code;
  }
}

interface Handler {
  get?(req: SwaggenRequest): Promise<SwaggenResponse>;
  post?(req: SwaggenRequest): Promise<SwaggenResponse>;
  put?(req: SwaggenRequest): Promise<SwaggenResponse>;
  delete?(req: SwaggenRequest): Promise<SwaggenResponse>;
}

export class SwaggenHandler implements Handler {
  protected capabilities?: Capabilities;
  protected logger: LoggingCapability | null = null;

  constructor(capabilities?: Capabilities) {
    this.capabilities = capabilities;

    if (capabilities && capabilities.logging) {
      this.logger = capabilities.logging;
    }
  }

  // Handle GET request
  public async get(req: SwaggenRequest): Promise<SwaggenResponse> {
    this.logger?.info("GET request received");
    return this.methodNotImplemented("GET");
  }

  // Handle POST request
  public async post(req: SwaggenRequest): Promise<SwaggenResponse> {
    this.logger?.info("POST request received");
    return this.methodNotImplemented("POST");
  }

  // Handle PUT request
  public async put(req: SwaggenRequest): Promise<SwaggenResponse> {
    this.logger?.info("PUT request received");
    return this.methodNotImplemented("PUT");
  }

  // Handle DELETE request
  public async delete(req: SwaggenRequest): Promise<SwaggenResponse> {
    this.logger?.info("DELETE request received");
    return this.methodNotImplemented("DELETE");
  }

  // Handle PATCH request
  public async patch(req: SwaggenRequest): Promise<SwaggenResponse> {
    this.logger?.info("PATCH request received");
    return this.methodNotImplemented("PATCH");
  }

  // Handle HEAD request
  public async head(req: SwaggenRequest): Promise<SwaggenResponse> {
    this.logger?.info("HEAD request received");
    return this.methodNotImplemented("HEAD");
  }

  // Handle OPTIONS request
  public async options(req: SwaggenRequest): Promise<SwaggenResponse> {
    this.logger?.info("OPTIONS request received");
    return this.methodNotImplemented("OPTIONS");
  }

  // Utility to return a 501 Not Implemented response
  protected methodNotImplemented(method: string): SwaggenResponse {
    this.logger?.warn(`${method} method not implemented`);
    return new SwaggenResponse(501, { "Content-Type": "application/json" }, { error: `${method} method not implemented` });
  }

  // Utility to return a 400 Bad Request response
  protected badRequest(message: string = "Bad Request"): SwaggenResponse {
    this.logger?.warn(`Bad Request: ${message}`);
    return new SwaggenResponse(400, { "Content-Type": "application/json" }, { error: message });
  }

  // Utility to return a 401 Unauthorized response
  protected unauthorized(message: string = "Unauthorized"): SwaggenResponse {
    this.logger?.warn(`Unauthorized: ${message}`);
    return new SwaggenResponse(401, { "Content-Type": "application/json" }, { error: message });
  }

  // Utility to return a 403 Forbidden response
  protected forbidden(message: string = "Forbidden"): SwaggenResponse {
    this.logger?.warn(`Forbidden: ${message}`);
    return new SwaggenResponse(403, { "Content-Type": "application/json" }, { error: message });
  }

  // Utility to return a 404 Not Found response
  protected notFound(message: string = "Not Found"): SwaggenResponse {
    this.logger?.warn(`Not Found: ${message}`);
    return new SwaggenResponse(404, { "Content-Type": "application/json" }, { error: message });
  }

  // Utility to return a 409 Conflict response
  protected conflict(message: string = "Conflict"): SwaggenResponse {
    this.logger?.warn(`Conflict: ${message}`);
    return new SwaggenResponse(409, { "Content-Type": "application/json" }, { error: message });
  }

  // Utility to return a 422 Unprocessable Entity response
  protected unprocessableEntity(message: string = "Unprocessable Entity"): SwaggenResponse {
    this.logger?.warn(`Unprocessable Entity: ${message}`);
    return new SwaggenResponse(422, { "Content-Type": "application/json" }, { error: message });
  }

  // Utility to return a 500 Internal Server Error response
  protected internalServerError(message: string = "Internal Server Error"): SwaggenResponse {
    this.logger?.error(`Internal Server Error: ${message}`);
    return new SwaggenResponse(500, { "Content-Type": "application/json" }, { error: message });
  }

  // Utility to return a 503 Service Unavailable response
  protected serviceUnavailable(message: string = "Service Unavailable"): SwaggenResponse {
    this.logger?.warn(`Service Unavailable: ${message}`);
    return new SwaggenResponse(503, { "Content-Type": "application/json" }, { error: message });
  }
}
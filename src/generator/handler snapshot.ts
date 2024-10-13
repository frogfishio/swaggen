// handler.ts

import * as path from "path";
import * as fs from "fs";
import { OpenAPIV3 } from "openapi-types"; // Import OpenAPI types
import { generateInterfaceDefinitions } from "./handler.types"; // Import the updated function

export class HandlerGenerator {
  constructor(private outputPath: string) {}

  public generate(
    endpoint: string,
    methods: Record<string, OpenAPIV3.OperationObject>
  ): void {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const className = this.toPascalCase(normalizedEndpoint) + "Handler";

    // Create the new folder structure: <out>/<normalizedEndpoint>
    const targetDir = path.join(this.outputPath, normalizedEndpoint);
    this.ensureDirectoryExists(targetDir);

    // File paths for handler.ts and handler.base.ts
    const handlerFilePath = path.join(targetDir, `handler.ts`);
    const baseFilePath = path.join(targetDir, `handler.base.ts`);

    // Generate interface definitions and import statements using handler.types.ts
    const { imports, interfaces } = generateInterfaceDefinitions(endpoint, methods);

    // Generate method implementations
    const methodImplementations = Object.keys(methods).map((method) =>
      this.generateMethodImplementation(method.toLowerCase(), methods[method])
    );

    // Generate error override methods
    const errorOverrides = Object.keys(methods).flatMap((method) =>
      this.generateErrorOverrideMethods(method.toLowerCase(), methods[method])
    );

    // Combine all parts to form the complete handler.ts content
    const handlerContent = this.buildHandlerContent(
      imports,
      interfaces,
      className,
      methodImplementations,
      errorOverrides
    );

    // Write the handler.ts file
    fs.writeFileSync(handlerFilePath, handlerContent, "utf8");
    console.log(`Created handler file: ${handlerFilePath}`);

    // Generate handler.base.ts from base content
    this.generateBaseFile(baseFilePath);
  }

  /**
   * Builds the complete content for handler.ts.
   *
   * @param imports - Import statements for complex types.
   * @param interfaces - Interface definitions.
   * @param className - Name of the handler class.
   * @param methodImplementations - Array of method implementations.
   * @param errorOverrides - Array of error override method implementations.
   * @returns The complete handler.ts content as a string.
   */
  private buildHandlerContent(
    imports: string,
    interfaces: string,
    className: string,
    methodImplementations: string[],
    errorOverrides: string[]
  ): string {
    // Base imports
    const baseImports = `import { BaseHandler, Request, Response } from "./handler.base";`;

    // Start building the content
    let content = "";

    // Add auto-generated imports for complex types
    if (imports.trim()) {
      content += `// Auto-generated imports\n${imports}\n\n`;
    }

    // Add auto-generated interfaces
    if (interfaces.trim()) {
      content += `// Auto-generated interfaces\n${interfaces}\n\n`;
    }

    // Add base imports
    content += `// Base imports\n${baseImports}\n\n`;

    // Add class declaration
    content += `// Auto-generated by Handler Generator\n// Handler class for ${className}\n\n`;
    content += `export class ${className} extends BaseHandler {\n\n`;

    // Add method implementations
    methodImplementations.forEach((method) => {
      content += `${method}\n\n`;
    });

    // Add error override methods
    errorOverrides.forEach((errorMethod) => {
      content += `${errorMethod}\n\n`;
    });

    // Close class
    content += `}\n`;

    return content;
  }

  /**
   * Generates handler.base.ts with predefined content.
   *
   * @param filePath - Path to the handler.base.ts file.
   */
  private generateBaseFile(filePath: string) {
    const baseContent = `// handler.base.ts

export class BaseHandler {
  protected badRequest(message: string): Response {
    return new Response(400, { "Content-Type": "application/json" }, { error: message });
  }

  protected unauthorized(message: string): Response {
    return new Response(401, { "Content-Type": "application/json" }, { error: message });
  }

  protected forbidden(message: string): Response {
    return new Response(403, { "Content-Type": "application/json" }, { error: message });
  }

  protected notFound(message: string): Response {
    return new Response(404, { "Content-Type": "application/json" }, { error: message });
  }

  protected internalServerError(message: string): Response {
    return new Response(500, { "Content-Type": "application/json" }, { error: message });
  }
}
`;

    // Write the handler.base.ts file
    fs.writeFileSync(filePath, baseContent, "utf8");
    console.log(`Created base handler file: ${filePath}`);
  }

  /**
   * Ensure a directory exists, and if not, create it.
   *
   * @param dirPath - Path to the directory.
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Normalize the endpoint to create a file name.
   *
   * @param endpoint - The API endpoint (e.g., "/users/{userId}").
   * @returns A normalized string suitable for file naming.
   */
  private normalizeEndpoint(endpoint: string): string {
    return endpoint
      .replace(/^\//, "")
      .replace(/\//g, "_")
      .replace(/[{}]/g, "")
      .toLowerCase();
  }

  /**
   * Convert a string to PascalCase.
   *
   * @param str - The input string.
   * @returns The PascalCase version of the string.
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/(^\w|_\w)/g, (match) =>
        match.replace("_", "").toUpperCase()
      );
  }

  /**
   * Generate method implementation for a specific HTTP verb.
   *
   * @param method - The HTTP method in lowercase (e.g., "get", "post").
   * @param methodSpec - The OpenAPI OperationObject for the method.
   * @returns A string containing the method implementation.
   */
  private generateMethodImplementation(
    method: string,
    methodSpec: OpenAPIV3.OperationObject
  ): string {
    // Extract path parameter validation logic
    const validationCode = this.generateValidationCode(methodSpec.parameters);

    // Get the type for request body (if any)
    let requestBodyType = "any";
    if (methodSpec.requestBody) {
      const requestBody = methodSpec.requestBody as OpenAPIV3.RequestBodyObject;
      const content = requestBody.content["application/json"];
      if (content && content.schema) {
        if ("$ref" in content.schema) {
          // schema is a ReferenceObject
          requestBodyType = this.extractRefName(content.schema.$ref);
        } else if (content.schema.type === "object" && content.schema.properties) {
          // If the schema is an inline object without $ref, you might want to handle it differently
          requestBodyType = "any";
        }
      }
    }

    // Construct the method implementation
    let methodImpl = `  public async ${method}(req: Request): Promise<Response> {\n`;

    if (validationCode.trim()) {
      methodImpl += `${validationCode}`;
    }

    methodImpl += `    // TODO: Implement ${method.toUpperCase()} logic\n`;

    if (methodSpec.requestBody) {
      methodImpl += `    // If request body type is needed: (req.body as ${requestBodyType}Request)\n`;
    }

    methodImpl += `    return new Response(200, { "Content-Type": "application/json" }, { message: "${method.toUpperCase()} method called" });\n`;
    methodImpl += `  }`;

    return methodImpl;
  }

  /**
   * Generate validation code for path parameters.
   *
   * @param parameters - Array of parameters for the operation.
   * @returns A string containing validation code.
   */
  private generateValidationCode(
    parameters?: (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[]
  ): string {
    if (!parameters) return "";

    const validationLines: string[] = [];

    parameters.forEach((param) => {
      if ("in" in param && param.in === "path" && param.schema) {
        const paramName = param.name;

        if ("$ref" in param.schema) {
          // param.schema is a ReferenceObject
          const refName = this.extractRefName(param.schema.$ref);
          // Handle the reference if necessary
        } else {
          // param.schema is a SchemaObject
          const paramSchema = param.schema as OpenAPIV3.SchemaObject;
          const paramType = paramSchema.type;
          const paramFormat = paramSchema.format;
          const paramPattern = paramSchema.pattern;

          // Extract the parameter value safely from the path
          validationLines.push(
            `    const ${paramName} = req.path.split("/").pop() || ""; // Fallback to empty string if undefined`
          );

          // Check type and pattern validations
          if (paramType === "string" && paramFormat === "uuid") {
            validationLines.push(
              `    if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(${paramName})) {\n` +
                `      return this.badRequest("Invalid UUID format for ${paramName}");\n` +
                `    }`
            );
          } else if (paramPattern) {
            validationLines.push(
              `    if (!/${paramPattern}/.test(${paramName})) {\n` +
                `      return this.badRequest("Invalid format for ${paramName}");\n` +
                `    }`
            );
          }
        }
      }
    });

    return validationLines.join("\n") + "\n";
  }

  /**
   * Generate custom override methods for error handling based on responses.
   *
   * @param method - The HTTP method in lowercase (e.g., "get", "post").
   * @param methodSpec - The OpenAPI OperationObject for the method.
   * @returns An array of strings containing error override method implementations.
   */
  private generateErrorOverrideMethods(
    method: string,
    methodSpec: OpenAPIV3.OperationObject
  ): string[] {
    const errorMethods: string[] = [];

    Object.keys(methodSpec.responses).forEach((statusCode) => {
      const response = methodSpec.responses[
        statusCode
      ] as OpenAPIV3.ResponseObject;

      if (statusCode.startsWith("4") || statusCode.startsWith("5")) {
        const message = response.description || "Error";
        let handlerMethodName = "";

        // Map status codes to handler method names
        switch (statusCode) {
          case "400":
            handlerMethodName = `${method}BadRequest`;
            break;
          case "401":
            handlerMethodName = `${method}Unauthorized`;
            break;
          case "403":
            handlerMethodName = `${method}Forbidden`;
            break;
          case "404":
            handlerMethodName = `${method}NotFound`;
            break;
          case "500":
            handlerMethodName = `${method}InternalServerError`;
            break;
          default:
            handlerMethodName = `${method}CustomError_${statusCode}`;
        }

        // Generate custom override method
        const errorMethod =
          `  protected ${handlerMethodName}(): Response {\n` +
          `    return super.${this.getBaseHandlerMethod(statusCode)}("${message}");\n` +
          `  }`;
        errorMethods.push(errorMethod);
      }
    });

    return errorMethods;
  }

  /**
   * Map status code to appropriate BaseHandler method.
   *
   * @param statusCode - The HTTP status code.
   * @returns The corresponding BaseHandler method name.
   */
  private getBaseHandlerMethod(statusCode: string): string {
    switch (statusCode) {
      case "400":
        return "badRequest";
      case "401":
        return "unauthorized";
      case "403":
        return "forbidden";
      case "404":
        return "notFound";
      case "500":
        return "internalServerError";
      default:
        return "internalServerError"; // Default to internal server error for unknown status codes
    }
  }

  /**
   * Extract reference name from a $ref string.
   *
   * @param ref - The $ref string.
   * @returns The extracted reference name.
   */
  private extractRefName(ref: string): string {
    return ref.split("/").pop() || "UnknownType";
  }
}
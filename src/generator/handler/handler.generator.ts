// handler.ts

import ejs from "ejs"; // Import EJS
import * as path from "path";
import * as fs from "fs";
import { OpenAPIV3 } from "openapi-types"; // Import OpenAPI types
import { generateInterfaceDefinitions } from "./handler-types.generator"; // Import the updated function
import { HandlerProxyGenerator } from "./handler-proxy.generator"; // Import the proxy generator

import { HandlerStubGenerator } from "./handler-stub.generator";

import {
  toPascalCase,
  normalizeEndpoint,
  ensureOutputDirectory,
  extractRefName,
  capitalizeFirstLetter,
  getMethodName,
  extractEntityName,
} from "../util";

// Replace the local `toPascalCase` and `extractRefName` with imports from `handlers-util.ts`
export class HandlerGenerator {
  constructor(private outputPath: string) {}

  public generate(
    endpoint: string,
    methods: Record<string, OpenAPIV3.OperationObject>
  ): void {
    const normalizedEndpoint = normalizeEndpoint(endpoint);
    const className = toPascalCase(normalizedEndpoint);

    // Create the new folder structure: <out>/<normalizedEndpoint>
    const targetDir = path.join(this.outputPath, normalizedEndpoint);
    ensureOutputDirectory(targetDir);

    // File paths for handler.ts and handler.base.ts
    const handlerFilePath = path.join(targetDir, `handler.ts`);
    const baseFilePath = path.join(targetDir, `handler.base.ts`);

    // Generate interface definitions and import statements using handler.types.ts
    const { imports, interfaces } = generateInterfaceDefinitions(
      endpoint,
      methods
    );

    // Create Sets to track used types for import purposes
    const usedTypes = new Set<string>(); // For request/response types
    const schemaTypes = new Set<string>(); // For schema types

    // Generate method implementations and collect used types
    const methodImplementations = Object.keys(methods).map((method) =>
      this.generateMethodImplementation(
        method.toLowerCase(),
        methods[method],
        className,
        usedTypes, // Pass the usedTypes set here
        schemaTypes // Pass the schemaTypes set here
      )
    );

    // Generate error override methods
    const errorOverrides = Object.keys(methods).flatMap((method) =>
      this.generateErrorOverrideMethods(method.toLowerCase(), methods[method])
    );

    // Combine all parts to form the complete handler.ts content
    const handlerContent = this.buildHandlerContent(
      imports,
      className,
      methodImplementations,
      errorOverrides,
      usedTypes, // Pass usedTypes here to include necessary imports
      schemaTypes // Pass schemaTypes here to include necessary imports
    );

    // Write the handler.ts file
    fs.writeFileSync(handlerFilePath, handlerContent, "utf8");
    console.log(`Created handler file: ${handlerFilePath}`);

    // Generate handler.base.ts from base content
    this.generateBaseFile(baseFilePath);

    // Call the proxy generator after generating the handler
    const proxyGenerator = new HandlerProxyGenerator(this.outputPath);
    proxyGenerator.generateProxy(endpoint, methods); // Proxy generation call

    // Call the stub generator after generating the proxy
    const stubGenerator = new HandlerStubGenerator(this.outputPath);
    stubGenerator.generateStub(endpoint, methods); // Stub generation call
  }

  /**
   * Builds the complete content for handler.ts.
   *
   * @param imports - Import statements for complex types.
   * @param className - Name of the handler class.
   * @param methodImplementations - Array of method implementations.
   * @param errorOverrides - Array of error override method implementations.
   * @param usedTypes - Set of types used within the handler that need to be imported.
   * @returns The complete handler.ts content as a string.
   */
  private buildHandlerContent(
    imports: string,
    className: string,
    methodImplementations: string[],
    errorOverrides: string[],
    usedTypes: Set<string>, // Request/response types
    schemaTypes: Set<string> // Schema types
  ): string {
    // Base imports
    const baseImports = `import { BaseHandler, Request, Response } from "./handler.base";`;

    // Import the proxy and stub correctly, separating the imports
    const proxyImport = `import { ${className}Proxy } from "./proxy";`;
    const stubImport = `import { ${className}Stub } from "./stub";`;

    // Generate imports for the types used in the method signatures
    const typeImports = this.generateTypeImports(usedTypes);

    // Collect schema imports separately from the given imports
    const schemaImports = this.generateSchemaImports(schemaTypes);

    // Start building the content
    let content = "";

    // Add base imports
    content += `// Base imports\n${baseImports}\n\n`;

    // Add schema imports
    if (schemaImports.trim()) {
      content += `// Schema imports\n${schemaImports}\n\n`;
    }

    // Add proxy import
    content += `// Proxy import\n${proxyImport}\n\n`;

    // Add stub import
    content += `// Stub import\n${stubImport}\n\n`;

    // Add type imports from proxy
    if (typeImports.trim()) {
      content += `// Type imports from proxy\n${typeImports}\n\n`;
    }

    // Add class declaration
    content += `// Auto-generated by Handler Generator\n// Handler class for ${className}\n\n`;
    content += `export class ${className}Handler extends BaseHandler {\n\n`;

    // Instantiate proxy
    content += `\tprivate proxy: ${className}Proxy = new ${className}Stub();\n\n`;

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
   * Generates import statements for the used types in the handler from the proxy.
   *
   * @param usedTypes - A set of types used in the handler.
   * @returns A string representing the import statements.
   */
  private generateTypeImports(usedTypes: Set<string>): string {
    if (usedTypes.size === 0) return "";

    const typesArray = Array.from(usedTypes).sort(); // Sort for consistent order
    return `import { ${typesArray.join(", ")} } from "./proxy";`;
  }

  /**
   * Generates import statements for schemas from the correct location.
   *
   * @param imports - The existing imports for types (often from the proxy).
   * @returns The updated import statements that correctly reference schemas from "../schema/<file>".
   */
  private generateSchemaImports(schemaTypes: Set<string>): string {
    if (schemaTypes.size === 0) return "";

    const schemaImportLines: string[] = [];
    schemaTypes.forEach((type) => {
      // Assuming each schema type is in a separate file named after the type
      const schemaImport = `import { ${type} } from "../schema/${type.toLowerCase()}";`;
      schemaImportLines.push(schemaImport);
    });

    return schemaImportLines.join("\n");
  }

  // Get the template path
  private getTemplatePath(templateFile: string): string {
    const templateRoot =
      process.env.SWAGGEN_TEMPLATE_ROOT ||
      path.join(__dirname, "..", "templates");
    return path.join(templateRoot, templateFile);
  }

  /**
   * Generates handler.base.ts with predefined content.
   *
   * @param filePath - Path to the handler.base.ts file.
   */
  private generateBaseFile(filePath: string) {
    const templatePath = this.getTemplatePath("base.ejs");
    const template = fs.readFileSync(templatePath, "utf8");

    // Render the base.ejs template (you can pass any necessary variables here)
    const baseContent = ejs.render(template, {});

    // Write the handler.base.ts file with the generated content
    fs.writeFileSync(filePath, baseContent.trim(), "utf8");
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
   * Generate method implementation for a specific HTTP verb.
   *
   * @param method - The HTTP method in lowercase (e.g., "get", "post").
   * @param methodSpec - The OpenAPI OperationObject for the method.
   * @param className - Name of the handler class.
   * @returns A string containing the method implementation.
   */
  private generateMethodImplementation(
    method: string,
    methodSpec: OpenAPIV3.OperationObject,
    className: string,
    usedTypes: Set<string>,
    schemaTypes: Set<string>
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
          // Schema is a ReferenceObject, extract the reference name
          requestBodyType = extractRefName(content.schema.$ref);
          schemaTypes.add(requestBodyType); // Track as a schema type
        } else if (
          content.schema.type === "object" &&
          content.schema.properties
        ) {
          // If the schema is an inline object without $ref, handle it differently
          requestBodyType = "any";
        }
      }
    }

    // Generate proxy method signature for the comment
    const proxyMethodSignature = this.generateProxyMethodSignature(
      method,
      className,
      usedTypes // Pass usedTypes here as well
    );

    // Add request type if it is not "any" or a schema
    if (requestBodyType !== "any" && !schemaTypes.has(requestBodyType)) {
      usedTypes.add(requestBodyType);
    }

    // Construct the method implementation
    let methodImpl = `  public async ${method}(req: Request): Promise<Response> {\n`;

    // Add proxy method signature as a comment
    methodImpl += `    // Proxy method signature: ${proxyMethodSignature}\n`;

    if (validationCode.trim()) {
      methodImpl += `${validationCode}`;
    }

    methodImpl += `    const result = await this.proxy.${getMethodName(method, className)}();\n`;

    methodImpl += `    // TODO: Implement ${method.toUpperCase()} logic\n`;

    if (methodSpec.requestBody && requestBodyType !== "any") {
      methodImpl += `    // If request body type is needed: (req.body as ${requestBodyType})\n`;
    }

    methodImpl += `    return new Response(200, { "Content-Type": "application/json" }, { message: "${method.toUpperCase()} method called" });\n`;
    methodImpl += `  }`;

    return methodImpl;
  }

  private generateProxyMethodSignature(
    method: string,
    endpoint: string,
    usedTypes: Set<string> // Added parameter to track used types
  ): string {
    const entityName = extractEntityName(endpoint); // Extract singular entity name from endpoint
    const methodName = getMethodName(method, entityName);
    const requestType = this.getRequestTypeName(method, endpoint);
    const responseType = this.getResponseTypeName(method, endpoint);

    // Track request and response types
    if (requestType !== "void") {
      usedTypes.add(requestType);
    }
    usedTypes.add(responseType);

    // Format the method signature
    return `${methodName}(request: ${requestType}): Promise<${responseType}>;`;
  }

  /**
   * Get the correct request type name (following handler-types.generator.ts logic).
   *
   * @param method - The HTTP method (e.g., "post", "get").
   * @param endpoint - The API endpoint (e.g., "/users").
   * @returns The correct request type name (e.g., "PostUserRequest").
   */
  private getRequestTypeName(method: string, endpoint: string): string {
    const entityName = extractEntityName(endpoint); // Extract singular entity name from endpoint
    const methodsWithoutBody = ["get", "delete", "head", "options"];
    if (methodsWithoutBody.includes(method.toLowerCase())) {
      return "void"; // No request body for these methods
    }
    return `${toPascalCase(method)}${toPascalCase(entityName)}Request`;
  }

  /**
   * Get the correct response type name (following handler-types.generator.ts logic).
   *
   * @param method - The HTTP method (e.g., "post", "get").
   * @param endpoint - The API endpoint (e.g., "/users").
   * @returns The correct response type name (e.g., "PostUserResponse").
   */
  private getResponseTypeName(method: string, endpoint: string): string {
    const entityName = extractEntityName(endpoint); // Extract singular entity name from endpoint
    return `${toPascalCase(method)}${toPascalCase(entityName)}Response`;
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
          const refName = extractRefName(param.schema.$ref);
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
}

import * as path from "path";
import * as fs from "fs";

export class HandlerGenerator {
  constructor(private outputPath: string) {}

  // Generate a handler file for a specific endpoint and HTTP methods
  public generate(endpoint: string, methods: Record<string, any>): void {
    // Normalize the endpoint to create a file name (e.g., /users -> users.ts)
    const normalizedEndpoint = endpoint
      .replace(/^\//, "") // Remove leading slash
      .replace(/\//g, "_") // Replace remaining slashes with underscores
      .replace(/[{}]/g, "") // Remove curly braces
      .toLowerCase(); // Convert to lowercase

    const className = this.toPascalCase(normalizedEndpoint) + "Handler";

    // Ensure the handlers subdirectory exists
    const handlersDir = path.join(this.outputPath, "handlers");
    this.ensureDirectoryExists(handlersDir);

    // File path within handlers subdirectory
    const filePath = path.join(handlersDir, `${normalizedEndpoint}.ts`);

    // Extract types to import from the method definitions
    const typesToImport = this.extractTypesToImport(methods);

    // Generate the class content based on available methods
    const classContent = this.generateClassContent(
      className,
      methods,
      typesToImport
    );

    // Write the TypeScript file with the generated class
    fs.writeFileSync(filePath, classContent, "utf8");

    console.log(`Created handler file: ${filePath}`);
  }

  // Ensure a directory exists, and if not, create it
  private ensureDirectoryExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // Extract all types referenced in request body and responses from methods
  private extractTypesToImport(methods: Record<string, any>): Set<string> {
    const types = new Set<string>();

    Object.values(methods).forEach((method) => {
      // Check for requestBody types
      if (method.requestBody) {
        this.extractTypesFromContent(method.requestBody.content, types);
      }

      // Check for response types
      if (method.responses) {
        Object.values(method.responses).forEach((response: any) => {
          if (response.content) {
            this.extractTypesFromContent(response.content, types);
          }
        });
      }
    });

    return types;
  }

  // Extract types from content (requestBody or response content)
  private extractTypesFromContent(content: any, types: Set<string>) {
    if (
      content &&
      content["application/json"] &&
      content["application/json"].schema
    ) {
      const schema = content["application/json"].schema;
      if (schema.$ref) {
        const typeName = this.extractRefName(schema.$ref);
        types.add(typeName);
      } else if (schema.items && schema.items.$ref) {
        // Handle arrays of referenced types
        const typeName = this.extractRefName(schema.items.$ref);
        types.add(typeName);
      }
    }
  }

  // Extract reference name from a $ref string
  private extractRefName(ref: string): string {
    return ref.split("/").pop() || "";
  }

  // Generate TypeScript class content
  private generateClassContent(
    className: string,
    methods: Record<string, any>,
    typesToImport: Set<string>
  ): string {
    // Generate imports for all referenced types
    const imports = Array.from(typesToImport)
      .map(
        (type) => `import { ${type} } from "../schema/${type.toLowerCase()}";`
      )
      .join("\n");

    // Map OpenAPI verbs to the corresponding method names
    const methodImplementations = Object.keys(methods)
      .map((method) =>
        this.generateMethodImplementation(method.toLowerCase(), methods[method])
      )
      .join("\n\n");

    // Generate custom error override methods based on error responses
    const errorOverrides = Object.keys(methods)
      .map((method) =>
        this.generateErrorOverrideMethods(method.toLowerCase(), methods[method])
      )
      .join("\n\n");

    return (
      `${imports}\n` +
      `import { BaseHandler, Request, Response } from "./_";\n\n` +
      `export class ${className} extends BaseHandler {\n\n` +
      `${errorOverrides}\n` +
      `${methodImplementations}\n\n` +
      `}\n`
    );
  }

  // Generate method implementation for a specific HTTP verb
  private generateMethodImplementation(
    method: string,
    methodSpec: any
  ): string {
    // Extract path parameter validation logic
    const validationCode = this.generateValidationCode(methodSpec.parameters);

    // Get the type for request body (if any)
    let requestBodyType = "any";
    if (methodSpec.requestBody) {
      const content = methodSpec.requestBody.content["application/json"];
      if (content && content.schema && content.schema.$ref) {
        requestBodyType = this.extractRefName(content.schema.$ref);
      }
    }

    return (
      `  public async ${method}(req: Request): Promise<Response> {\n` +
      `${validationCode}` +
      `    // TODO: Implement ${method.toUpperCase()} logic\n` +
      `    // If request body type is needed: (req.body as ${requestBodyType})\n` +
      `    return new Response(200, { "Content-Type": "application/json" }, { message: "${method.toUpperCase()} method called" });\n` +
      `  }`
    );
  }

  // Generate validation code for path parameters
  private generateValidationCode(parameters: any[]): string {
    if (!parameters) return "";

    const validationLines: string[] = [];

    parameters.forEach((param) => {
      if (param.in === "path" && param.schema) {
        const paramName = param.name;
        const paramType = param.schema.type;
        const paramFormat = param.schema.format;
        const paramPattern = param.schema.pattern;

        // Extract the parameter value safely from the path
        validationLines.push(
          `    const ${paramName} = req.path.split("/").pop() || ""; // Fallback to empty string if undefined\n`
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
    });

    return validationLines.join("\n") + "\n";
  }

  // Generate custom override methods for error handling based on responses
  private generateErrorOverrideMethods(
    method: string,
    methodSpec: any
  ): string {
    const errorMethods: string[] = [];

    Object.keys(methodSpec.responses).forEach((statusCode) => {
      const response = methodSpec.responses[statusCode];
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
        errorMethods.push(
          `  protected ${handlerMethodName}(): Response {\n` +
            `    return super.${this.getBaseHandlerMethod(
              statusCode
            )}("${message}");\n` +
            `  }`
        );
      }
    });

    return errorMethods.join("\n\n");
  }

  // Map status code to appropriate BaseHandler method
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

  // Convert a string to PascalCase
  private toPascalCase(str: string): string {
    return str.replace(/(^\w|_\w)/g, (match) =>
      match.replace("_", "").toUpperCase()
    );
  }
}

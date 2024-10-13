// handler.generator.ts
import * as path from "path";
import * as fs from "fs";
import ejs from "ejs"; // Import EJS
import { OpenAPIV3 } from "openapi-types"; // Import OpenAPI types

export class HandlerGenerator {
  constructor(private outputPath: string) {}

  public generate(
    endpoint: string,
    methods: Record<string, OpenAPIV3.OperationObject>
  ): void {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const className = this.toPascalCase(normalizedEndpoint) + "Handler";
  
    // Create the new folder structure: <out>/<filename>
    const targetDir = path.join(this.outputPath, normalizedEndpoint);
    this.ensureDirectoryExists(targetDir);
  
    // File path is now <out>/<filename>/handler.ts
    const filePath = path.join(targetDir, `handler.ts`);
  
    // Extract types to import from the method definitions
    const typesToImport = Array.from(this.extractTypesToImport(methods));
  
    // Generate method implementations
    const methodImplementations = Object.keys(methods).map((method) =>
      this.generateMethodImplementation(method.toLowerCase(), methods[method])
    );
  
    // Generate error override methods
    const errorOverrides = Object.keys(methods).flatMap((method) =>
      this.generateErrorOverrideMethods(method.toLowerCase(), methods[method])
    );
  
    // Read the EJS template
    const templatePath = this.getTemplatePath("handler.ejs");
    const template = fs.readFileSync(templatePath, "utf8");
  
    // Render the template
    const classContent = ejs.render(template, {
      className,
      typesToImport,
      methodImplementations,
      errorOverrides,
    });
  
    // Write the TypeScript file with the generated class
    fs.writeFileSync(filePath, classContent.trim(), "utf8");
  
    console.log(`Created handler file: ${filePath}`);
  }

  // Ensure a directory exists, and if not, create it
  private ensureDirectoryExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // Normalize the endpoint to create a file name
  private normalizeEndpoint(endpoint: string): string {
    return endpoint
      .replace(/^\//, "")
      .replace(/\//g, "_")
      .replace(/[{}]/g, "")
      .toLowerCase();
  }

  // Convert a string to PascalCase
  private toPascalCase(str: string): string {
    return str.replace(/(^\w|_\w)/g, (match) =>
      match.replace("_", "").toUpperCase()
    );
  }

  // Get the template path
  private getTemplatePath(templateFile: string): string {
    const templateRoot =
      process.env.SWAGGEN_TEMPLATE_ROOT ||
      path.join(__dirname, "..", "templates");
    return path.join(templateRoot, templateFile);
  }

  // Extract all types referenced in request body and responses from methods
  private extractTypesToImport(
    methods: Record<string, OpenAPIV3.OperationObject>
  ): Set<string> {
    const types = new Set<string>();

    Object.values(methods).forEach((method) => {
      // Check for requestBody types
      if (method.requestBody) {
        const requestBody = method.requestBody as OpenAPIV3.RequestBodyObject;
        this.extractTypesFromContent(requestBody.content, types);
      }

      // Check for response types
      if (method.responses) {
        Object.values(method.responses).forEach((response: any) => {
          if ("$ref" in response) {
            // Response is a ReferenceObject
            // You might need to resolve the reference
          } else if (response.content) {
            this.extractTypesFromContent(response.content, types);
          }
        });
      }
    });

    return types;
  }

  // Extract types from content (requestBody or response content)
  private extractTypesFromContent(
    content: { [media: string]: OpenAPIV3.MediaTypeObject },
    types: Set<string>
  ) {
    if (
      content &&
      content["application/json"] &&
      content["application/json"].schema
    ) {
      const schema = content["application/json"].schema;

      if ("$ref" in schema) {
        // schema is a ReferenceObject
        const typeName = this.extractRefName(schema.$ref);
        types.add(typeName);
      } else {
        // schema is a SchemaObject
        const schemaObject = schema as OpenAPIV3.SchemaObject;

        if (schemaObject.type === "array" && schemaObject.items) {
          // schemaObject is an ArraySchemaObject
          const itemsSchema = schemaObject.items;

          if ("$ref" in itemsSchema) {
            // itemsSchema is a ReferenceObject
            const typeName = this.extractRefName(itemsSchema.$ref);
            types.add(typeName);
          } else {
            // itemsSchema is a SchemaObject
            // Handle nested schemas if needed
          }
        }

        // Handle other schema types if necessary
      }
    }
  }

  // Extract reference name from a $ref string
  private extractRefName(ref: string): string {
    return ref.split("/").pop() || "";
  }

  // Generate method implementation for a specific HTTP verb
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
        } else {
          // schema is a SchemaObject
          const schemaObject = content.schema as OpenAPIV3.SchemaObject;

          if (schemaObject.type === "array" && schemaObject.items) {
            // schemaObject is an ArraySchemaObject
            const itemsSchema = schemaObject.items;

            if ("$ref" in itemsSchema) {
              // itemsSchema is a ReferenceObject
              requestBodyType = this.extractRefName(itemsSchema.$ref);
            } else {
              // itemsSchema is a SchemaObject
              // Handle nested schemas if needed
            }
          }

          // Handle other schema types if necessary
        }
      }
    }

    return (
      `public async ${method}(req: Request): Promise<Response> {\n` +
      `${validationCode}` +
      `    // TODO: Implement ${method.toUpperCase()} logic\n` +
      `    // If request body type is needed: (req.body as ${requestBodyType})\n` +
      `    return new Response(200, { "Content-Type": "application/json" }, { message: "${method.toUpperCase()} method called" });\n` +
      `  }`
    );
  }

  // Generate validation code for path parameters
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
          // You might need to resolve the reference to get the actual schema
          // For validation, you might need to implement reference resolution
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

  // Generate custom override methods for error handling based on responses
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
          `protected ${handlerMethodName}(): Response {\n` +
          `    return super.${this.getBaseHandlerMethod(
            statusCode
          )}("${message}");\n` +
          `  }`;
        errorMethods.push(errorMethod);
      }
    });

    return errorMethods;
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
}
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
    const filePath = path.join(this.outputPath, `${normalizedEndpoint}.ts`);

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

    console.log(`Created file: ${filePath}`);
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
        (type) => `import { ${type} } from "./__schema/${type.toLowerCase()}";`
      )
      .join("\n");

    // Map OpenAPI verbs to the corresponding method names
    const methodImplementations = Object.keys(methods)
      .map((method) =>
        this.generateMethodImplementation(method.toLowerCase(), methods[method])
      )
      .join("\n\n");

    return (
      `${imports}\n` +
      `import { BaseHandler, Request, Response } from "./_";\n\n` +
      `export class ${className} extends BaseHandler {\n\n` +
      `${methodImplementations}\n\n` +
      `}\n`
    );
  }

  // Generate method implementation for a specific HTTP verb
  private generateMethodImplementation(
    method: string,
    methodSpec: any
  ): string {
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
      `    // TODO: Implement ${method.toUpperCase()} logic\n` +
      `    // If request body type is needed: (req.body as ${requestBodyType})\n` +
      `    return new Response(200, { "Content-Type": "application/json" }, { message: "${method.toUpperCase()} method called" });\n` +
      `  }`
    );
  }

  // Convert a string to PascalCase
  private toPascalCase(str: string): string {
    return str.replace(/(^\w|_\w)/g, (match) =>
      match.replace("_", "").toUpperCase()
    );
  }
}

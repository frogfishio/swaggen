import * as path from "path";
import * as fs from "fs";

export class HandlerGenerator {
  constructor(private outputPath: string) {}

  // Generate a handler file for a specific endpoint and HTTP methods
  public generate(endpoint: string, methods: string[]): void {
    // Normalize the endpoint to create a file name (e.g., /users -> users.ts)
    const normalizedEndpoint = endpoint
      .replace(/^\//, "") // Remove leading slash
      .replace(/\//g, "_") // Replace remaining slashes with underscores
      .replace(/[{}]/g, "") // Remove curly braces
      .toLowerCase(); // Convert to lowercase

    const className = this.toPascalCase(normalizedEndpoint) + "Handler";
    const filePath = path.join(this.outputPath, `${normalizedEndpoint}.ts`);

    // Generate the class content based on available methods
    const classContent = this.generateClassContent(className, methods);

    // Write the TypeScript file with the generated class
    fs.writeFileSync(filePath, classContent, "utf8");

    console.log(`Created file: ${filePath}`);
  }

  // Generate TypeScript class content
  private generateClassContent(className: string, methods: string[]): string {
    // Map OpenAPI verbs to the corresponding method names
    const methodImplementations = methods
      .map((method) => this.generateMethodImplementation(method.toLowerCase()))
      .join("\n\n");

    return (
      `import { BaseHandler, Request, Response } from "./_";\n\n` +
      `export class ${className} extends BaseHandler {\n\n` +
      `${methodImplementations}\n\n` +
      `}\n`
    );
  }

  // Generate method implementation for a specific HTTP verb
  private generateMethodImplementation(method: string): string {
    return (
      `  public async ${method}(req: Request): Promise<Response> {\n` +
      `    // TODO: Implement ${method.toUpperCase()} logic\n` +
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
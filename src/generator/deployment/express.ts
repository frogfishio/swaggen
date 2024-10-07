import * as path from "path";
import * as fs from "fs";

export class ExpressDeploymentGenerator {
  constructor(private outputPath: string) {}

  // Generate Express deployment configuration
  public generate(
    endpointMethods: Record<string, string[]>, // Pass an object where the key is the endpoint and the value is an array of HTTP methods
    capabilities: string[]
  ): void {
    // Generate TypeScript code for configuring Express routes
    const importStatements = Object.keys(endpointMethods)
      .map((endpoint) => {
        // Sanitize the endpoint to create a valid TypeScript class name
        const sanitizedEndpoint = this.sanitizeEndpoint(endpoint);
        const adapterClassName = this.toPascalCase(sanitizedEndpoint); // No "Adapter" suffix
        const adapterFileName = this.sanitizeFileName(sanitizedEndpoint); // Clean file name

        return `import { ${adapterClassName}Adapter } from "./adapters/${adapterFileName}";`;
      })
      .join("\n");

    const routeRegistrations = Object.keys(endpointMethods)
      .map((endpoint) => {
        // Sanitize the endpoint to create a valid TypeScript class name
        const sanitizedEndpoint = this.sanitizeEndpoint(endpoint);
        const adapterClassName =
          this.toPascalCase(sanitizedEndpoint) + "Adapter";
        const instanceName = this.toCamelCase(sanitizedEndpoint); // Use camelCase for instance names

        // Generate routes only for the specific HTTP methods defined in the spec
        const methodHandlers = endpointMethods[endpoint]
          .map((method) => {
            const lowerCaseMethod = method.toLowerCase();
            return `  app.${lowerCaseMethod}("${endpoint}", ${instanceName}.${lowerCaseMethod}.bind(${instanceName}));`;
          })
          .join("\n");

        return `
  const ${instanceName} = new ${adapterClassName}();
${methodHandlers}
`;
      })
      .join("\n");

    const expressContent = `import { Express } from "express";
${importStatements}

/**
 * Configure routes for the Express app.
 * @param app - The Express app instance
 */
export function configureRoutes(app: Express): void {
  // Register routes for each adapter
  ${routeRegistrations}
}
`;

    // Write the Express configuration TypeScript file
    fs.writeFileSync(
      path.join(this.outputPath, "configure.ts"),
      expressContent,
      "utf8"
    );
  }

  // Helper to sanitize endpoint string for generating class and instance names
  private sanitizeEndpoint(endpoint: string): string {
    return endpoint
      .replace(/^\//, "") // Remove leading slash
      .replace(/[\/{}]/g, "_") // Replace slashes and curly braces with underscores
      .replace(/_+/g, "_") // Replace multiple underscores with a single one
      .replace(/^_+|_+$/g, ""); // Trim leading and trailing underscores
  }

  // Helper to sanitize file name (lowercase and no trailing underscores)
  private sanitizeFileName(endpoint: string): string {
    return this.sanitizeEndpoint(endpoint).toLowerCase();
  }

  // Convert a string to PascalCase
  private toPascalCase(str: string): string {
    return str.replace(/(^\w|_\w)/g, (match) =>
      match.replace("_", "").toUpperCase()
    );
  }

  // Convert a string to camelCase
  private toCamelCase(str: string): string {
    return str.replace(/(^\w|_\w)/g, (match, index) =>
      index === 0 ? match.toLowerCase() : match.replace("_", "").toUpperCase()
    );
  }
}

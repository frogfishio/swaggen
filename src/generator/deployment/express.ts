import * as path from "path";
import * as fs from "fs";

export class ExpressDeploymentGenerator {
  constructor(private outputPath: string) {}

  // Generate Express deployment configuration
  public generate(
    endpointMethods: Record<string, string[]>,
    capabilities: string[]
  ): void {
    const importStatements = Object.keys(endpointMethods)
      .map((endpoint) => {
        const sanitizedEndpoint = this.sanitizeEndpoint(endpoint);
        const adapterClassName =
          this.toPascalCase(sanitizedEndpoint) + "Adapter"; // Add "Adapter" suffix
        const adapterFileName = this.sanitizeFileName(sanitizedEndpoint); // Clean file name

        return `import { ${adapterClassName} } from "./adapters/${adapterFileName}";`;
      })
      .join("\n");

    const routeRegistrations = Object.keys(endpointMethods)
      .map((endpoint) => {
        const sanitizedEndpoint = this.sanitizeEndpoint(endpoint);
        const adapterClassName =
          this.toPascalCase(sanitizedEndpoint) + "Adapter";
        const instanceName = this.toCamelCase(sanitizedEndpoint);

        // Convert parameters from "{param}" to ":param" for Express
        const expressEndpoint = endpoint.replace(/\{(\w+)\}/g, ":$1");

        const methodHandlers = endpointMethods[endpoint]
          .map((method) => {
            const lowerCaseMethod = method.toLowerCase();
            return `  app.${lowerCaseMethod}("${expressEndpoint}", ${instanceName}.${lowerCaseMethod}.bind(${instanceName}));`;
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
      .replace(/\/(\w)/g, (_, g) => `_${g}`) // Replace slashes with underscores without changing case
      .replace(/\{(\w+)\}/g, (_, g) => this.toPascalCase(g)) // Flatten parameters within curly braces to PascalCase
      .replace(/_+/g, "_") // Replace multiple underscores with a single one
      .replace(/^_+|_+$/g, "") // Trim leading and trailing underscores
      .replace(/\//g, "_"); // Replace slashes with underscores
  }

  // Helper to sanitize file name (lowercase and no trailing underscores)
  private sanitizeFileName(endpoint: string): string {
    return this.sanitizeEndpoint(endpoint).toLowerCase();
  }

  // Convert a string to PascalCase
  private toPascalCase(str: string): string {
    return str
      .split(/[_\s]/) // Split by underscores or spaces
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize first letter of each word
      .join("");
  }

  // Convert a string to camelCase
  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }
}

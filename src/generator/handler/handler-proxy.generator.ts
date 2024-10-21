import { generateInterfaceDefinitions } from "./handler-types.generator";
import * as fs from "fs";
import * as path from "path";
import {
  ensureOutputDirectory,
  toPascalCase,
  normalizeEndpoint,
  extractEntityName,
} from "../util";

export class HandlerProxyGenerator {
  constructor(private outputPath: string) {}

  public generateProxy(endpoint: string, methods: Record<string, any>): void {
    const normalizedEndpoint = normalizeEndpoint(endpoint);
    const className = toPascalCase(normalizedEndpoint) + "Proxy";

    // Create directory for the proxy file: <out>/<normalizedEndpoint>
    const targetDir = path.join(this.outputPath, normalizedEndpoint);
    this.ensureDirectoryExists(targetDir);

    // Generate interface imports and class proxy methods
    const { imports, interfaces, typesToImport } = generateInterfaceDefinitions(
      endpoint,
      methods
    ); // Fetch the correct types

    const { proxyMethods, usedTypes } = this.generateProxyMethods(
      methods,
      endpoint
    ); // Generate proxy methods and collect used types

    // // Generate import statements for used types
    // const typeImports = this.generateTypeImports(usedTypes);

    // Combine all parts into a proxy.ts file content
    const proxyContent = this.buildProxyContent(
      // typeImports,
      imports,
      interfaces, // Add the interfaces directly to the proxy content
      className,
      proxyMethods
    );

    // Write the proxy.ts file
    const proxyFilePath = path.join(targetDir, `proxy.ts`);
    fs.writeFileSync(proxyFilePath, proxyContent, "utf8");
    console.log(`Created proxy file: ${proxyFilePath}`);
  }

  /**
   * Generate proxy method signatures using the correct request and response types.
   *
   * @param methods - The HTTP methods for the endpoint.
   * @param endpoint - The API endpoint (e.g., "/users").
   * @returns An object containing the proxy methods and the used types.
   */
  private generateProxyMethods(
    methods: Record<string, any>,
    endpoint: string
  ): { proxyMethods: string; usedTypes: Set<string> } {
    const entityName = extractEntityName(endpoint);
    const normalizedEndpoint = normalizeEndpoint(endpoint);
    const pascalCaseEntityName = toPascalCase(entityName);
    const usedTypes = new Set<string>(); // To collect used types

    const proxyMethods = Object.keys(methods)
      .map((method) => {
        const methodName = this.getMethodName(method, normalizedEndpoint);
        const requestType = this.getRequestTypeName(
          method,
          pascalCaseEntityName
        );
        const responseType = this.getResponseTypeName(
          method,
          pascalCaseEntityName
        );

        // Add request and response types to the usedTypes set
        if (requestType !== "void") usedTypes.add(requestType);
        usedTypes.add(responseType);

        return `${methodName}(request: ${requestType}): Promise<${responseType}>;`;
      })
      .join("\n");

    return { proxyMethods, usedTypes };
  }

  /**
   * Get the correct request type name (following handler-types.generator.ts logic).
   *
   * @param method - The HTTP method (e.g., "post", "get").
   * @param entityName - The entity name in PascalCase (e.g., "User").
   * @returns The correct request type name (e.g., "PostUserRequest").
   */
  private getRequestTypeName(method: string, entityName: string): string {
    const methodsWithoutBody = ["get", "delete", "head", "options"];
    if (methodsWithoutBody.includes(method.toLowerCase())) {
      return "void"; // No request body for these methods
    }
    return `${toPascalCase(method)}${entityName}Request`;
  }

  /**
   * Get the correct response type name (following handler-types.generator.ts logic).
   *
   * @param method - The HTTP method (e.g., "post", "get").
   * @param entityName - The entity name in PascalCase (e.g., "User").
   * @returns The correct response type name (e.g., "PostUserResponse").
   */
  private getResponseTypeName(method: string, entityName: string): string {
    return `${toPascalCase(method)}${entityName}Response`;
  }

  /**
   * Get the mapped method name based on the HTTP method and endpoint.
   *
   * @param method - The HTTP method (e.g., "get", "post").
   * @param entityName - The base entity name derived from the endpoint.
   * @returns The correct method name for the proxy (e.g., "createUser").
   */
  private getMethodName(method: string, entityName: string): string {
    const httpMethodMap: Record<string, string> = {
      post: "create",
      get: "read",
      put: "replace",
      patch: "modify",
      delete: "delete",
    };
    const methodName =
      httpMethodMap[method.toLowerCase()] || method.toLowerCase();
    return `${methodName}${toPascalCase(entityName)}`;
  }

  /**
   * Generates import statements for the used types in the proxy.
   *
   * @param usedTypes - A set of used request/response types (e.g., "PostUserRequest", "GetUserResponse").
   * @returns A string representing the import statements.
   */
  private xgenerateTypeImports(usedTypes: Set<string>): string {
    if (usedTypes.size === 0) return "";
    const typesArray = Array.from(usedTypes).sort(); // Sort for consistent order
    return `import { ${typesArray.join(", ")} } from "./handler";`;
  }

  /**
   * Builds the proxy file content.
   *
   * @param typeImports - The import statements for used types.
   * @param handlerImports - The imports for the generated handler.
   * @param className - The class name of the proxy.
   * @param methods - The method signatures of the proxy.
   * @returns The complete content for the proxy file.
   */
  private buildProxyContent(
    // typeImports: string,
    handlerImports: string,
    interfaces: string, // Add interfaces parameter
    className: string,
    methods: string
  ): string {
    return `
// Auto-generated proxy for ${className}

${handlerImports}

// Auto-generated interfaces
${interfaces}

export interface ${className} {
  ${methods}
}
    `;
  }

  private ensureDirectoryExists(dir: string): void {
    ensureOutputDirectory(dir);
  }
}

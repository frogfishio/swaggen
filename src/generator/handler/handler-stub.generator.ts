import { generateInterfaceDefinitions } from "./handler-types.generator";
import * as fs from "fs";
import * as path from "path";
import {
  ensureOutputDirectory,
  toPascalCase,
  normalizeEndpoint,
  extractEntityName,
  getMethodName,
} from "../util";

export class HandlerStubGenerator {
  constructor(private outputPath: string) {}

  public generateStub(endpoint: string, methods: Record<string, any>): void {
    const normalizedEndpoint = normalizeEndpoint(endpoint);
    const className = toPascalCase(normalizedEndpoint) + "Stub";
    const interfaceName = toPascalCase(normalizedEndpoint) + "Proxy";

    // Create directory for the stub file: <out>/<normalizedEndpoint>
    const targetDir = path.join(this.outputPath, normalizedEndpoint);
    this.ensureDirectoryExists(targetDir);

    // Generate interface imports and class proxy methods
    const { imports, interfaces, typesToImport } = generateInterfaceDefinitions(
      endpoint,
      methods
    ); // Fetch the correct types

    const { stubMethods, usedTypes } = this.generateStubMethods(
      methods,
      endpoint,
      interfaceName
    ); // Generate stub methods

    // Generate import statements for used types
    const typeImports = this.generateTypeImports(usedTypes);

    // Generate the proxy interface import statement
    const proxyImport = `import { ${interfaceName} } from "./proxy";`;

    // Combine all parts into a stub.ts file content
    const stubContent = this.buildStubContent(
      typeImports,
      proxyImport,
      imports,
      className,
      interfaceName,
      stubMethods
    );

    // Write the stub.ts file
    const stubFilePath = path.join(targetDir, `stub.ts`);
    fs.writeFileSync(stubFilePath, stubContent, "utf8");
    console.log(`Created stub file: ${stubFilePath}`);
  }

  /**
   * Generate stub method implementations using the correct request and response types.
   *
   * @param methods - The HTTP methods for the endpoint.
   * @param endpoint - The API endpoint (e.g., "/users").
   * @param interfaceName - The name of the proxy interface to implement.
   * @returns An object containing the stub methods and the used types.
   */
  private generateStubMethods(
    methods: Record<string, any>,
    endpoint: string,
    interfaceName: string
  ): { stubMethods: string; usedTypes: Set<string> } {
    const entityName = extractEntityName(endpoint);
    const normalizedEndpoint = normalizeEndpoint(endpoint);
    const pascalCaseEntityName = toPascalCase(entityName);
    const usedTypes = new Set<string>(); // To collect used types

    const stubMethods = Object.keys(methods)
      .map((method) => {
        const methodName = getMethodName(method, normalizedEndpoint);
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

        return `
  async ${methodName}(request: ${requestType}): Promise<${responseType}> {
    return Promise.reject("Not implemented");
  }`;
      })
      .join("\n");

    return { stubMethods, usedTypes };
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
   * Generates import statements for the used types in the stub class.
   *
   * @param usedTypes - A set of used request/response types (e.g., "PostUserRequest", "GetUserResponse").
   * @returns A string representing the import statements.
   */
  private generateTypeImports(usedTypes: Set<string>): string {
    if (usedTypes.size === 0) return "";
    const typesArray = Array.from(usedTypes).sort(); // Sort for consistent order
    return `import { ${typesArray.join(", ")} } from "./handler";`;
  }

  /**
   * Builds the stub class content.
   *
   * @param typeImports - The import statements for used types.
   * @param proxyImport - The import statement for the proxy interface.
   * @param handlerImports - The imports for the generated handler.
   * @param className - The class name of the stub.
   * @param interfaceName - The name of the proxy interface to implement.
   * @param methods - The method signatures of the proxy.
   * @returns The complete content for the stub file.
   */
  private buildStubContent(
    typeImports: string,
    proxyImport: string,
    handlerImports: string,
    className: string,
    interfaceName: string,
    methods: string
  ): string {
    return `
// Auto-generated stub class for ${className}
${typeImports}
${proxyImport}
${handlerImports}

export class ${className} implements ${interfaceName} {
  ${methods}
}
    `;
  }

  private ensureDirectoryExists(dir: string): void {
    ensureOutputDirectory(dir);
  }
}

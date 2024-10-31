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
  getMethodName,
  extractEntityName,
  getTemplatePath,
  extractClassNameFromEndpoint, // Import the function
  getSemanticMethodName,
  capitalizeFirstLetter,
  generateTypeImports,
  generateSchemaImports,
  resolveType
} from "../util";

// Replace the local `toPascalCase` and `extractRefName` with imports from `handlers-util.ts`
export class HandlerGenerator {
  constructor(private outputPath: string) {}

  public generate(
    endpoint: string,
    methods: Record<string, OpenAPIV3.OperationObject>
  ): void {
    const normalizedEndpoint = normalizeEndpoint(endpoint);
    const className = toPascalCase(extractClassNameFromEndpoint(endpoint));

    // Create the new folder structure: <out>/<normalizedEndpoint>
    const targetDir = path.join(this.outputPath, normalizedEndpoint);
    ensureOutputDirectory(targetDir);

    // File paths for handler.ts and handler.base.ts
    const handlerFilePath = path.join(targetDir, `handler.ts`);
    const baseFilePath = path.join(targetDir, `swaggen.ts`);

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
        endpoint,
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
 * @param schemaTypes - Set of schema types that need to be imported.
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
  const baseImports = `import { SwaggenHandler, SwaggenRequest, SwaggenResponse } from "./swaggen";`;

  // Import the proxy and stub correctly
  const proxyImport = `import { ${className}Proxy } from "./proxy";`;
  const stubImport = `import { ${className}Stub } from "./stub";`;

  // Generate imports for the types used in the method signatures
  const existingImports = `${imports}\n${proxyImport}\n${stubImport}`;
  const { proxyImports: typeImports, schemaImports } = generateTypeImports(usedTypes, existingImports);

  // Include schema imports collected from schemaTypes
  const additionalSchemaImports = generateSchemaImports(schemaTypes);

  // Start building the content
  let content = "";

  // Add base imports
  content += `// Base imports\n${baseImports}\n\n`;

  // Add schema imports
  if (schemaImports.trim() || additionalSchemaImports.trim()) {
    content += `// Schema imports\n`;
    if (schemaImports.trim()) {
      content += `${schemaImports}\n`;
    }
    if (additionalSchemaImports.trim()) {
      content += `${additionalSchemaImports}\n`;
    }
    content += `\n`;
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
  content += `export class ${className}Handler extends SwaggenHandler {\n\n`;

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
   * Generates handler.base.ts with predefined content.
   *
   * @param filePath - Path to the handler.base.ts file.
   */
  private generateBaseFile(filePath: string) {
    const templatePath = getTemplatePath("base.ejs");
    const template = fs.readFileSync(templatePath, "utf8");

    // Render the base.ejs template (you can pass any necessary variables here)
    const baseContent = ejs.render(template, {});

    // Write the handler.base.ts file with the generated content
    fs.writeFileSync(filePath, baseContent.trim(), "utf8");
    console.log(`Created base handler file: ${filePath}`);
  }

  private generateMethodImplementation(
    method: string,
    methodSpec: OpenAPIV3.OperationObject,
    endpoint: string,
    usedTypes: Set<string>,
    schemaTypes: Set<string>
  ): string {
    // Get method signature and parameters
    const { signature: proxyMethodSignature, params } = this.generateProxyMethodSignature(
      method,
      methodSpec,
      endpoint,
      usedTypes,
      schemaTypes
    );
  
    // Generate code to extract parameters from req
    const paramAssignments = params
      .map((param) => {
        let assignmentCode = "";
        if (param.name === "query") {
          // For query parameters
          assignmentCode = `    const ${param.name}: ${param.type} = req.getAllQueryParams() as unknown as ${param.type};`;
        } else if (param.name === "data") {
          // For request body
          assignmentCode = `    const ${param.name}: ${param.type} = req.body as ${param.type};`;
        } else {
          // For path parameters
          assignmentCode = `    const ${param.name}: ${param.type} = req.getPathParam('${param.name}') as ${param.type};`;
        }
        return assignmentCode;
      })
      .join("\n");
  
    // Call the proxy method with parameters
    const methodName = getMethodName(method, endpoint);
    const paramNames = params.map((param) => param.name).join(", ");
  
    let methodImpl = `  public async ${methodName}(req: SwaggenRequest): Promise<SwaggenResponse> {\n`;
  
    // Add proxy method signature as a comment
    methodImpl += `    // Proxy method signature: ${proxyMethodSignature}\n`;
  
    // Add parameter assignments
    methodImpl += `${paramAssignments}\n\n`;
  
    // Call the proxy method
    methodImpl += `    const result = await this.proxy.${methodName}(${paramNames});\n`;
  
    methodImpl += `    // TODO: Implement ${method.toUpperCase()} logic\n`;
  
    methodImpl += `    return new SwaggenResponse(200, { "Content-Type": "application/json" }, result);\n`;
    methodImpl += `  }`;
  
    return methodImpl;
  }
  
  private generateProxyMethodSignature(
    method: string,
    methodSpec: OpenAPIV3.OperationObject,
    endpoint: string,
    usedTypes: Set<string>,
    schemaTypes: Set<string>
  ): { signature: string; params: { name: string; type: string }[] } {
    // Reconstruct the proxy method parameters (similar to proxy-generator.ts)
    const pathParams = this.extractParameters(methodSpec.parameters, "path");
    const queryParams = this.extractParameters(methodSpec.parameters, "query");
    const hasQueryParams = queryParams.length > 0;
  
    let queryType = "void";
    if (hasQueryParams) {
      const interfaceName = `${toPascalCase(getMethodName(method, endpoint))}QueryParams`;
      queryType = interfaceName;
      usedTypes.add(queryType);
    }
  
    let dataType = "void";
    if (["post", "put", "patch"].includes(method.toLowerCase()) && methodSpec.requestBody) {
      dataType = this.getRequestBodyType(methodSpec.requestBody, usedTypes, schemaTypes);
    }
  
    const methodName = getMethodName(method, endpoint);
    const responseType = `${toPascalCase(methodName)}Response`;
    usedTypes.add(responseType);
  
    const params = [
      ...pathParams.map((param) => ({ name: param.name, type: param.type })),
      ...(queryType !== "void" ? [{ name: "query", type: queryType }] : []),
      ...(dataType !== "void" ? [{ name: "data", type: dataType }] : []),
    ];
  
    const paramString = params.map((p) => `${p.name}: ${p.type}`).join(", ");
    const signature = `${methodName}(${paramString}): Promise<${responseType}>;`;
  
    return { signature, params };
  }
  
  // Helper functions
  private extractParameters(
    parameters: (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[] | undefined,
    location: string
  ): { name: string; type: string }[] {
    return (
      parameters
        ?.filter(
          (param): param is OpenAPIV3.ParameterObject =>
            "in" in param && param.in === location
        )
        .map((param) => ({
          name: param.name,
          type: this.resolveParameterType(param),
        })) || []
    );
  }
  
  private resolveParameterType(param: OpenAPIV3.ParameterObject): string {
    if (param.schema) {
      if ("$ref" in param.schema) {
        const refName = extractRefName(param.schema.$ref);
        if (this.isSchemaType(refName)) {
          return refName;
        } else {
          return "any";
        }
      } else {
        return resolveType(param.schema as OpenAPIV3.SchemaObject, new Set());
      }
    }
    return "any";
  }
  
  private getRequestBodyType(
    requestBody: OpenAPIV3.RequestBodyObject | OpenAPIV3.ReferenceObject,
    usedTypes: Set<string>,
    schemaTypes: Set<string>
  ): string {
    if ("$ref" in requestBody) {
      const refName = extractRefName(requestBody.$ref);
      if (this.isSchemaType(refName)) {
        schemaTypes.add(refName);
      } else {
        usedTypes.add(refName);
      }
      return refName;
    } else {
      const content = requestBody.content["application/json"];
      if (content && content.schema) {
        if ("$ref" in content.schema) {
          const refName = extractRefName(content.schema.$ref);
          if (this.isSchemaType(refName)) {
            schemaTypes.add(refName);
          } else {
            usedTypes.add(refName);
          }
          return refName;
        } else {
          const typeName = `${toPascalCase(getMethodName(requestBody as any, ""))}RequestBody`;
          // Handle inline schema types if necessary
          return "any";
        }
      }
    }
    return "any";
  }
  
  /**
   * Determines if a type is a schema type based on its naming convention.
   *
   * @param typeName - The name of the type.
   * @returns True if it's a schema type, false otherwise.
   */
  private isSchemaType(typeName: string): boolean {
    const proxyTypePrefixes = ["Create", "Read", "Replace", "Modify", "Delete"];
    const isProxyType =
      proxyTypePrefixes.some((prefix) => typeName.startsWith(prefix)) ||
      typeName.endsWith("Response") ||
      typeName.endsWith("Request") ||
      typeName.endsWith("QueryParams");
  
    return !isProxyType;
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
          `  protected ${handlerMethodName}(): SwaggenResponse {\n` +
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

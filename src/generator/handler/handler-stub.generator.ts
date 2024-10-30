import { generateInterfaceDefinitions } from "./handler-types.generator";
import * as fs from "fs";
import * as path from "path";
import {
  ensureOutputDirectory,
  toPascalCase,
  normalizeEndpoint,
  extractEntityName,
  getMethodName,
  resolveType,
  extractRefType,
  getResponseTypeName,
  ensureDirectoryExists,
} from "../util";
import { OpenAPIV3 } from "openapi-types";

export class HandlerStubGenerator {
  constructor(private outputPath: string) {}

  public generateStub(endpoint: string, methods: Record<string, any>): void {
    const normalizedEndpoint = normalizeEndpoint(endpoint);
    const className = toPascalCase(normalizedEndpoint) + "Stub";
    const interfaceName = toPascalCase(normalizedEndpoint) + "Proxy";

    // Create directory for the stub file: <out>/<normalizedEndpoint>
    const targetDir = path.join(this.outputPath, normalizedEndpoint);
    ensureDirectoryExists(targetDir);

    // Generate interface imports and class stub methods
    const { imports, interfaces, typesToImport } = generateInterfaceDefinitions(
      endpoint,
      methods
    );

    const { stubMethods, usedTypes, queryInterfaces } =
      this.generateStubMethods(methods, endpoint);

    // Generate import statements for used types
    const typeImports = this.generateTypeImports(usedTypes, imports);

    // Generate the proxy interface import statement
    const proxyImport = `import { ${interfaceName} } from "./proxy";`;

    // Combine all parts into a stub.ts file content
    const stubContent = this.buildStubContent(
      typeImports,
      proxyImport,
      imports,
      className,
      interfaceName,
      stubMethods,
      queryInterfaces
    );

    // Write the stub.ts file
    const stubFilePath = path.join(targetDir, `stub.ts`);
    fs.writeFileSync(stubFilePath, stubContent, "utf8");
    console.log(`Created stub file: ${stubFilePath}`);
  }

  private generateStubMethods(
    methods: Record<string, OpenAPIV3.OperationObject>,
    endpoint: string
  ): {
    stubMethods: string;
    usedTypes: Set<string>;
    queryInterfaces: string[];
  } {
    const entityName = extractEntityName(endpoint);
    const pascalCaseEntityName = toPascalCase(entityName);
    const usedTypes = new Set<string>();
    const queryInterfaces: string[] = [];

    const stubMethods = Object.entries(methods)
      .map(([method, methodDef]) => {
        const pathParams =
          (
            methodDef.parameters as
              | (OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject)[]
              | undefined
          )
            ?.filter(
              (param): param is OpenAPIV3.ParameterObject =>
                "in" in param && param.in === "path"
            )
            .map((param: OpenAPIV3.ParameterObject) => {
              let paramType = "string";
              if (param.schema) {
                if ("$ref" in param.schema) {
                  paramType = "any";
                } else {
                  paramType =
                    (param.schema as OpenAPIV3.SchemaObject).type === "integer"
                      ? "number"
                      : (param.schema as OpenAPIV3.SchemaObject).type ||
                        "string";
                }
              }
              const paramName =
                param.name.charAt(0).toLowerCase() + param.name.slice(1);
              return { name: paramName, type: paramType };
            }) || [];

        const queryParams =
          (
            methodDef.parameters as
              | (OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject)[]
              | undefined
          )
            ?.filter(
              (param): param is OpenAPIV3.ParameterObject =>
                "in" in param && param.in === "query"
            )
            .map((param: OpenAPIV3.ParameterObject) => {
              let paramType = "string";
              if (param.schema) {
                if ("$ref" in param.schema) {
                  paramType = "any";
                } else if (
                  param.schema.type === "array" &&
                  param.schema.items
                ) {
                  paramType = `${(param.schema.items as OpenAPIV3.SchemaObject).type === "integer" ? "number" : (param.schema.items as OpenAPIV3.SchemaObject).type}[]`;
                } else {
                  paramType =
                    param.schema.type === "integer"
                      ? "number"
                      : (param.schema as OpenAPIV3.SchemaObject).type ||
                        "string";
                }
              }
              const paramName = param.name;
              return `${paramName}${param.required ? "" : "?"}: ${paramType}`;
            }) || [];

        let queryType = "void";
        if (queryParams.length > 0) {
          const interfaceName = `${toPascalCase(method)}${pascalCaseEntityName}QueryParams`;
          const queryParamsInterface = `interface ${interfaceName} { ${queryParams.join("; ")} }`;
          queryInterfaces.push(queryParamsInterface);
          queryType = interfaceName;
        }

        let dataType = "void";
        if (
          ["post", "put", "patch"].includes(method.toLowerCase()) &&
          methodDef.requestBody
        ) {
          const requestBody =
            methodDef.requestBody as OpenAPIV3.RequestBodyObject;
          const content = requestBody.content["application/json"];
          if (content && content.schema) {
            if ("$ref" in content.schema) {
              dataType = extractRefType(content.schema.$ref);
              usedTypes.add(dataType);
            } else {
              dataType = `${toPascalCase(method)}${pascalCaseEntityName}RequestBody`;
              const bodyInterface = `interface ${dataType} ${resolveType(content.schema as OpenAPIV3.SchemaObject, usedTypes)}`;
              queryInterfaces.push(bodyInterface);
            }
          }
        }

        const methodName = getMethodName(method, endpoint);
        const responseType = getResponseTypeName(method, pascalCaseEntityName);

        usedTypes.add(responseType);

        const paramString = pathParams
          .filter((param) => param.type !== "void")
          .map((param) => `${param.name}: ${param.type}`)
          .join(", ");

        const finalParams = [
          paramString,
          queryType !== "void" ? `query: ${queryType}` : "",
          dataType !== "void" ? `data: ${dataType}` : "",
        ]
          .filter((param) => param)
          .join(", ");

        return `
    async ${methodName}(${finalParams}): Promise<${responseType}> {
      return Promise.reject("Not implemented");
    }`;
      })
      .join("\n");

    return { stubMethods, usedTypes, queryInterfaces };
  }

  private generateTypeImports(
    usedTypes: Set<string>,
    existingImports: string
  ): string {
    if (usedTypes.size === 0) return "";

    const proxyTypes: string[] = [];
    const schemaImports: string[] = [];

    usedTypes.forEach((type) => {
      const typeImportRegex = new RegExp(`\\b${type}\\b`);

      // Check if the type already exists in existing imports
      if (
        type.startsWith("Post") ||
        type.startsWith("Get") ||
        type.startsWith("Put") ||
        type.startsWith("Patch")
      ) {
        // Request/response types go to proxy imports if not already present
        if (!typeImportRegex.test(existingImports)) {
          proxyTypes.push(type);
        }
      } else {
        // Schema types go to schema imports if not already present
        if (!typeImportRegex.test(existingImports)) {
          schemaImports.push(
            `import { ${type} } from "../schema/${type.toLowerCase()}";`
          );
        }
      }
    });

    const proxyImport =
      proxyTypes.length > 0
        ? `import { ${proxyTypes.sort().join(", ")} } from "./proxy";`
        : "";
    const schemaImportStatements = schemaImports.sort().join("\n");

    return `${proxyImport}\n${schemaImportStatements}`;
  }

  private buildStubContent(
    typeImports: string,
    proxyImport: string,
    handlerImports: string,
    className: string,
    interfaceName: string,
    methods: string,
    queryInterfaces: string[]
  ): string {
    // Combine all necessary imports, ensuring unique entries
    const combinedImports = [typeImports, proxyImport, handlerImports]
      .filter(Boolean)
      .join("\n");

    return `
  // Auto-generated stub class for ${className}
  ${combinedImports}
  
  // Query parameter interfaces
  ${queryInterfaces.join("\n")}
  
  export class ${className} implements ${interfaceName} {
    ${methods}
  }
      `;
  }
}

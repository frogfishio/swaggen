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
  extractClassNameFromEndpoint,
} from "../util";
import { OpenAPIV3 } from "openapi-types";

export class HandlerProxyGenerator {
  constructor(private outputPath: string) {}
  
  public generateProxy(endpoint: string, methods: Record<string, any>): void {
    const normalizedEndpoint = normalizeEndpoint(endpoint);
    const className = toPascalCase(extractClassNameFromEndpoint(endpoint)) + "Proxy";
    
    // Create directory for the proxy file: <out>/<normalizedEndpoint>
    const targetDir = path.join(this.outputPath, normalizedEndpoint);
    this.ensureDirectoryExists(targetDir);
    
    // Generate interface imports and class proxy methods
    const { imports, interfaces, typesToImport } = generateInterfaceDefinitions(
      endpoint,
      methods
    ); // Fetch the correct types
    
    const { proxyMethods, usedTypes, queryInterfaces } =
    this.generateProxyMethods(methods, endpoint); // Generate proxy methods, collect used types, and query parameter interfaces
    
    // Combine all parts into a proxy.ts file content
    const proxyContent = this.buildProxyContent(
      imports,
      interfaces,
      className,
      proxyMethods,
      queryInterfaces // Now passing queryInterfaces as an argument
    );
    
    // Write the proxy.ts file
    const proxyFilePath = path.join(targetDir, `proxy.ts`);
    fs.writeFileSync(proxyFilePath, proxyContent, "utf8");
    console.log(`Created proxy file: ${proxyFilePath}`);
  }
  
  private generateProxyMethods(
    methods: Record<string, OpenAPIV3.OperationObject>,
    endpoint: string
  ): {
    proxyMethods: string;
    usedTypes: Set<string>;
    queryInterfaces: string[];
  } {
    const entityName = extractEntityName(endpoint);
    const usedTypes = new Set<string>(); // To collect used types
    const queryInterfaces: string[] = []; // To collect query parameter interfaces
    
    const proxyMethods = Object.entries(methods)
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
        let paramType = "string"; // Default to string
        if (param.schema) {
          if ("$ref" in param.schema) {
            paramType = "any"; // Or resolve the reference name if needed
          } else {
            paramType =
            (param.schema as OpenAPIV3.SchemaObject).type === "integer"
            ? "number"
            : (param.schema as OpenAPIV3.SchemaObject).type ||
            "string";
          }
        }
        
        // Ensure parameter names start with a lowercase letter
        const paramName =
        param.name.charAt(0).toLowerCase() + param.name.slice(1);
        
        return { name: paramName, type: paramType };
      }) || [];
      
      // Process query parameters and build interface if any exist
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
        let paramType = "string"; // Default to string
        if (param.schema) {
          if ("$ref" in param.schema) {
            paramType = "any"; // Or resolve the reference name if needed
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
      
      // Generate a query params interface if we have query parameters
      let queryType = "void"; // Default to void if no query params
      if (queryParams.length > 0) {
        const interfaceName = `${toPascalCase(getMethodName(method, endpoint))}QueryParams`;
        const queryParamsInterface = `export interface ${interfaceName} { ${queryParams.join("; ")} }`;
        queryInterfaces.push(queryParamsInterface);
        queryType = interfaceName; // Use the interface as the query type
      }
      
      // Handle the request body (post parameter) if defined
      let dataType = "void";
      if (
        ["post", "put", "patch"].includes(method.toLowerCase()) &&
        methodDef.requestBody
      ) {
        const requestBody =
        methodDef.requestBody as OpenAPIV3.RequestBodyObject;
        const content = requestBody.content["application/json"]; // Assuming JSON body
        if (content && content.schema) {
          if ("$ref" in content.schema) {
            dataType = extractRefType(content.schema.$ref); // Reference type from $ref
            usedTypes.add(dataType);
          } else {
            dataType = `${toPascalCase(getMethodName(method, endpoint))}RequestBody`;
            const bodyInterface = `interface ${dataType} ${resolveType(content.schema as OpenAPIV3.SchemaObject, usedTypes)}`;
            queryInterfaces.push(bodyInterface);
          }
        }
      }
      
      const methodName = getMethodName(method, endpoint);
      const responseType = toPascalCase(methodName + 'Response');
      
      // Add response type to the usedTypes set
      usedTypes.add(responseType);
      
      // Construct parameter string with types, excluding "void" parameters
      const paramString = pathParams
      .filter((param) => param.type !== "void") // Exclude void parameters
      .map((param) => `${param.name}: ${param.type}`)
      .join(", ");
      
      // Construct the final method parameters: path, query, and data parameters
      const finalParams = [
        paramString,
        queryType !== "void" ? `query: ${queryType}` : "",
        dataType !== "void" ? `data: ${dataType}` : "",
      ]
      .filter((param) => param) // Exclude empty entries
      .join(", ");
      
      return `\t${methodName}(${finalParams}): Promise<${responseType}>;`;
    })
    .join("\n");
    
    return { proxyMethods, usedTypes, queryInterfaces };
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
    handlerImports: string,
    interfaces: string,
    className: string,
    methods: string,
    queryInterfaces: string[]
  ): string {
    return `
// Auto-generated proxy for ${className}
  
    ${handlerImports}
  
// Auto-generated interfaces
    ${interfaces}
  
// Query parameter interfaces
    ${queryInterfaces.join("\n")}
  
export interface ${className} {
    ${methods}
}
`;
  }
  
  private ensureDirectoryExists(dir: string): void {
    ensureOutputDirectory(dir);
  }
}

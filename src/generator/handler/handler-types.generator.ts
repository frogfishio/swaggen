import { OpenAPIV3 } from "openapi-types";
import {
  extractRefName,
  isReferenceObject,
  resolveType,
  generateBaseInterfaceName, // Reuse from util.ts
  extractEntityName, // Reuse from util.ts
} from "../util";

/**
 * Generates TypeScript import statements and interface definitions for request and response bodies based on OpenAPI definitions.
 *
 * @param endpoint - The API endpoint (e.g., "/users/{userId}").
 * @param methods - A record of HTTP methods and their corresponding OpenAPI operation objects.
 * @returns An object containing `imports` and `interfaces` as strings.
 */
export function generateInterfaceDefinitions(
  endpoint: string,
  methods: Record<string, OpenAPIV3.OperationObject>
): { imports: string; interfaces: string; typesToImport: string[] } {
  const interfaces: string[] = [];
  const referencedTypes: Set<string> = new Set();

  // Extract the base resource/entity name from the endpoint
  const entityName = extractEntityName(endpoint); // Reuse from util.ts

  // Iterate over each method (GET, POST, PUT, etc.)
  for (const [method, operation] of Object.entries(methods)) {
    // Use the reusable function to generate the base interface name
    const baseName = generateBaseInterfaceName(
      operation.operationId,
      method,
      entityName
    );

    // Generate interfaces for request body
    if (operation.requestBody) {
      const requestBody = operation.requestBody as OpenAPIV3.RequestBodyObject;
      const content = requestBody.content["application/json"];
      if (content && content.schema) {
        const interfaceName = `${baseName}Request`;
        const interfaceDefinition = generateInterface(
          interfaceName,
          content.schema,
          referencedTypes
        );
        interfaces.push(interfaceDefinition);
      }
    }

    // Generate interfaces for successful responses (2xx)
    if (operation.responses) {
      for (const [statusCode, response] of Object.entries(
        operation.responses
      )) {
        if (/^2\d\d$/.test(statusCode)) {
          const responseObj = response as OpenAPIV3.ResponseObject;
          const content = responseObj.content?.["application/json"];
          if (content && content.schema) {
            const interfaceName = `${baseName}Response`;
            const interfaceDefinition = generateInterface(
              interfaceName,
              content.schema,
              referencedTypes
            );
            interfaces.push(interfaceDefinition);
          }
        }
      }
    }
  }

  // Generate import statements for all referenced types
  const imports = Array.from(referencedTypes)
    .map((type) => `import { ${type} } from "../schema/${type.toLowerCase()}";`)
    .join("\n");

  return {
    imports,
    interfaces: interfaces.join("\n\n"),
    typesToImport: Array.from(referencedTypes),
  };
}

/**
 * Generates a TypeScript interface definition from an OpenAPI schema.
 *
 * @param interfaceName - The name of the interface.
 * @param schema - The OpenAPI schema object.
 * @param referencedTypes - A Set to collect referenced complex types.
 * @returns A string containing the TypeScript interface definition.
 */
export function generateInterface(
  interfaceName: string,
  schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
  referencedTypes: Set<string>
): string {
  if (isReferenceObject(schema)) {
    // If the schema is a reference, resolve the name and create a type alias
    const refName = extractRefName(schema.$ref);
    referencedTypes.add(refName);
    return `export type ${interfaceName} = ${refName};`;
  } else if (schema.type === "object" && schema.properties) {
    const properties = Object.entries(schema.properties)
      .map(([propName, propSchema]) => {
        const optional = !(
          schema.required && schema.required.includes(propName)
        );
        const tsType = resolveType(propSchema, referencedTypes);
        return `  ${propName}${optional ? "?" : ""}: ${tsType};`;
      })
      .join("\n");

    return `export interface ${interfaceName} {\n${properties}\n}`;
  } else if (schema.type === "array" && schema.items) {
    const itemType = resolveType(schema.items, referencedTypes);
    return `export type ${interfaceName} = ${itemType}[];`;
  } else {
    const tsType = resolveType(schema, referencedTypes);
    return `export type ${interfaceName} = ${tsType};`;
  }
}

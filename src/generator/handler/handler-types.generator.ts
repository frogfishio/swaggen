// handler.types.ts

import { OpenAPIV3 } from "openapi-types";
import pluralize from "pluralize"; // Ensure this is installed via npm
import {
  toPascalCase,
  extractRefName,
  isReferenceObject,
  capitalizeFirstLetter,
  resolveType,
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
  const entityName = extractEntityName(endpoint);

  // Iterate over each method (GET, POST, PUT, etc.)
  for (const [method, operation] of Object.entries(methods)) {
    const methodCapitalized = capitalizeFirstLetter(method.toLowerCase());

    // Determine the base name for interfaces
    const baseName = operation.operationId
      ? toPascalCase(operation.operationId)
      : `${methodCapitalized}${entityName}`;

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
 * Extracts the entity/resource name from an endpoint.
 *
 * @param endpoint - The API endpoint (e.g., "/users/{userId}").
 * @returns The extracted entity name in PascalCase (e.g., "User").
 */
function extractEntityName(endpoint: string): string {
  // Split the endpoint by '/' and filter out path parameters
  const parts = endpoint
    .split("/")
    .filter((part) => part && !part.startsWith("{"));

  // Assume the last part is the resource/entity name
  const resource = parts[parts.length - 1] || "Entity";

  // Convert to singular form using pluralize
  const singularResource = pluralize.singular(resource);

  return toPascalCase(singularResource);
}

/**
 * Generates a TypeScript interface definition from an OpenAPI schema.
 *
 * @param interfaceName - The name of the interface.
 * @param schema - The OpenAPI schema object.
 * @param referencedTypes - A Set to collect referenced complex types.
 * @returns A string containing the TypeScript interface definition.
 */
function generateInterface(
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

// /**
//  * Resolves the TypeScript type from an OpenAPI schema.
//  *
//  * @param schema - The OpenAPI schema object.
//  * @param referencedTypes - A Set to collect referenced complex types.
//  * @returns A string representing the TypeScript type.
//  */
// function resolveType(
//   schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
//   referencedTypes: Set<string>
// ): string {
//   if (isReferenceObject(schema)) {
//     const refName = extractRefName(schema.$ref);
//     referencedTypes.add(refName);
//     return refName;
//   }

//   switch (schema.type) {
//     case "integer":
//     case "number":
//       return "number";
//     case "string":
//       if (schema.format === "date-time") return "string"; // Can be refined
//       return "string";
//     case "boolean":
//       return "boolean";
//     case "array":
//       if (schema.items) {
//         return `${resolveType(schema.items, referencedTypes)}[]`;
//       }
//       return "any[]";
//     case "object":
//       if (schema.properties) {
//         // Anonymous object type
//         const props = Object.entries(schema.properties)
//           .map(([propName, propSchema]) => {
//             const optional = !(schema.required && schema.required.includes(propName));
//             const tsType = resolveType(propSchema, referencedTypes);
//             return `${propName}${optional ? "?" : ""}: ${tsType};`;
//           })
//           .join(" ");
//         return `{ ${props} }`;
//       }
//       return "Record<string, any>";
//     default:
//       return "any";
//   }
// }

// /**
//  * Checks if the schema is a ReferenceObject.
//  *
//  * @param schema - The OpenAPI schema object.
//  * @returns A boolean indicating if it's a ReferenceObject.
//  */
// function isReferenceObject(schema: any): schema is OpenAPIV3.ReferenceObject {
//   return schema.$ref !== undefined;
// }

// /**
//  * Extracts the reference name from a $ref string.
//  *
//  * @param ref - The $ref string.
//  * @returns The extracted reference name.
//  */
// function extractRefName(ref: string): string {
//   return ref.split("/").pop() || "UnknownType";
// }

// /**
//  * Converts a string to PascalCase.
//  *
//  * @param str - The input string.
//  * @returns The PascalCase version of the string.
//  */
// function toPascalCase(str: string): string {
//   return str
//     .replace(/(^\w|_\w)/g, (match) => match.replace("_", "").toUpperCase())
//     .replace(/\s+/g, "");
// }

// /**
//  * Capitalizes the first letter of a string.
//  *
//  * @param str - The input string.
//  * @returns The string with the first letter capitalized.
//  */
// function capitalizeFirstLetter(str: string): string {
//   if (!str) return str;
//   return str.charAt(0).toUpperCase() + str.slice(1);
// }

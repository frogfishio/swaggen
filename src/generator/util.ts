import { OpenAPIV3 } from "openapi-types";
import * as fs from "fs";
import * as path from "path";
import pluralize from "pluralize"; // Ensure this is installed via npm

/**
 * Converts a string to PascalCase.
 *
 * @param str - The input string.
 * @returns The PascalCase version of the string.
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/(^\w|_\w)/g, (match) => match.replace("_", "").toUpperCase())
    .replace(/\s+/g, "");
}

/**
 * Normalizes the endpoint to create a file name.
 *
 * @param endpoint - The API endpoint (e.g., "/users/{userId}").
 * @returns A normalized string suitable for file naming.
 */
export function normalizeEndpoint(endpoint: string): string {
  return endpoint
    .replace(/^\//, "")
    .replace(/\//g, "_")
    .replace(/[{}]/g, "")
    .toLowerCase();
}

/**
 * Extracts the entity/resource name from an endpoint.
 *
 * @param endpoint - The API endpoint (e.g., "/users/{userId}").
 * @returns The extracted entity name in PascalCase (e.g., "User").
 */
export function extractEntityName(endpoint: string): string {
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
 * Ensures the output directory exists, and if not, creates it.
 *
 * @param dirPath - Path to the directory.
 */
export function ensureOutputDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Extracts the reference name from a $ref string.
 *
 * @param ref - The $ref string.
 * @returns The extracted reference name.
 */
export function extractRefName(ref: string): string {
  return ref.split("/").pop() || "UnknownType";
}

/**
 * Checks if the schema is a ReferenceObject.
 *
 * @param schema - The OpenAPI schema object.
 * @returns A boolean indicating if it's a ReferenceObject.
 */
export function isReferenceObject(
  schema: any
): schema is OpenAPIV3.ReferenceObject {
  return schema.$ref !== undefined;
}

/**
 * Capitalizes the first letter of a string.
 *
 * @param str - The input string.
 * @returns The string with the first letter capitalized.
 */
export function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Resolves the TypeScript type from an OpenAPI schema.
 *
 * @param schema - The OpenAPI schema object.
 * @param referencedTypes - A Set to collect referenced complex types.
 * @returns A string representing the TypeScript type.
 */
export function resolveType(
  schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
  referencedTypes: Set<string>
): string {
  if (isReferenceObject(schema)) {
    const refName = extractRefName(schema.$ref);
    referencedTypes.add(refName);
    return refName;
  }

  switch (schema.type) {
    case "integer":
    case "number":
      return "number";
    case "string":
      if (schema.format === "date-time") return "string"; // Can be refined
      return "string";
    case "boolean":
      return "boolean";
    case "array":
      if (schema.items) {
        return `${resolveType(schema.items, referencedTypes)}[]`;
      }
      return "any[]";
    case "object":
      if (schema.properties) {
        // Anonymous object type
        const props = Object.entries(schema.properties)
          .map(([propName, propSchema]) => {
            const optional = !(
              schema.required && schema.required.includes(propName)
            );
            const tsType = resolveType(propSchema, referencedTypes);
            return `${propName}${optional ? "?" : ""}: ${tsType};`;
          })
          .join(" ");
        return `{ ${props} }`;
      }
      return "Record<string, any>";
    default:
      return "any";
  }
}

/**
 * Generates a base interface name from the operation ID, method, and entity name.
 *
 * @param operationId - The operation ID from the OpenAPI specification.
 * @param method - The HTTP method (e.g., "get", "post").
 * @param entityName - The name of the entity/resource.
 * @returns The base interface name as a PascalCase string.
 */
export function generateBaseInterfaceName(
  operationId: string | undefined,
  method: string,
  entityName: string
): string {
  const methodCapitalized = capitalizeFirstLetter(method.toLowerCase());
  return operationId
    ? toPascalCase(operationId)
    : `${methodCapitalized}${entityName}`;
}

/**
 * Generates proxy methods based on the HTTP method and endpoint.
 *
 * @param methods - A record of HTTP methods and their corresponding OpenAPI operation objects.
 * @param endpoint - The API endpoint (e.g., "/users").
 * @returns A string representing the TypeScript method signatures for the proxy.
 */
export function generateProxyMethods(
  methods: Record<string, any>,
  endpoint: string
): string {
  // Normalize the endpoint for cleaner method and type names
  const normalizedEndpoint = normalizeEndpoint(endpoint);

  // Define a map for HTTP methods to meaningful method names
  const httpMethodMap: Record<string, string> = {
    post: "create",
    get: "read",
    put: "replace",
    patch: "modify",
    delete: "delete",
  };

  return Object.keys(methods)
    .map((method) => {
      // Use the mapped method name, or default to the HTTP method (lowercased)
      const methodName =
        httpMethodMap[method.toLowerCase()] || method.toLowerCase();
      const pascalCaseEndpoint = toPascalCase(normalizedEndpoint);
      const methodSignature = `${methodName}${pascalCaseEndpoint}`;

      const requestType = `${toPascalCase(method)}${pascalCaseEndpoint}Request`;
      const responseType = `${toPascalCase(method)}${pascalCaseEndpoint}Response`;

      return `${methodSignature}(request: ${requestType}): Promise<${responseType}>;`;
    })
    .join("\n");
}

export function getTemplatePath(templateFile: string): string {
  const templateRoot =
    process.env.SWAGGEN_TEMPLATE_ROOT ||
    path.join(__dirname, "..", "templates");
  return path.join(templateRoot, templateFile);
}

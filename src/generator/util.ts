import { OpenAPIV3 } from "openapi-types";
import * as fs from "fs";
import * as path from "path";

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

export function getTemplatePath(templateFile: string): string {
  const templateRoot =
    process.env.SWAGGEN_TEMPLATE_ROOT ||
    path.join(__dirname, "..", "templates");
  return path.join(templateRoot, templateFile);
}

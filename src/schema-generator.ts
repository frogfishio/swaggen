import * as path from "path";
import * as fs from "fs";

export class SchemaGenerator {
  constructor(private outputPath: string) {}

  // Generate TypeScript interfaces from the OpenAPI schemas
  public generate(schemas: Record<string, any>): void {
    // Ensure the __schema directory exists
    const schemaDir = path.join(this.outputPath, "__schema");
    this.ensureDirectoryExists(schemaDir);

    // Process each schema
    for (const schemaName in schemas) {
      const interfaceName = this.toPascalCase(schemaName);
      // Convert fileName to lowercase
      const fileName = `${interfaceName.toLowerCase()}.ts`;
      const filePath = path.join(schemaDir, fileName);

      // Resolve references and dependencies for the schema
      const { imports, extendsClause } = this.resolveImportsAndExtends(schemas[schemaName]);

      // Generate TypeScript interface content
      const interfaceContent = this.generateInterfaceContent(
        interfaceName,
        schemas[schemaName],
        imports,
        extendsClause
      );

      // Write the interface to the file
      fs.writeFileSync(filePath, interfaceContent, "utf8");
      console.log(`Created schema file: ${filePath}`);
    }
  }

  // Ensure a directory exists, and if not, create it
  private ensureDirectoryExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // Generate TypeScript interface content from a schema definition
  private generateInterfaceContent(
    interfaceName: string,
    schema: any,
    imports: string[],
    extendsClause: string
  ): string {
    let properties = "";

    // Handle 'allOf' for inheritance
    if (schema.allOf) {
      schema = this.handleAllOf(schema.allOf);
    }

    // Generate properties with proper type and optionality
    if (schema.properties) {
      const requiredFields = new Set(schema.required || []);
      properties = Object.entries(schema.properties)
        .map(([key, value]) => {
          const type = this.mapType(value);
          const optionalFlag = requiredFields.has(key) ? "" : "?";
          return `  ${key}${optionalFlag}: ${type};`;
        })
        .join("\n");
    }

    // Generate the full interface content with imports and extends
    return (
      imports.join("\n") +
      `\nexport interface ${interfaceName}${extendsClause} {\n${properties}\n}\n`
    );
  }

  // Handle 'allOf' inheritance by merging properties and collecting imports
  private handleAllOf(allOf: any[]): {
    properties: Record<string, any>;
    required: string[];
  } {
    // Define `combinedSchema` with correct types
    let combinedSchema = {
      properties: {} as Record<string, any>,
      required: [] as string[],
    };

    allOf.forEach((schema) => {
      if (schema.$ref) {
        // This is an inheritance; no need to add as a property
        return;
      } else {
        // Merge properties and required fields
        combinedSchema.properties = {
          ...combinedSchema.properties,
          ...schema.properties,
        };
        combinedSchema.required = [
          ...combinedSchema.required,
          ...(schema.required || []),
        ];
      }
    });

    return combinedSchema;
  }

  // Resolve imports for the referenced schemas and determine any extends clauses
  private resolveImportsAndExtends(schema: any): { imports: string[]; extendsClause: string } {
    const imports: string[] = [];
    let extendsClause = "";

    // Look for all references within the schema
    const resolveRefs = (schema: any) => {
      if (schema.$ref) {
        const refName = this.extractRefName(schema.$ref);
        const pascalCaseRef = this.toPascalCase(refName);
        const refImport = `import { ${pascalCaseRef} } from './${refName.toLowerCase()}';`;

        if (!imports.includes(refImport)) {
          imports.push(refImport);
        }
      } else if (schema.properties) {
        Object.values(schema.properties).forEach((property: any) =>
          resolveRefs(property)
        );
      } else if (schema.items) {
        resolveRefs(schema.items);
      }
    };

    // Resolve references for extending
    if (schema.allOf) {
      const baseSchemas = schema.allOf.filter((subSchema: any) => subSchema.$ref);
      if (baseSchemas.length > 0) {
        const baseSchemaNames = baseSchemas.map((baseSchema: any) =>
          this.toPascalCase(this.extractRefName(baseSchema.$ref))
        );
        extendsClause = ` extends ${baseSchemaNames.join(", ")}`;
        baseSchemas.forEach((baseSchema: any) => resolveRefs(baseSchema));
      }

      // Also resolve properties within `allOf`
      schema.allOf.forEach((subSchema: any) => resolveRefs(subSchema));
    }

    // Resolve any additional references within properties
    resolveRefs(schema);

    return { imports: [...new Set(imports)], extendsClause };
  }

  // Extract reference name from a $ref string
  private extractRefName(ref: string): string {
    return ref.split("/").pop() || "";
  }

  // Map OpenAPI types to TypeScript types
  private mapType(property: any): string {
    // Handle references to other schemas
    if (property.$ref) {
      return this.toPascalCase(this.extractRefName(property.$ref));
    }

    // Example mapping based on simple type. Extend this as needed for other cases.
    switch (property.type) {
      case "string":
        return property.enum
          ? property.enum.map((val: string) => `'${val}'`).join(" | ")
          : "string";
      case "integer":
      case "number":
        return "number";
      case "boolean":
        return "boolean";
      case "array":
        return `${this.mapType(property.items)}[]`;
      case "object":
        if (property.properties) {
          // Handle inline object type
          return `{ ${Object.entries(property.properties)
            .map(([key, value]) => {
              const type = this.mapType(value);
              return `${key}: ${type}`;
            })
            .join("; ")} }`;
        }
        return "Record<string, any>"; // Default to a generic object
      default:
        return "any"; // Default to `any` for unrecognized types
    }
  }

  // Convert a string to PascalCase
  private toPascalCase(str: string): string {
    return str.replace(/(^\w|_\w)/g, (match) =>
      match.replace("_", "").toUpperCase()
    );
  }
}
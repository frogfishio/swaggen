// base.generator.ts
import * as path from "path";
import * as fs from "fs";

export class BaseGenerator {
  constructor(protected outputPath: string) {}

  protected ensureOutputDirectory(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  protected toPascalCase(str: string): string {
    return str.replace(/(^\w|_\w)/g, (match) =>
      match.replace("_", "").toUpperCase()
    );
  }

  protected normalizeEndpoint(endpoint: string): string {
    return endpoint
      .replace(/^\//, "")
      .replace(/\//g, "_")
      .replace(/[{}]/g, "")
      .toLowerCase();
  }

  protected getTemplatePath(templateFile: string): string {
    const templateRoot =
      process.env.SWAGGEN_TEMPLATE_ROOT ||
      path.join(__dirname, "..", "templates");
    return path.join(templateRoot, templateFile);
  }
}

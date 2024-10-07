import * as path from "path";
import * as fs from "fs";
import ejs from "ejs";

export class AdapterGenerator {
  constructor(private outputPath: string) {}

  // Generate an adapter for a specific endpoint, HTTP methods, platform, and capabilities
  public async generate(
    endpoint: string,
    methods: Record<string, any>,
    platform: "lambda" | "cloudflare",
    capabilities: string[] // Pass the capabilities array
  ): Promise<void> {
    // Normalize the endpoint to create a file name (e.g., /users -> users.ts)
    const normalizedEndpoint = endpoint
      .replace(/^\//, "") // Remove leading slash
      .replace(/\//g, "_") // Replace remaining slashes with underscores
      .replace(/[{}]/g, "") // Remove curly braces
      .toLowerCase(); // Convert to lowercase

    const className = this.toPascalCase(normalizedEndpoint) + "Adapter";
    const handlerClassName = this.toPascalCase(normalizedEndpoint) + "Handler";
    const handlerFileName = normalizedEndpoint; // Define handlerFileName

    // Choose the appropriate template based on the platform
    const templateFile =
      platform === "lambda" ? "lambda.ejs" : "cloudflare.ejs";

    // Correctly resolve the path to the template in $PWD/src/templates
    const templatePath = path.join(
      process.cwd(),
      "src",
      "templates",
      templateFile
    );

    // Read the template
    const template = fs.readFileSync(templatePath, "utf8");

    // Render the adapter class template with all its methods
    const adapterClassContent = ejs.render(template, {
      className,
      handlerClassName,
      handlerFileName,
      normalizedEndpoint,
      methods,
      capabilities, // Pass the capabilities to the template
    });

    // Define output path for the adapter
    const adapterFilePath = path.join(
      this.outputPath,
      `adapters`,
      `${normalizedEndpoint}.ts`
    );

    // Ensure the output directory exists
    this.ensureOutputDirectory(path.dirname(adapterFilePath));

    // Write the adapter file
    fs.writeFileSync(adapterFilePath, adapterClassContent.trim(), "utf8");

    console.log(`Created ${platform} adapter class: ${adapterFilePath}`);
  }

  // Ensure a directory exists, and if not, create it
  private ensureOutputDirectory(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // Convert a string to PascalCase
  private toPascalCase(str: string): string {
    return str.replace(/(^\w|_\w)/g, (match) =>
      match.replace("_", "").toUpperCase()
    );
  }
}

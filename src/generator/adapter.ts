import * as path from "path";
import * as fs from "fs";
import ejs from "ejs";

// Type definition for collected route information
interface RouteInfo {
  endpoint: string;
  methods: string[];
  platform: "lambda" | "cloudflare" | "express";
}

export class AdapterGenerator {
  private routes: RouteInfo[] = []; // Store collected route information

  constructor(private outputPath: string) {}

  // Generate an adapter for a specific endpoint, HTTP methods, platform, and capabilities
  public async generate(
    endpoint: string,
    methods: Record<string, any>,
    platform: "lambda" | "cloudflare" | "express", // Add express as an option
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

    // Extract method names as an array to use in the template
    const methodKeys = Object.keys(methods);

    // Collect route information for linker/deployment generation
    this.routes.push({
      endpoint,
      methods: methodKeys.map((method) => method.toUpperCase()),
      platform,
    });

    // Choose the appropriate template based on the platform
    const templateFile =
      platform === "lambda"
        ? "lambda.ejs"
        : platform === "cloudflare"
        ? "cloudflare.ejs"
        : "express.ejs"; // Use "express.ejs" for Express platform

    // Use the SWAGGEN_TEMPLATE_ROOT environment variable for development, or fallback to __dirname for production
    const templateRoot =
      process.env.SWAGGEN_TEMPLATE_ROOT ||
      path.join(__dirname, "..", "templates");

    // Correctly resolve the path to the template file
    const templatePath = path.join(templateRoot, templateFile);

    // Read the template
    const template = fs.readFileSync(templatePath, "utf8");

    // Render the adapter class template with all its methods
    const adapterClassContent = ejs.render(template, {
      className,
      handlerClassName,
      handlerFileName,
      normalizedEndpoint,
      methods: methodKeys, // Pass method keys to iterate over in the template
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

  // Get the collected route information for further processing
  public getRoutes(): RouteInfo[] {
    return this.routes;
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

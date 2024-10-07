import ejs from "ejs"; // Import EJS for templating
import * as path from "path";
import * as fs from "fs";
import * as yaml from "js-yaml";
import { Command } from "commander";
import { HandlerGenerator } from "./handler-generator";
import { SchemaGenerator } from "./schema-generator";
import { AdapterGenerator } from "./adapter-generator"; // Import your adapter generator

class AppCLI {
  private program: Command;

  constructor() {
    this.program = new Command();
    this.setup();
  }

  // Method to set up the command-line options
  private setup() {
    // Set the version and description
    this.program
      .version("1.0.0")
      .description("A CLI tool for processing YAML files");

    // Define the main command and its options
    this.program
      .argument("<filename.yaml>", "YAML file to process")
      .option("-o, --out <output path>", "Specify the output path", "./output") // Default output path
      .option("--clean", "Clean the output folder before generating new files") // Add clean option
      .option(
        "--target <platform>",
        "Specify the target platform (lambda|cloudflare)",
        "lambda" // Default to lambda
      )
      .option(
        "--capabilities <capabilities...>",
        "Specify a list of capabilities (e.g., log, s3, db)"
      )
      .action(this.handleAction.bind(this)); // Use `bind` to preserve context
  }

  // Action handler method for processing the command
  private async handleAction(
    filename: string,
    options: {
      out: string;
      clean: boolean;
      target: "lambda" | "cloudflare";
      capabilities?: string[];
    }
  ) {
    const inputFilePath = path.resolve(filename);
    const outputPath = path.resolve(options.out);
    const targetPlatform = options.target;
    const capabilities = options.capabilities || [];

    console.log(`Processing file: ${inputFilePath}`);
    console.log(`Output will be saved to: ${outputPath}`);
    console.log(`Target platform: ${targetPlatform}`);
    console.log(`Capabilities: ${capabilities.join(", ")}`);

    // Clean the output directory if --clean is specified
    if (options.clean) {
      this.cleanOutputDirectory(outputPath);
    }

    // Ensure output directory exists
    this.ensureOutputDirectory(outputPath);

    // Copy target-specific capabilities folder and common capabilities file
    await this.copyCapabilities(outputPath, targetPlatform);

    // Generate the base file from the template
    await this.generateBaseFile(outputPath);

    // Load the YAML file
    try {
      const fileContents = fs.readFileSync(inputFilePath, "utf8");
      const parsedYAML = yaml.load(fileContents) as any;

      // Check if it's a valid OpenAPI file
      if (!parsedYAML || !parsedYAML.paths) {
        console.error("Invalid OpenAPI YAML file: No 'paths' found.");
        return;
      }

      // Generate schemas
      if (parsedYAML.components && parsedYAML.components.schemas) {
        const schemaGenerator = new SchemaGenerator(outputPath);
        schemaGenerator.generate(parsedYAML.components.schemas);
      }

      // Initialize the HandlerGenerator
      const handlerGenerator = new HandlerGenerator(outputPath);
      const adapterGenerator = new AdapterGenerator(outputPath);

      // Process each endpoint
      for (const endpoint in parsedYAML.paths) {
        const methods = parsedYAML.paths[endpoint];

        // Generate handler files
        handlerGenerator.generate(endpoint, methods);

        // Generate adapters for the specified target and pass capabilities
        await adapterGenerator.generate(
          endpoint,
          methods,
          targetPlatform,
          capabilities
        );
      }

      console.log("File generation completed.");
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error processing file: ${error.message}`);
      } else {
        console.error("An unknown error occurred");
      }
    }
  }

  // Copy target-specific capabilities directory and matching files
  private async copyCapabilities(outputPath: string, target: string) {
    const sourceCapabilitiesPath = path.join(
      process.cwd(),
      "src",
      "capabilities"
    );
    const targetCapabilitiesPath = path.join(outputPath, "capabilities");

    console.log(
      `Copying capabilities for target ${target} from ${sourceCapabilitiesPath} to ${targetCapabilitiesPath}`
    );

    this.ensureOutputDirectory(targetCapabilitiesPath);

    // Recursively copy all files and subdirectories from target-specific folder
    const sourceTargetPath = path.join(sourceCapabilitiesPath, target);
    const destTargetPath = path.join(targetCapabilitiesPath, target);
    this.copyDirectoryRecursive(sourceTargetPath, destTargetPath);

    // Copy and rename files matching <target>-* pattern
    const items = fs.readdirSync(sourceCapabilitiesPath);
    for (const item of items) {
      if (item.startsWith(`${target}-`)) {
        const srcFilePath = path.join(sourceCapabilitiesPath, item);
        const destFileName = item.replace(`${target}-`, "");
        const destFilePath = path.join(targetCapabilitiesPath, destFileName);

        fs.copyFileSync(srcFilePath, destFilePath);

        console.log(`Copied and renamed: ${srcFilePath} to ${destFilePath}`);
      }
    }

    // Always copy the common capabilities.ts file
    const commonCapabilitiesFile = path.join(
      sourceCapabilitiesPath,
      "capabilities.ts"
    );
    if (fs.existsSync(commonCapabilitiesFile)) {
      const destCapabilitiesFile = path.join(
        targetCapabilitiesPath,
        "capabilities.ts"
      );
      fs.copyFileSync(commonCapabilitiesFile, destCapabilitiesFile);
      console.log(
        `Copied common capabilities file: ${commonCapabilitiesFile} to ${destCapabilitiesFile}`
      );
    }

    console.log("Capabilities copied successfully.");
  }

  // Recursively copy a directory
  private copyDirectoryRecursive(srcDir: string, destDir: string) {
    if (!fs.existsSync(srcDir)) {
      console.error(`Source directory ${srcDir} does not exist.`);
      return;
    }

    // Create destination directory if it does not exist
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const items = fs.readdirSync(srcDir);
    for (const item of items) {
      const srcPath = path.join(srcDir, item);
      const destPath = path.join(destDir, item);

      if (fs.statSync(srcPath).isDirectory()) {
        // Recursively copy subdirectory
        this.copyDirectoryRecursive(srcPath, destPath);
      } else {
        // Copy file
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  // Generate the base file from template
  private async generateBaseFile(outputPath: string) {
    try {
      // Correct template path from project root
      const templatePath = path.join(
        process.cwd(),
        "src",
        "templates",
        "base.ejs"
      );

      // Ensure "handlers" subfolder exists
      const handlersDir = path.join(outputPath, "handlers");
      this.ensureOutputDirectory(handlersDir);

      // Set the output path for the base file inside the "handlers" folder
      const outputFilePath = path.join(handlersDir, "_.ts"); // Output file name

      // Read the template
      const template = fs.readFileSync(templatePath, "utf8");

      // Render the template (you can pass any necessary variables here)
      const rendered = ejs.render(template, {});

      // Write the rendered content to the output file
      fs.writeFileSync(outputFilePath, rendered, "utf8");

      console.log(`Base file generated at ${outputFilePath}`);
    } catch (error) {
      console.error("Error generating base file:", error);
    }
  }

  // Clean the output directory if it exists
  private cleanOutputDirectory(outputPath: string) {
    if (fs.existsSync(outputPath)) {
      console.log(`Cleaning output directory: ${outputPath}`);
      fs.rmSync(outputPath, { recursive: true, force: true });
      console.log(`Output directory cleaned: ${outputPath}`);
    }
  }

  // Ensure the output directory exists, and if not, create it
  private ensureOutputDirectory(outputPath: string) {
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
  }

  // Method to parse command-line arguments
  public parse() {
    this.program.parse(process.argv);
  }
}

// Create an instance of the CLI class and parse the arguments
const appCLI = new AppCLI();
appCLI.parse();

import ejs from "ejs";
import * as path from "path";
import * as fs from "fs";
import * as yaml from "js-yaml";
import { Command } from "commander";
import { HandlerGenerator } from "./generator/handler";
import { SchemaGenerator } from "./generator/schema";
import { AdapterGenerator } from "./generator/adapter";
import { CapabilitiesCopier } from "./generator/capabilities"; // Import the new copier class
import { BaseFileGenerator } from "./generator/base"; // Import the new base file generator class
import { DeploymentGenerator } from "./generator/deployment/deployment"; // Import the DeploymentGenerator class

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
      .option("-o, --out <output path>", "Specify the output path", "./output")
      .option("--clean", "Clean the output folder before generating new files")
      .option(
        "--target <platform>",
        "Specify the target platform (lambda|cloudflare|express)",
        "lambda"
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
      target: "lambda" | "cloudflare" | "express";
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

    // Create instances of the helper classes
    const capabilitiesCopier = new CapabilitiesCopier();
    const baseFileGenerator = new BaseFileGenerator();
    const deploymentGenerator = new DeploymentGenerator(outputPath); // Initialize DeploymentGenerator

    // Copy target-specific capabilities folder and common capabilities file
    // await capabilitiesCopier.copyCapabilities(outputPath, targetPlatform);

    // Generate the base file from the template
    await baseFileGenerator.generateBaseFile(outputPath);

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

      // Initialize the HandlerGenerator and AdapterGenerator
      const handlerGenerator = new HandlerGenerator(outputPath);
      const adapterGenerator = new AdapterGenerator(outputPath);

      // Initialize endpointMethods to store the structure correctly
      const endpointMethods: Record<string, string[]> = {};

      // Process each endpoint
      for (const endpoint in parsedYAML.paths) {
        const methods = parsedYAML.paths[endpoint];
        // Collect the HTTP methods for each endpoint
        endpointMethods[endpoint] = Object.keys(methods);

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

      // Generate deployment scripts or configuration
      await deploymentGenerator.generate(
        targetPlatform,
        endpointMethods, // Pass the correct format for endpoint methods
        capabilities
      );

      console.log("File generation completed.");
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error processing file: ${error.message}`);
      } else {
        console.error("An unknown error occurred");
      }
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

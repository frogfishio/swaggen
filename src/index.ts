import ejs from "ejs"; // Import EJS for templating
import * as path from "path";
import * as fs from "fs";
import * as yaml from "js-yaml";
import { Command } from "commander";
import { HandlerGenerator } from "./handler-generator";
import { SchemaGenerator } from "./schema-generator";

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
      .action(this.handleAction.bind(this)); // Use `bind` to preserve context
  }

  // Action handler method for processing the command
  private async handleAction(
    filename: string,
    options: { out: string; clean: boolean }
  ) {
    const inputFilePath = path.resolve(filename);
    const outputPath = path.resolve(options.out);

    console.log(`Processing file: ${inputFilePath}`);
    console.log(`Output will be saved to: ${outputPath}`);

    // Clean the output directory if --clean is specified
    if (options.clean) {
      this.cleanOutputDirectory(outputPath);
    }

    // Ensure output directory exists
    this.ensureOutputDirectory(outputPath);

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

      // Process each endpoint
      for (const endpoint in parsedYAML.paths) {
        const httpMethods = Object.keys(parsedYAML.paths[endpoint]);
        handlerGenerator.generate(endpoint, parsedYAML.paths[endpoint]);
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
      const outputFilePath = path.join(outputPath, "_.ts"); // Output file name

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

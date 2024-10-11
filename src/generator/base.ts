import * as path from "path";
import * as fs from "fs";
import ejs from "ejs";

export class BaseFileGenerator {
  // Generate the base file from template
  public async generateBaseFile(outputPath: string) {
    try {
      // Use the SWAGGEN_TEMPLATE_ROOT environment variable for development, if available
      const templateRoot =
        process.env.SWAGGEN_TEMPLATE_ROOT ||
        path.join(__dirname, "..", "templates");

      // Resolve the template path
      const templatePath = path.join(templateRoot, "base.ejs");

      // Ensure "handlers" subfolder exists
      const handlersDir = path.join(outputPath, "handlers");
      this.ensureOutputDirectory(handlersDir);

      // Set the output path for the base file inside the "handlers" folder
      const outputFilePath = path.join(handlersDir, "_.ts"); // Output file name

      // Read the template file
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

  // Ensure the output directory exists, and if not, create it
  private ensureOutputDirectory(outputPath: string) {
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
  }
}

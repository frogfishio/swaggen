import * as path from "path";
import * as fs from "fs";

export class CapabilitiesCopier {
  // Copy target-specific capabilities directory and matching files
  public async copyCapabilities(outputPath: string, target: string) {
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

  // Ensure the output directory exists, and if not, create it
  private ensureOutputDirectory(outputPath: string) {
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
  }
}

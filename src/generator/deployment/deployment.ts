import * as path from "path";
import * as fs from "fs";
import { ExpressDeploymentGenerator } from "./express"; // Import the new class

export class DeploymentGenerator {
  constructor(private outputPath: string) {}

  // Generate deployment script or configuration
  public async generate(
    target: string,
    endpointMethods: Record<string, string[]>, // Change to use endpointMethods object
    capabilities: string[]
  ): Promise<void> {
    // Use the provided output path directly
    const deploymentFilePath = this.outputPath;

    // Create different scripts or configurations based on the target platform
    switch (target) {
      case "lambda":
        this.generateLambdaDeployment(
          deploymentFilePath,
          Object.keys(endpointMethods), // Pass only endpoint keys
          capabilities
        );
        break;
      case "cloudflare":
        this.generateCloudflareDeployment(
          deploymentFilePath,
          Object.keys(endpointMethods), // Pass only endpoint keys
          capabilities
        );
        break;
      case "express":
        // Use the ExpressDeploymentGenerator
        const expressDeploymentGenerator = new ExpressDeploymentGenerator(
          deploymentFilePath
        );
        expressDeploymentGenerator.generate(endpointMethods, capabilities);
        break;
      default:
        console.warn(`Unrecognized target platform: ${target}`);
        break;
    }

    console.log(`Created deployment configuration for ${target}`);
  }

  private generateLambdaDeployment(
    filePath: string,
    endpoints: string[],
    capabilities: string[]
  ) {
    // Generate a deployment script for AWS Lambda
    const deploymentContent = `# AWS Lambda deployment script
# Endpoints: ${endpoints.join(", ")}
# Capabilities: ${capabilities.join(", ")}
# You can add more details or logic for generating the deployment here.
`;
    fs.writeFileSync(
      path.join(filePath, "lambda-deployment.yml"),
      deploymentContent,
      "utf8"
    );
  }

  private generateCloudflareDeployment(
    filePath: string,
    endpoints: string[],
    capabilities: string[]
  ) {
    // Generate a deployment script for Cloudflare
    const deploymentContent = `# Cloudflare deployment script
# Endpoints: ${endpoints.join(", ")}
# Capabilities: ${capabilities.join(", ")}
# You can add more details or logic for generating the deployment here.
`;
    fs.writeFileSync(
      path.join(filePath, "cloudflare-deployment.yml"),
      deploymentContent,
      "utf8"
    );
  }
}

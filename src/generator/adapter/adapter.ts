import { RouteInfo } from "./types"; // Assuming you have a types module for RouteInfo

// Import the platform-specific generators
import { LambdaAdapterGenerator } from "./lambda.adapter";
import { CloudflareAdapterGenerator } from "./cloudflare.adapter";
import { ExpressAdapterGenerator } from "./express.adapter";

export class AdapterGenerator {
  private lambdaGenerator: LambdaAdapterGenerator;
  private cloudflareGenerator: CloudflareAdapterGenerator;
  private expressGenerator: ExpressAdapterGenerator;
  private routes: RouteInfo[] = []; // Collect routes from all generators

  constructor(private outputPath: string) {
    this.lambdaGenerator = new LambdaAdapterGenerator(outputPath);
    this.cloudflareGenerator = new CloudflareAdapterGenerator(outputPath);
    this.expressGenerator = new ExpressAdapterGenerator(outputPath);
  }

  public async generate(
    endpoint: string,
    methods: Record<string, any>,
    platform: "lambda" | "cloudflare" | "express",
    capabilities: string[]
  ): Promise<void> {
    switch (platform) {
      case "lambda":
        await this.lambdaGenerator.generate(endpoint, methods, capabilities);
        this.routes.push(...this.lambdaGenerator.getRoutes());
        break;
      case "cloudflare":
        await this.cloudflareGenerator.generate(
          endpoint,
          methods,
          capabilities
        );
        this.routes.push(...this.cloudflareGenerator.getRoutes());
        break;
      case "express":
        await this.expressGenerator.generate(endpoint, methods, capabilities);
        this.routes.push(...this.expressGenerator.getRoutes());
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  public getRoutes(): RouteInfo[] {
    return this.routes;
  }
}

// lambda.generator.ts
import * as path from "path";
import * as fs from "fs";
import ejs from "ejs";
import { RouteInfo } from "./types";
import { BaseGenerator } from "./base.adapter";

export class LambdaAdapterGenerator extends BaseGenerator {
  private routes: RouteInfo[] = [];

  constructor(outputPath: string) {
    super(outputPath);
  }

  public async generate(
    endpoint: string,
    methods: Record<string, any>,
    capabilities: string[]
  ): Promise<void> {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const className = this.toPascalCase(normalizedEndpoint) + "Adapter";
    const handlerClassName = this.toPascalCase(normalizedEndpoint) + "Handler";
    const handlerFileName = normalizedEndpoint;
    const methodKeys = Object.keys(methods);

    // Collect route information
    this.routes.push({
      endpoint,
      methods: methodKeys.map((method) => method.toUpperCase()),
      platform: "lambda",
    });

    // Render the template
    const templatePath = this.getTemplatePath("lambda.ejs");
    const template = fs.readFileSync(templatePath, "utf8");
    const adapterClassContent = ejs.render(template, {
      className,
      handlerClassName,
      handlerFileName,
      endpoint,
      normalizedEndpoint,
      methods: methodKeys,
      capabilities,
    });

    // Write the adapter file
    const adapterFilePath = path.join(
      this.outputPath,
      normalizedEndpoint,
      "adapter.ts"
    );
    this.ensureOutputDirectory(path.dirname(adapterFilePath));
    fs.writeFileSync(adapterFilePath, adapterClassContent.trim(), "utf8");

    console.log(`Created Lambda adapter: ${adapterFilePath}`);
  }

  public getRoutes(): RouteInfo[] {
    return this.routes;
  }
}

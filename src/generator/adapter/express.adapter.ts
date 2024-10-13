// express.adapter.ts
import * as path from "path";
import * as fs from "fs";
import ejs from "ejs";
import { RouteInfo } from "./types";
import {
  ensureOutputDirectory,
  toPascalCase,
  normalizeEndpoint,
  getTemplatePath,
} from "../util";

export class ExpressAdapterGenerator {
  private routes: RouteInfo[] = [];

  constructor(private outputPath: string) {}

  public async generate(
    endpoint: string,
    methods: Record<string, any>,
    capabilities: string[]
  ): Promise<void> {
    // Normalize endpoint and define class names
    const normalizedEndpoint = normalizeEndpoint(endpoint);
    const className = toPascalCase(normalizedEndpoint) + "Adapter";
    const handlerClassName = toPascalCase(normalizedEndpoint) + "Handler";
    const handlerFileName = normalizedEndpoint;
    const methodKeys = Object.keys(methods);

    // Collect route information
    this.routes.push({
      endpoint,
      methods: methodKeys.map((method) => method.toUpperCase()),
      platform: "express",
    });

    // Render the template
    const templatePath = getTemplatePath("express.ejs");
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
    ensureOutputDirectory(path.dirname(adapterFilePath));
    fs.writeFileSync(adapterFilePath, adapterClassContent.trim(), "utf8");

    console.log(`Created Express adapter: ${adapterFilePath}`);
  }

  public getRoutes(): RouteInfo[] {
    return this.routes;
  }
}

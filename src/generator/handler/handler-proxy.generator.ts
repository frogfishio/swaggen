import { generateInterfaceDefinitions } from "./handler-types.generator";
import * as fs from 'fs';
import * as path from 'path';

export class HandlerProxyGenerator {
  constructor(private outputPath: string) {}

  public generateProxy(
    endpoint: string,
    methods: Record<string, any>
  ): void {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const className = this.toPascalCase(normalizedEndpoint) + "Proxy";

    // Create directory for the proxy file: <out>/<normalizedEndpoint>
    const targetDir = path.join(this.outputPath, normalizedEndpoint);
    this.ensureDirectoryExists(targetDir);

    // Generate interface imports and class proxy methods
    const { imports, interfaces } = generateInterfaceDefinitions(endpoint, methods);
    const proxyMethods = this.generateProxyMethods(methods, className, endpoint);

    // Combine all parts into a proxy.ts file content
    const proxyContent = this.buildProxyContent(imports, className, proxyMethods);

    // Write the proxy.ts file
    const proxyFilePath = path.join(targetDir, `proxy.ts`);
    fs.writeFileSync(proxyFilePath, proxyContent, "utf8");
    console.log(`Created proxy file: ${proxyFilePath}`);
  }

  private generateProxyMethods(
    methods: Record<string, any>,
    className: string,
    endpoint: string
  ): string {
    return Object.keys(methods)
      .map((method) => {
        const requestType = `${this.toPascalCase(method)}${this.toPascalCase(endpoint)}Request`;
        const responseType = `${this.toPascalCase(method)}${this.toPascalCase(endpoint)}Response`;

        return `
        public async ${method}(request: ${requestType}): Promise<${responseType}> {
          return this.handler.${method}(request);
        }
        `;
      })
      .join("\n");
  }

  private buildProxyContent(
    imports: string,
    className: string,
    methods: string
  ): string {
    return `
    // Auto-generated proxy for ${className}
    ${imports}

    export class ${className} {
      constructor(private handler: ${className.replace('Proxy', 'Handler')}) {}

      ${methods}
    }
    `;
  }

  private normalizeEndpoint(endpoint: string): string {
    return endpoint.replace(/\//g, '_');
  }

  private toPascalCase(str: string): string {
    return str
      .replace(/(^\\w|_\\w)/g, (match) => match.replace('_', '').toUpperCase())
      .replace(/\s+/g, '');
  }

  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

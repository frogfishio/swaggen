import * as fs from "fs";
import * as path from "path";
import * as ejs from "ejs";

export class InvokerGenerator {
  constructor(private outputPath: string) {}

  public generate(
    platform: "express" | "lambda" | "cloudflare",
    routes: any[]
  ) {
    const templatePath = path.join(
      __dirname,
      `templates/${platform}-invoker.ejs`
    );
    const template = fs.readFileSync(templatePath, "utf-8");

    routes.forEach((route) => {
      const {
        path: routePath,
        methods,
        handlerClassName,
        handlerFileName,
      } = route;

      // Render template with context
      const rendered = ejs.render(template, {
        route: routePath,
        methods,
        handlerClassName,
        handlerFileName,
        lambdaHandlerName: `${handlerClassName}Lambda`,
      });

      // Write the rendered code to a file in the platform-specific output folder
      const platformOutputPath = path.join(
        this.outputPath,
        platform,
        `${handlerFileName}.js`
      );
      fs.writeFileSync(platformOutputPath, rendered, "utf8");
      console.log(`Generated ${platform} invoker for route: ${routePath}`);
    });
  }
}

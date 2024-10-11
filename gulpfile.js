const gulp = require("gulp");
const ts = require("gulp-typescript");
const clean = require("gulp-clean");
const jsonTransform = require("gulp-json-transform");
const header = require("gulp-header");
const bump = require("gulp-bump");
const rename = require("gulp-rename");
const fs = require("fs");
const path = require("path");

// Paths
const paths = {
  dist: "dist/", // Final deployable folder
  distTypes: "dist.types/", // Final deployable folder for types
  build: "build/", // Folder containing the compiled JS files from TypeScript
  typesSrc: "src/types.ts", // Path to the TypeScript file with your types
  typesOut: "dist.types/", // Output directory for .d.ts files
  typesPackageJson: "package.types.json", // Separate package.json for the types package
  packageJson: "package.json", // Main project package.json
  templates: "src/templates/**/*", // Path to the templates
  readme: "README.md",
  license: "LICENSE",
  transpiledJS: "build/**/*.js", // Transpiled JS files from the 'build' folder
  entryPoint: "build/index.js", // The entry point for the CLI tool
};

// Shebang to add at the top of the entry point
const shebang = "#!/usr/bin/env node\n";

// Task to clean the dist directory
gulp.task("clean", () => {
  return gulp.src(paths.dist, { allowEmpty: true, read: false }).pipe(clean());
});

// Task to clean the dist-types directory
gulp.task("clean-types", () => {
  return gulp
    .src(paths.distTypes, { allowEmpty: true, read: false })
    .pipe(clean());
});

// Task to bump the version in package.json
gulp.task("bump-version", () => {
  return gulp
    .src(paths.packageJson)
    .pipe(bump({ type: "patch" })) // Increment version in package.json
    .pipe(gulp.dest("./")); // Save the updated package.json
});

// Task to sync the version from package.json to package.types.json
gulp.task("sync-version", (done) => {
  const mainPkg = JSON.parse(fs.readFileSync(paths.packageJson)); // Read the updated package.json
  return gulp
    .src(paths.typesPackageJson)
    .pipe(
      jsonTransform((pkg) => {
        pkg.version = mainPkg.version; // Sync version from package.json
        return pkg;
      }, 2)
    )
    .pipe(gulp.dest("./")); // Save the updated package.types.json
});

// Task to copy necessary assets and source files to dist, adjusting the base for templates
gulp.task("copy-assets", () => {
  return gulp
    .src([paths.readme, paths.license], { base: "./" })
    .pipe(gulp.dest(paths.dist));
});

// Task to copy templates to dist/templates
gulp.task("copy-templates", () => {
  return gulp
    .src(paths.templates, { base: "src/templates" })
    .pipe(gulp.dest(path.join(paths.dist, "templates")));
});

// Task to copy and modify package.json
gulp.task("copy-package-json", () => {
  return gulp
    .src(paths.packageJson)
    .pipe(
      jsonTransform((pkg) => {
        // Remove dev dependencies and unnecessary fields
        delete pkg.devDependencies;
        delete pkg.scripts;

        // Modify fields for the published package
        pkg.main = "index.js";

        // Add bin field to make the package executable as a CLI
        pkg.bin = {
          swaggen: "./index.js", // Points to transpiled entry point in dist
        };

        return pkg;
      }, 2)
    )
    .pipe(gulp.dest(paths.dist));
});

// Task to copy transpiled JavaScript files from build to dist
gulp.task("copy-js", () => {
  return gulp
    .src(paths.transpiledJS, { base: "./build" })
    .pipe(gulp.dest(paths.dist));
});

// Task to add the shebang to the entry point (index.js)
gulp.task("add-shebang", () => {
  return gulp
    .src(path.join(paths.dist, "index.js"))
    .pipe(header(shebang)) // Add the shebang at the top
    .pipe(gulp.dest(paths.dist));
});

// Task to set execute permissions using Node's built-in fs module
gulp.task("chmod", (done) => {
  const indexPath = path.join(paths.dist, "index.js");
  fs.chmod(indexPath, 0o755, (err) => {
    if (err) {
      throw err;
    }
    done();
  });
});

// Task to generate .d.ts files using tsconfig.types.json and output to dist-types
gulp.task("build-types", () => {
  const tsProject = ts.createProject("tsconfig.types.json");
  return tsProject
    .src()
    .pipe(tsProject()) // Compile TypeScript to .d.ts files
    .dts.pipe(gulp.dest(paths.typesOut)); // Output to dist-types
});

// Task to copy and rename package.types.json to package.json in dist-types
gulp.task("copy-types-package-json", () => {
  return gulp
    .src(paths.typesPackageJson)
    .pipe(rename("package.json")) // Rename package.types.json to package.json
    .pipe(gulp.dest(paths.typesOut));
});

// Main task to build the main project
const buildMain = gulp.series(
  "clean",
  gulp.parallel(
    "copy-assets",
    "copy-templates",
    "copy-js",
    "copy-package-json"
  ),
  "add-shebang",
  "chmod"
);

// Task to build the types package (in parallel to the main build)
const buildTypes = gulp.series(
  "clean-types",
  "build-types",
  "copy-types-package-json"
);

// Task to bump versions and then build both main and types
const buildAll = gulp.series(
  "bump-version", // Bump package.json first (master)
  "sync-version", // Sync the bumped version to package.types.json
  gulp.parallel(buildMain, buildTypes) // Build both packages
);

// Export tasks
gulp.task("clean", buildMain);
gulp.task("build-types", buildTypes);
gulp.task("default", buildAll);

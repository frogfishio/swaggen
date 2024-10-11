const gulp = require("gulp");
const clean = require("gulp-clean");
const jsonTransform = require("gulp-json-transform");
const header = require("gulp-header");
const fs = require("fs");
const path = require("path");

// Paths
const paths = {
  dist: "dist/", // Final deployable folder
  build: "build/", // Folder containing the compiled JS files from TypeScript
  packageJson: "package.json",
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

// Task to copy necessary assets and source files to dist, adjusting the base for templates
gulp.task("copy-assets", () => {
  // Copy README and LICENSE files with base "./"
  gulp
    .src([paths.readme, paths.license], { base: "./" })
    .pipe(gulp.dest(paths.dist));

  // Copy templates and flatten the directory so it's copied to dist/templates
  return gulp
    .src(paths.templates, { base: "src/templates" }) // Set the base to 'src/templates'
    .pipe(gulp.dest(path.join(paths.dist, "templates"))); // Output to dist/templates
});

// Task to copy and modify package.json
gulp.task("package-json", () => {
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
    ) // Pretty print JSON with 2 spaces
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
    .src(path.join(paths.dist, "index.js")) // Target the copied index.js in dist
    .pipe(header(shebang)) // Add the shebang at the top
    .pipe(gulp.dest(paths.dist)); // Save it back to dist
});

// Task to set execute permissions using Node's built-in fs module
gulp.task("chmod", (done) => {
  const indexPath = path.join(paths.dist, "index.js");
  fs.chmod(indexPath, 0o755, (err) => {
    // 0o755 means read and execute for all, write for owner
    if (err) {
      throw err;
    }
    done();
  });
});

// Default task to prepare everything for publishing
gulp.task(
  "build-dist",
  gulp.series(
    "clean",
    "copy-assets",
    "package-json",
    "copy-js",
    "add-shebang",
    "chmod"
  )
);

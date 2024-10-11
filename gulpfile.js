const { src, dest, series, parallel } = require("gulp");
const clean = require("gulp-clean");
const jsonTransform = require("gulp-json-transform");
const header = require("gulp-header");
const bump = require("gulp-bump"); // Version bumping
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
function cleanDist() {
  return src(paths.dist, { allowEmpty: true, read: false }).pipe(clean());
}

// Task to bump version in package.json before copying
function bumpVersion() {
  return src(paths.packageJson)
    .pipe(bump({ type: "patch" })) // Increment version, 'patch', 'minor', or 'major'
    .pipe(dest("./")); // Save the updated package.json in the root directory
}

// Task to copy README and LICENSE to dist
function copyAssets() {
  return src([paths.readme, paths.license], { base: "./" }).pipe(
    dest(paths.dist)
  );
}

// Task to copy and modify package.json
function copyPackageJson() {
  return src(paths.packageJson)
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
    .pipe(dest(paths.dist));
}

// Task to copy transpiled JavaScript files from build to dist
function copyJS() {
  return src(paths.transpiledJS, { base: "./build" }).pipe(dest(paths.dist));
}

// Task to copy templates to dist/templates
function copyTemplates() {
  return src(paths.templates, { base: "src/templates" }).pipe(
    dest(path.join(paths.dist, "templates"))
  );
}

// Task to add the shebang to the entry point (index.js)
function addShebang() {
  return src(path.join(paths.dist, "index.js"))
    .pipe(header(shebang)) // Add the shebang at the top
    .pipe(dest(paths.dist));
}

// Task to set execute permissions using Node's built-in fs module
function chmod(done) {
  const indexPath = path.join(paths.dist, "index.js");
  fs.chmod(indexPath, 0o755, (err) => {
    if (err) {
      throw err;
    }
    done();
  });
}

// Build task in series: clean -> bump version -> copy assets and js -> package.json -> add shebang -> set permissions
const build = series(
  cleanDist,
  bumpVersion,
  parallel(copyAssets, copyTemplates, copyJS, copyPackageJson),
  addShebang,
  chmod
);

// Export tasks
exports.clean = cleanDist;
exports.bump = bumpVersion;
exports.build = build;
exports.default = build;

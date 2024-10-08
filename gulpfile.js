const gulp = require("gulp");
const clean = require("gulp-clean");
const jsonTransform = require("gulp-json-transform");
const path = require("path");

// Paths
const paths = {
  dist: "dist/",
  packageJson: "package.json",
  templates: "src/templates/**/*", // Adjust path to your asset folder
  readme: "README.md",
  license: "LICENSE",
};

// Task to clean the dist directory
gulp.task("clean", () => {
  return gulp.src(paths.dist, { allowEmpty: true, read: false }).pipe(clean());
});

// Task to copy necessary assets and source files to dist
gulp.task("copy-assets", () => {
  return gulp
    .src([paths.templates, paths.readme, paths.license], { base: "./" })
    .pipe(gulp.dest(paths.dist));
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

        // Modify fields as necessary for the published package
        pkg.main = "index.js";
        return pkg;
      }, 2)
    ) // Pretty print JSON with 2 spaces
    .pipe(gulp.dest(paths.dist));
});

// Task to copy transpiled JavaScript files to dist
gulp.task("copy-js", () => {
  return gulp
    .src("dist/**/*.js")
    .pipe(gulp.dest(path.join(paths.dist, "dist")));
});

// Default task to prepare everything for publishing
gulp.task(
  "build-dist",
  gulp.series("clean", "copy-assets", "package-json", "copy-js")
);

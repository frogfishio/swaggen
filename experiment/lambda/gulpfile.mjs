import gulp from "gulp";
import ts from "gulp-typescript";
import clean from "gulp-clean";
import jsonTransform from "gulp-json-transform";
import zip from "gulp-zip";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

// Promisify exec for async handling
const execAsync = promisify(exec);

// Paths
const paths = {
  dist: "dist/", // Final deployable folder
  tempSrc: "dist/_src/", // Temporary folder for compiled files
  src: "src/**/*.ts", // All TypeScript files in the src folder
  adapters: "src/service/adapters/**/*.ts", // Adapter TS files
  handlers: "src/service/handlers/**/*.ts", // Handler TS files, including _.ts
  underscoreJs: "dist/_src/service/handlers/_.js", // The compiled _.js file after TypeScript compilation
  packageJson: "package.json", // Main project package.json
  lambdaZip: "lambda-function.zip", // Final zip file name
};

// Task to clean the dist directory and remove previous zip files
gulp.task("clean", () => {
  return gulp
    .src([paths.dist], { allowEmpty: true, read: false })
    .pipe(clean());
});

// Task to compile TypeScript files to the temporary _src directory
gulp.task("build-ts", () => {
  const tsProject = ts.createProject("tsconfig.json", {
    declaration: false, // Ensure no .d.ts files are generated
    outDir: paths.tempSrc, // Output to _src folder in dist
  });

  return gulp.src([paths.src]).pipe(tsProject()).pipe(gulp.dest(paths.tempSrc));
});

// Task to create a new structure for each adapter and handler combination
gulp.task("create-dist-structure", (cb) => {
  const adapterFiles = fs
    .readdirSync("src/service/adapters")
    .filter((file) => file.endsWith(".ts")) // Only TypeScript files
    .map((file) => path.basename(file, ".ts")); // Strip the .ts extension

  // For each adapter file, create a directory structure and copy the files
  adapterFiles.forEach((filename) => {
    const adapterSource = path.join(
      paths.tempSrc,
      "service/adapters",
      `${filename}.js`
    );
    const handlerSource = path.join(
      paths.tempSrc,
      "service/handlers",
      `${filename}.js`
    );
    const underscoreJsSource = paths.underscoreJs;

    const adapterDestDir = path.join(paths.dist, filename, "service/adapters");
    const handlerDestDir = path.join(paths.dist, filename, "service/handlers");

    // Ensure directories exist
    fs.mkdirSync(adapterDestDir, { recursive: true });
    fs.mkdirSync(handlerDestDir, { recursive: true });

    // Copy adapter file
    if (fs.existsSync(adapterSource)) {
      fs.copyFileSync(
        adapterSource,
        path.join(adapterDestDir, `${filename}.js`)
      );
      console.log(`Copied ${adapterSource} to ${adapterDestDir}`);
    }

    // Copy corresponding handler file
    if (fs.existsSync(handlerSource)) {
      fs.copyFileSync(
        handlerSource,
        path.join(handlerDestDir, `${filename}.js`)
      );
      console.log(`Copied ${handlerSource} to ${handlerDestDir}`);
    }

    // Copy _.js into the handler folder
    if (fs.existsSync(underscoreJsSource)) {
      fs.copyFileSync(underscoreJsSource, path.join(handlerDestDir, "_.js"));
      console.log(`Copied ${underscoreJsSource} to ${handlerDestDir}`);
    }
  });

  cb();
});

// Task to copy files and folders outside of service/ into each adapter's root directory
gulp.task("copy-non-service-files", (cb) => {
  const filesAndDirs = fs
    .readdirSync(paths.tempSrc)
    .filter((file) => file !== "service"); // Only get non-service files and directories

  const adapterFiles = fs
    .readdirSync("src/service/adapters")
    .filter((file) => file.endsWith(".ts")) // Only TypeScript files
    .map((file) => path.basename(file, ".ts")); // Strip the .ts extension

  adapterFiles.forEach((filename) => {
    const adapterRootDir = path.join(paths.dist, filename); // Root of each adapter

    filesAndDirs.forEach((item) => {
      const sourcePath = path.join(paths.tempSrc, item);
      const destPath = path.join(adapterRootDir, item);

      if (fs.lstatSync(sourcePath).isDirectory()) {
        // Recursively copy directories
        copyDirectoryRecursiveSync(sourcePath, destPath);
        console.log(`Copied directory ${sourcePath} to ${destPath}`);
      } else {
        // Copy files
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Copied file ${sourcePath} to ${destPath}`);
      }
    });
  });

  cb();
});

// Recursive function to copy a directory and its contents
function copyDirectoryRecursiveSync(source, destination) {
  fs.mkdirSync(destination, { recursive: true });

  fs.readdirSync(source).forEach((file) => {
    const sourceFile = path.join(source, file);
    const destinationFile = path.join(destination, file);

    if (fs.lstatSync(sourceFile).isDirectory()) {
      copyDirectoryRecursiveSync(sourceFile, destinationFile);
    } else {
      fs.copyFileSync(sourceFile, destinationFile);
    }
  });
}

// Task to copy and transform package.json to dist, removing unnecessary fields
gulp.task("copy-package-json", () => {
  return gulp
    .src(paths.packageJson)
    .pipe(
      jsonTransform((pkg) => {
        // Remove unnecessary fields for production deployment
        delete pkg.devDependencies;
        delete pkg.scripts;
        return pkg;
      }, 2)
    )
    .pipe(gulp.dest(paths.dist));
});

// Task to install production dependencies inside dist
gulp.task("install-production-deps", async (cb) => {
  try {
    console.log("Installing production dependencies in dist folder...");
    await execAsync("npm install --production", { cwd: paths.dist }); // Install production dependencies inside dist folder
    cb();
  } catch (err) {
    console.error(`Error installing production dependencies: ${err}`);
    cb(err);
  }
});

// Task to copy node_modules to each dist/<x> folder
gulp.task("copy-node-modules", (cb) => {
  const nodeModulesSource = path.join(paths.dist, "node_modules");

  // Ensure node_modules exists before copying
  if (!fs.existsSync(nodeModulesSource)) {
    console.error(
      "node_modules folder does not exist. Ensure 'npm install --production' ran successfully."
    );
    cb(new Error("node_modules not found"));
    return;
  }

  const adapterFiles = fs
    .readdirSync("src/service/adapters")
    .filter((file) => file.endsWith(".ts")) // Only TypeScript files
    .map((file) => path.basename(file, ".ts")); // Strip the .ts extension

  // Copy node_modules into each adapter folder
  adapterFiles.forEach((filename) => {
    const adapterRootDir = path.join(paths.dist, filename, "node_modules");

    // Recursively copy node_modules into each <x> folder
    copyDirectoryRecursiveSync(nodeModulesSource, adapterRootDir);
    console.log(`Copied node_modules to ${adapterRootDir}`);
  });

  cb();
});

// Task to zip the dist folder for Lambda deployment, excluding .d.ts files
gulp.task("zip-each-adapter", (cb) => {
  const adapterFiles = fs
    .readdirSync("src/service/adapters")
    .filter((file) => file.endsWith(".ts")) // Only TypeScript files
    .map((file) => path.basename(file, ".ts")); // Strip the .ts extension

  // Zip each <x> directory
  adapterFiles.forEach((filename) => {
    gulp
      .src(path.join(paths.dist, filename, "**/*"))
      .pipe(zip(`${filename}.zip`))
      .pipe(gulp.dest(paths.dist));
    console.log(`Zipped ${filename} into ${filename}.zip`);
  });

  cb();
});

// Task to delete everything in the dist folder except for *.zip files
gulp.task("clean-except-zip", (cb) => {
  const distPath = paths.dist;

  // Read all files and directories in dist
  fs.readdirSync(distPath).forEach((file) => {
    const filePath = path.join(distPath, file);

    // Check if the file is a zip file, if not, delete it
    if (!file.endsWith(".zip")) {
      if (fs.lstatSync(filePath).isDirectory()) {
        // Recursively delete directories
        fs.rmSync(filePath, { recursive: true, force: true });
        console.log(`Deleted directory: ${filePath}`);
      } else {
        // Delete regular files
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${filePath}`);
      }
    }
  });

  cb();
});

// Main task to clean, build TypeScript, create the dist structure, copy non-service files, install production dependencies, copy node_modules, and zip
gulp.task(
  "build",
  gulp.series(
    "clean",
    "build-ts",
    "create-dist-structure", // Create the new tree for each adapter/handler combo
    "copy-non-service-files", // Copy files and directories outside service/ into each adapter root
    "copy-package-json", // Copy the transformed package.json to dist
    "install-production-deps", // Install production dependencies in dist
    "copy-node-modules", // Copy node_modules into each adapter root
    "zip-each-adapter" // Zip each adapter folder into <x>.zip
  )
);

// Default task to build the project
gulp.task("default", gulp.series("build"));

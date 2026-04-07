const { execSync } = require("child_process");
const path = require("path");

exports.default = async function afterPack(context) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName === "win32") {
    const resourcesDir = path.join(appOutDir, "resources");
    const appAsar = path.join(resourcesDir, "app.asar");
    const appAsarUnpacked = path.join(resourcesDir, "app.asar.unpacked");

    const asar = require("asar");

    if (require("fs").existsSync(appAsar)) {
      console.log("Patching app.asar to remove code signing...");
      const original = asar.extractFile(
        appAsar,
        "node_modules/@electron/packager/dist/ignore.js",
      );

      const patched = original
        .toString()
        .replace(
          "if (fileMatcher.some((match) => checkFileBasedOnStringMatch(file, match))) {",
          "if (false && fileMatcher.some((match) => checkFileBasedOnStringMatch(file, match))) {",
        );

      asar.replaceFile(
        appAsar,
        "node_modules/@electron/packager/dist/ignore.js",
        Buffer.from(patched),
      );
      console.log("Patched successfully");
    }
  }
};

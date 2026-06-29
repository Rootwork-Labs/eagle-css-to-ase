(function attachConvertCore(root) {
  function getSwatchesModule() {
    return root.CssToAseSwatches
      || (typeof module !== "undefined" ? require("./lib/css-to-swatches") : null);
  }

  function getWriterModule() {
    return root.CssToAseWriter
      || (typeof module !== "undefined" ? require("./lib/ase-writer") : null);
  }

  function getDependencies() {
    const swatchesMod = getSwatchesModule();
    const writerMod = getWriterModule();
    if (!swatchesMod || !writerMod) {
      throw new Error("CSS to ASE converter modules failed to load.");
    }

    return {
      fs: require("fs"),
      path: require("path"),
      cssTextToSwatches: swatchesMod.cssTextToSwatches,
      writeAsePalette: writerMod.writeAsePalette.bind(writerMod)
    };
  }

  function defaultOutputPath(cssPath) {
    return String(cssPath || "").replace(/\.css$/i, ".ase");
  }

  function defaultPaletteName(cssPath, paletteName) {
    if (paletteName) return paletteName;
    const { path } = getDependencies();
    return path.basename(String(cssPath || "palette.css"), ".css") || "Palette";
  }

  function previewCssFile(cssPath) {
    const { fs, path, cssTextToSwatches } = getDependencies();
    const resolvedCssPath = path.resolve(cssPath);
    const cssText = fs.readFileSync(resolvedCssPath, "utf8");
    return cssTextToSwatches(cssText, defaultPaletteName(resolvedCssPath)).length;
  }

  function convertCssFile({ cssPath, outPath, paletteName }) {
    if (!cssPath) {
      throw new Error("A CSS file path is required.");
    }

    const { fs, path, cssTextToSwatches, writeAsePalette } = getDependencies();
    const resolvedCssPath = path.resolve(cssPath);
    if (!fs.existsSync(resolvedCssPath)) {
      throw new Error(`CSS file not found: ${resolvedCssPath}`);
    }

    const name = defaultPaletteName(resolvedCssPath, paletteName);
    const cssText = fs.readFileSync(resolvedCssPath, "utf8");
    const swatches = cssTextToSwatches(cssText, name);
    const resolvedOutPath = path.resolve(outPath || defaultOutputPath(resolvedCssPath));

    writeAsePalette(resolvedOutPath, { name, swatches });

    return {
      cssPath: resolvedCssPath,
      outPath: resolvedOutPath,
      paletteName: name,
      swatchCount: swatches.length,
      swatches
    };
  }

  const api = {
    convertCssFile,
    previewCssFile,
    defaultOutputPath,
    defaultPaletteName
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.CssToAseCore = api;
})(typeof globalThis !== "undefined" ? globalThis : window);

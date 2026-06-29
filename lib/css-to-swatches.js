(function attachCssToAseSwatches(root) {
  const cssParser = root.CssToAseCssParser
    || (typeof module !== "undefined" ? require("../parsers/css-palette-parser") : null);
  const colorUtils = root.CssToAseColorUtils
    || (typeof module !== "undefined" ? require("../parsers/color-utils") : null);
  if (!cssParser || !colorUtils) {
    throw new Error("CSS to ASE parser modules must load before css-to-swatches.js");
  }

  const { parseCssPalette } = cssParser;
  const { hexToRgb, titleCaseFamily } = colorUtils;

  function nameFromToken(token) {
    const bare = String(token || "").replace(/^--/, "").replace(/_/g, "-");
    const colorFamilyMatch = bare.match(/^color-([a-z0-9-]+)-(\d+)$/i);
    if (colorFamilyMatch) {
      return `${titleCaseFamily(colorFamilyMatch[1])} ${colorFamilyMatch[2]}`;
    }
    const shadeMatch = bare.match(/^([a-z0-9-]+)-(\d+)$/i);
    if (shadeMatch) {
      return `${titleCaseFamily(shadeMatch[1])} ${shadeMatch[2]}`;
    }
    return titleCaseFamily(bare);
  }

  function swatchNameFromEntry(family, swatch) {
    if (family && family.label && Number.isFinite(swatch.shade)) {
      return `${family.label} ${swatch.shade}`;
    }
    if (swatch.label && !Number.isFinite(swatch.shade)) {
      return swatch.label;
    }
    if (swatch.token) return nameFromToken(swatch.token);
    return swatch.color;
  }

  function flattenCssSwatches(parsed, paletteName) {
    const swatches = [];
    const families = parsed.families || [];

    for (const family of families) {
      for (const swatch of family.swatches || []) {
        swatches.push({
          name: swatchNameFromEntry(family, swatch),
          color: swatch.color
        });
      }
    }

    for (const entry of parsed.ungrouped || []) {
      swatches.push({
        name: entry.token ? nameFromToken(entry.token) : entry.color,
        color: entry.color
      });
    }

    if (swatches.length === 0) {
      throw new Error(`No palette colors found in ${paletteName || "CSS file"}.`);
    }

    return swatches.map((swatch) => {
      const rgb = hexToRgb(swatch.color);
      if (!rgb) {
        throw new Error(`Invalid color value: ${swatch.color}`);
      }
      return {
        name: swatch.name,
        color: swatch.color,
        red: rgb.r / 255,
        green: rgb.g / 255,
        blue: rgb.b / 255,
        alpha: 1
      };
    });
  }

  function cssTextToSwatches(text, paletteName) {
    return flattenCssSwatches(parseCssPalette(text), paletteName);
  }

  const api = {
    flattenCssSwatches,
    cssTextToSwatches,
    swatchNameFromEntry,
    nameFromToken
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.CssToAseSwatches = api;
})(typeof globalThis !== "undefined" ? globalThis : window);

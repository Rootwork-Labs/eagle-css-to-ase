const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { flattenCssSwatches, cssTextToSwatches } = require("../lib/css-to-swatches");
const { parseCssPalette } = require("../parsers/css-palette-parser");

const fixturesDir = path.join(__dirname, "fixtures");
const colorsCss = fs.readFileSync(path.join(fixturesDir, "colors.css"), "utf8");
const coolorsCss = fs.readFileSync(path.join(fixturesDir, "coolors.css"), "utf8");
const themeSnippetCss = fs.readFileSync(path.join(fixturesDir, "theme-snippet.css"), "utf8");

const colorsParsed = parseCssPalette(colorsCss);
const colorsSwatches = flattenCssSwatches(colorsParsed, "Sample");
assert.strictEqual(colorsSwatches.length, 6);
assert.ok(colorsSwatches.every((swatch) => swatch.name && swatch.color));
assert.strictEqual(
  colorsSwatches.find((swatch) => swatch.color === "#ff0000").name,
  "Red 500"
);
assert.strictEqual(
  colorsSwatches.find((swatch) => swatch.color === "#0066ff").name,
  "Blue 500"
);

const themeSnippetSwatches = cssTextToSwatches(themeSnippetCss, "Theme");
assert.strictEqual(themeSnippetSwatches.length, 6);
assert.strictEqual(themeSnippetSwatches[0].name, "Blue 100");
assert.strictEqual(themeSnippetSwatches[3].name, "Red 100");

const coolorsSwatches = cssTextToSwatches(coolorsCss, "Exported");
assert.strictEqual(coolorsSwatches.length, 6);
assert.deepStrictEqual(
  coolorsSwatches.map((swatch) => swatch.color),
  ["#ff0000", "#ff7f00", "#ffd700", "#00aa00", "#0066ff", "#8b00ff"]
);

const { convertCssFile, defaultOutputPath } = require("../convert-core");
const tempDir = require("os").tmpdir();
const cssPath = path.join(tempDir, `css-to-ase-${Date.now()}.css`);
const outPath = path.join(tempDir, `css-to-ase-${Date.now()}.ase`);
fs.writeFileSync(cssPath, colorsCss, "utf8");
assert.strictEqual(defaultOutputPath(cssPath), cssPath.replace(/\.css$/i, ".ase"));
const result = convertCssFile({ cssPath, outPath, paletteName: "Sample" });
assert.strictEqual(result.swatchCount, 6);
assert.ok(fs.existsSync(outPath));
assert.strictEqual(fs.readFileSync(outPath, "utf8").slice(0, 4), "ASEF");
fs.unlinkSync(cssPath);
fs.unlinkSync(outPath);

console.log("Convert core tests passed.");

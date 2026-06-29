const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  BLOCK_COLOR,
  buildAseBuffer,
  writeAsePalette
} = require("../lib/ase-writer");
const { cssTextToSwatches } = require("../lib/css-to-swatches");

const colorsCss = fs.readFileSync(path.join(__dirname, "fixtures", "colors.css"), "utf8");
const swatches = cssTextToSwatches(colorsCss, "Sample");
const buffer = buildAseBuffer({ name: "Sample", swatches });

function readBlocks(source) {
  const blocks = [];
  let offset = 12;
  while (offset < source.length) {
    const type = source.readUInt16BE(offset);
    const length = source.readUInt32BE(offset + 2);
    const body = source.subarray(offset + 6, offset + 6 + length);
    blocks.push({ type, length, body });
    offset += 6 + length;
  }
  return blocks;
}

function readColorBlock(body) {
  const nameLength = body.readUInt16BE(0);
  let offset = 2 + nameLength * 2;
  const space = body.toString("ascii", offset, offset + 4);
  offset += 4;
  const red = body.readFloatBE(offset);
  offset += 4;
  const green = body.readFloatBE(offset);
  offset += 4;
  const blue = body.readFloatBE(offset);
  offset += 4;
  const colorType = body.readUInt16BE(offset);
  return { nameLength, space, red, green, blue, colorType };
}

assert.ok(Buffer.isBuffer(buffer));
assert.strictEqual(buffer.toString("ascii", 0, 4), "ASEF");
assert.strictEqual(buffer.readUInt16BE(4), 1);
assert.strictEqual(buffer.readUInt16BE(6), 0);
assert.strictEqual(buffer.readUInt32BE(8), swatches.length);

const blocks = readBlocks(buffer);
assert.strictEqual(blocks.length, swatches.length);
assert.ok(blocks.every((block) => block.type === BLOCK_COLOR));

const red = swatches.find((swatch) => swatch.color === "#ff0000");
assert.strictEqual(red.name, "Red 500");
const redUtf16 = Buffer.from("Red 500", "utf16le").swap16();
assert.ok(blocks.some((block) => block.body.includes(redUtf16)), "expected Red 500 swatch name");
assert.ok(blocks.every((block) => block.body.includes(Buffer.from("RGB "))));
assert.ok(blocks.every((block) => readColorBlock(block.body).colorType === 0));

const tempDir = fs.mkdtempSync(path.join(require("os").tmpdir(), "css-to-ase-"));
const outPath = path.join(tempDir, "sample.ase");
writeAsePalette(outPath, { name: "Sample", swatches });
assert.ok(fs.existsSync(outPath));
assert.deepStrictEqual(fs.readFileSync(outPath), buffer);

console.log("ASE writer tests passed.");

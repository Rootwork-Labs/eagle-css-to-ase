(function attachAseWriter(root) {
  const BLOCK_COLOR = 0x0001;
  const BLOCK_GROUP_START = 0xc001;
  const BLOCK_GROUP_END = 0xc002;
  const COLOR_TYPE_GLOBAL = 0x0000;

  function utf16beName(name) {
    const text = String(name || "");
    const bytes = Buffer.alloc(2 + text.length * 2 + 2);
    bytes.writeUInt16BE(text.length + 1, 0);
    let offset = 2;
    for (let index = 0; index < text.length; index += 1) {
      bytes.writeUInt16BE(text.charCodeAt(index), offset);
      offset += 2;
    }
    bytes.writeUInt16BE(0, offset);
    return bytes;
  }

  function wrapBlock(type, body) {
    const block = Buffer.alloc(6 + body.length);
    block.writeUInt16BE(type, 0);
    block.writeUInt32BE(body.length, 2);
    body.copy(block, 6);
    return block;
  }

  function buildColorBlock(swatch) {
    const nameBytes = utf16beName(swatch.name);
    const body = Buffer.alloc(nameBytes.length + 4 + 12 + 2);
    let offset = 0;
    nameBytes.copy(body, offset);
    offset += nameBytes.length;
    body.write("RGB ", offset);
    offset += 4;
    body.writeFloatBE(Number(swatch.red), offset);
    offset += 4;
    body.writeFloatBE(Number(swatch.green), offset);
    offset += 4;
    body.writeFloatBE(Number(swatch.blue), offset);
    offset += 4;
    body.writeUInt16BE(COLOR_TYPE_GLOBAL, offset);
    return wrapBlock(BLOCK_COLOR, body);
  }

  function buildGroupStartBlock(name) {
    return wrapBlock(BLOCK_GROUP_START, utf16beName(name));
  }

  function buildGroupEndBlock() {
    return wrapBlock(BLOCK_GROUP_END, Buffer.alloc(0));
  }

  function buildAseBuffer({ name, swatches, grouped = false }) {
    if (!Array.isArray(swatches) || swatches.length === 0) {
      throw new Error("At least one swatch is required.");
    }

    const paletteName = String(name || "Palette").trim() || "Palette";
    const colorBlocks = swatches.map((swatch) => buildColorBlock(swatch));
    const blocks = grouped
      ? [buildGroupStartBlock(paletteName), ...colorBlocks, buildGroupEndBlock()]
      : colorBlocks;
    const body = Buffer.concat(blocks);
    const header = Buffer.alloc(12);
    header.write("ASEF", 0);
    header.writeUInt16BE(1, 4);
    header.writeUInt16BE(0, 6);
    header.writeUInt32BE(blocks.length, 8);
    return Buffer.concat([header, body]);
  }

  function writeAsePalette(outputPath, options) {
    const fs = require("fs");
    const path = require("path");
    const buffer = buildAseBuffer(options);
    const resolvedOutPath = path.resolve(outputPath);
    fs.mkdirSync(path.dirname(resolvedOutPath), { recursive: true });
    fs.writeFileSync(resolvedOutPath, buffer);
    return buffer;
  }

  const api = {
    BLOCK_COLOR,
    BLOCK_GROUP_START,
    BLOCK_GROUP_END,
    buildAseBuffer,
    writeAsePalette
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.CssToAseWriter = api;
})(typeof globalThis !== "undefined" ? globalThis : window);

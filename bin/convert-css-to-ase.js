#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { convertCssFile } = require("../convert-core");

function printHelp() {
  process.stdout.write(`Usage: css-to-ase <file.css> [more.css...] [options]

Options:
  --output, -o <path>   Output .ase path (single input only)
  --name, -n <name>     Palette name inside the output file
  --help, -h            Show this help

Examples:
  css-to-ase theme.css
  css-to-ase colors.css --output ./Sample.ase --name Sample
`);
}

function parseArgs(argv) {
  const files = [];
  let output = null;
  let name = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      return { help: true };
    }
    if (arg === "--output" || arg === "-o") {
      output = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--name" || arg === "-n") {
      name = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--format" || arg === "-f") {
      throw new Error("This tool only writes Adobe Swatch Exchange (.ase) files.");
    }
    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }
    files.push(arg);
  }

  return { files, output, name };
}

function expandInputs(inputs) {
  const expanded = [];
  for (const input of inputs) {
    if (input.includes("*") || input.includes("?")) {
      throw new Error(`Glob patterns are not supported directly: ${input}`);
    }
    expanded.push(path.resolve(input));
  }
  return expanded;
}

function main() {
  try {
    const parsed = parseArgs(process.argv.slice(2));
    if (parsed.help) {
      printHelp();
      return;
    }

    if (!parsed.files || parsed.files.length === 0) {
      printHelp();
      process.exitCode = 1;
      return;
    }

    if (parsed.output && parsed.files.length > 1) {
      throw new Error("Use --output with a single CSS input file.");
    }

    const files = expandInputs(parsed.files);
    for (const cssPath of files) {
      const result = convertCssFile({
        cssPath,
        outPath: parsed.output || undefined,
        paletteName: parsed.name
      });
      process.stdout.write(
        `Wrote ${result.outPath} (${result.swatchCount} swatch${result.swatchCount === 1 ? "" : "es"})\n`
      );
    }
  } catch (error) {
    process.stderr.write(`${error.message || String(error)}\n`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, parseArgs };

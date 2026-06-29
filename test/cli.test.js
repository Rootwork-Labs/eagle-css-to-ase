const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const binPath = path.join(__dirname, "..", "bin", "convert-css-to-ase.js");
const fixturesDir = path.join(__dirname, "fixtures");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "css-to-ase-cli-"));
const cssPath = path.join(tempDir, "colors.css");
const outPath = path.join(tempDir, "Custom.ase");

fs.copyFileSync(path.join(fixturesDir, "colors.css"), cssPath);

const help = spawnSync(process.execPath, [binPath, "--help"], { encoding: "utf8" });
assert.strictEqual(help.status, 0);
assert.ok(help.stdout.includes("css-to-ase"));
assert.ok(!help.stdout.includes("--format"));

const converted = spawnSync(
  process.execPath,
  [binPath, cssPath, "--output", outPath, "--name", "Custom"],
  { encoding: "utf8" }
);
assert.strictEqual(converted.status, 0, converted.stderr);
assert.ok(converted.stdout.includes(outPath));
assert.ok(fs.existsSync(outPath));
assert.strictEqual(fs.readFileSync(outPath, "utf8").slice(0, 4), "ASEF");

const rejectedFormat = spawnSync(
  process.execPath,
  [binPath, cssPath, "--format", "afpalette"],
  { encoding: "utf8" }
);
assert.notStrictEqual(rejectedFormat.status, 0);

console.log("CLI tests passed.");

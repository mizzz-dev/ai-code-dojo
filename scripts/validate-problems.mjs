import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const requiredKeys = [
  "id",
  "title",
  "type",
  "difficulty",
  "language",
  "tags",
  "description",
  "starterFiles",
  "visibleTests",
  "hiddenTests",
  "runner"
];
const allowedLanguages = new Set(["javascript", "typescript", "python", "sql", "html-css"]);

const root = "problems/examples";
const entries = await readdir(root, { withFileTypes: true });
const problemDirs = entries.filter((e) => e.isDirectory()).map((e) => path.join(root, e.name));
const errors = [];

for (const dir of problemDirs) {
  const problemPath = path.join(dir, "problem.json");
  const json = JSON.parse(await readFile(problemPath, "utf8"));

  for (const key of requiredKeys) {
    if (!(key in json)) {
      errors.push(`${problemPath}: missing '${key}'`);
    }
  }

  if (!allowedLanguages.has(json.language)) {
    errors.push(`${problemPath}: unsupported language '${json.language}'`);
  }
  if (!Array.isArray(json.visibleTests) || json.visibleTests.length === 0) {
    errors.push(`${problemPath}: visibleTests must be non-empty array`);
  }
  if (!Array.isArray(json.hiddenTests) || json.hiddenTests.length === 0) {
    errors.push(`${problemPath}: hiddenTests must be non-empty array`);
  }
  if (!Array.isArray(json.starterFiles) || json.starterFiles.length === 0) {
    errors.push(`${problemPath}: starterFiles must be non-empty array`);
  }
}

if (errors.length > 0) {
  console.error("schema validation failed:\n" + errors.join("\n"));
  process.exit(1);
}

console.log("schema validation passed");

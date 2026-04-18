import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = "problems/examples";
const entries = await readdir(root, { withFileTypes: true });
const problemDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => path.join(root, entry.name));

const requiredTopLevel = [
  "metadata",
  "statement",
  "learningPoints",
  "starterCode",
  "visibleTests",
  "hiddenTests",
  "runnerConfig",
  "reviewConfig"
];
const requiredMetadata = [
  "title",
  "slug",
  "difficulty",
  "category",
  "supportedLanguages",
  "framework",
  "tags"
];
const requiredStatement = ["background", "issue", "acceptanceCriteria", "outOfScope"];
const requiredRunner = ["buildCommand", "testCommand", "runCommand", "timeoutSeconds", "networkAccess"];
const requiredReview = ["prTitleRule", "prBodyRule", "commentStyle", "language"];
const allowedLanguages = new Set(["javascript", "typescript", "python", "sql", "html-css"]);
const allowedNetworkAccess = new Set(["disabled", "restricted", "enabled"]);

const errors = [];

for (const dir of problemDirs) {
  const problemPath = path.join(dir, "problem.json");
  const json = JSON.parse(await readFile(problemPath, "utf8"));

  for (const key of requiredTopLevel) {
    if (!(key in json)) {
      errors.push(`${problemPath}: missing '${key}'`);
    }
  }

  for (const key of requiredMetadata) {
    if (!(json.metadata && key in json.metadata)) {
      errors.push(`${problemPath}: missing metadata.${key}`);
    }
  }

  for (const key of requiredStatement) {
    if (!(json.statement && key in json.statement)) {
      errors.push(`${problemPath}: missing statement.${key}`);
    }
  }

  for (const key of requiredRunner) {
    if (!(json.runnerConfig && key in json.runnerConfig)) {
      errors.push(`${problemPath}: missing runnerConfig.${key}`);
    }
  }

  for (const key of requiredReview) {
    if (!(json.reviewConfig && key in json.reviewConfig)) {
      errors.push(`${problemPath}: missing reviewConfig.${key}`);
    }
  }

  const supportedLanguages = json?.metadata?.supportedLanguages ?? [];
  if (!Array.isArray(supportedLanguages) || supportedLanguages.length === 0) {
    errors.push(`${problemPath}: metadata.supportedLanguages must be non-empty array`);
  }
  for (const language of supportedLanguages) {
    if (!allowedLanguages.has(language)) {
      errors.push(`${problemPath}: unsupported language '${language}'`);
    }
  }

  if (!Array.isArray(json.visibleTests) || json.visibleTests.length === 0) {
    errors.push(`${problemPath}: visibleTests must be non-empty array`);
  }
  if (!Array.isArray(json.hiddenTests) || json.hiddenTests.length === 0) {
    errors.push(`${problemPath}: hiddenTests must be non-empty array`);
  }
  if (!Array.isArray(json.starterCode) || json.starterCode.length === 0) {
    errors.push(`${problemPath}: starterCode must be non-empty array`);
  }
  if (!Array.isArray(json.learningPoints) || json.learningPoints.length === 0) {
    errors.push(`${problemPath}: learningPoints must be non-empty array`);
  }

  const networkAccess = json?.runnerConfig?.networkAccess;
  if (!allowedNetworkAccess.has(networkAccess)) {
    errors.push(`${problemPath}: runnerConfig.networkAccess is invalid`);
  }
}

if (errors.length > 0) {
  console.error("schema validation failed:\n" + errors.join("\n"));
  process.exit(1);
}

console.log("schema validation passed");

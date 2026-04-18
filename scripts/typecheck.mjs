import { readFile } from "node:fs/promises";

const targets = [
  "packages/problem-schema/src/index.ts",
  "packages/runner-sdk/src/index.ts",
  "packages/config/src/index.ts"
];

const mustContain = {
  "packages/problem-schema/src/index.ts": ["export interface ProblemDefinition", "SupportedLanguages", "runnerConfig", "reviewConfig"],
  "packages/runner-sdk/src/index.ts": ["export interface RunnerClient", "export interface RunRequest", "export interface RunnerAdapter"],
  "packages/config/src/index.ts": ["export interface AppConfig", "export const loadConfig"]
};

const errors = [];
for (const file of targets) {
  const source = await readFile(file, "utf8");
  for (const token of mustContain[file]) {
    if (!source.includes(token)) {
      errors.push(`${file}: missing token '${token}'`);
    }
  }
}

if (errors.length > 0) {
  console.error("typecheck failed:\n" + errors.join("\n"));
  process.exit(1);
}

console.log("typecheck passed (contract-level)");

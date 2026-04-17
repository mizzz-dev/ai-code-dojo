import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const roots = ["apps", "packages", "scripts", "tests"];
const disallowed = ["eval(", "child_process.exec("];
let errors = [];

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
      continue;
    }
    if (!/\.(ts|mts|mjs|js)$/.test(entry.name)) {
      continue;
    }
    if (fullPath === "scripts/lint.mjs") continue;
    const source = await readFile(fullPath, "utf8");
    for (const pattern of disallowed) {
      if (source.includes(pattern)) {
        errors.push(`${fullPath}: disallowed pattern '${pattern}'`);
      }
    }
  }
};

for (const root of roots) {
  await walk(root);
}

if (errors.length > 0) {
  console.error("lint error:\n" + errors.join("\n"));
  process.exit(1);
}

console.log("lint passed");

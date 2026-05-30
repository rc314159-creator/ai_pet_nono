import { rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distMochiRoot = path.join(root, "dist", "assets", "pets", "mochi");

const runtimeUnusedPaths = [
  "motion-sources",
  "motion-sheets",
  path.join("motions", "sniff-explore-v1-candidates"),
  path.join("motions", "walk-v2-rejected")
];

for (const relativePath of runtimeUnusedPaths) {
  rmSync(path.join(distMochiRoot, relativePath), { recursive: true, force: true });
}

console.log("Pruned source-only pet assets from dist.");

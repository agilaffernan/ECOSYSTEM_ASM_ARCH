import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dotDir = path.join(root, "exports", "dot");
const denseViews = new Set([
  "structurizr-06-deployment-architecture.dot",
  "structurizr-07-network-architecture.dot"
]);
const mediumViews = new Set([
  "structurizr-02-container-microservices.dot",
  "structurizr-08-security-architecture.dot",
  "structurizr-10-observability-architecture.dot"
]);

const deploymentNoise = [
  /^Reads startup configuration$/,
  /^Injects /,
  /^Writes .*logs$/,
  /^Checks \/health/,
  /^Provides approved core secret material/,
  /^Validates authentication/,
  /^Authenticates and checks/,
  /^Authenticates users and administers/,
  /^Retrieves ASM\+ metadata/,
  /^Performs document, workflow/,
  /^Redirects /,
  /^Launches the selected document$/,
  /^Selects GCP\/GCS/
];

const networkNoise = [
  /^Reads startup configuration$/,
  /^Injects /,
  /^Writes .*logs$/,
  /^Checks \/health/,
  /^Provides approved core secret material/,
  /^Pulls OCI images$/,
  /^Obtains short-lived credentials$/,
  /^Authorizes object administration$/,
  /^Selects GCP\/GCS/
];

function relationshipLabel(line) {
  const match = line.match(/label=<<font point-size="18">(.*?)<\/font>/);
  return match ? match[1].replaceAll("<br />", " ") : "";
}

function removeVisualNoise(source, patterns) {
  return source.split(/\r?\n/).filter((line) => {
    if (!line.includes(" -> ")) return true;
    const label = relationshipLabel(line);
    return !patterns.some((pattern) => pattern.test(label));
  }).join("\n");
}

function optimizedGraphAttributes(fileName) {
  const spacing = denseViews.has(fileName)
    ? "ranksep=1.45, nodesep=1.30"
    : mediumViews.has(fileName)
      ? "ranksep=1.20, nodesep=1.15"
      : "ranksep=1.08, nodesep=1.08";

  return `graph [fontname="Arial", rankdir=LR, ${spacing}, newrank=true, remincross=true, mclimit=8.0, splines=spline, outputorder=edgesfirst]`;
}

const dotFiles = fs.readdirSync(dotDir).filter((file) => file.endsWith(".dot"));
for (const fileName of dotFiles) {
  const filePath = path.join(dotDir, fileName);
  const source = fs.readFileSync(filePath, "utf8");
  const graphAttributes = /^\s*graph \[[^\r\n]+\]$/m;

  if (!graphAttributes.test(source)) {
    throw new Error(`Graph attributes were not found in ${fileName}`);
  }

  let optimized = source.replace(graphAttributes, `  ${optimizedGraphAttributes(fileName)}`);
  if (fileName === "structurizr-06-deployment-architecture.dot") {
    optimized = removeVisualNoise(optimized, deploymentNoise);
  }
  if (fileName === "structurizr-07-network-architecture.dot") {
    optimized = removeVisualNoise(optimized, networkNoise);
  }
  if (source !== optimized) fs.writeFileSync(filePath, optimized, "utf8");
}

console.log(`Optimized layout attributes in ${dotFiles.length} DOT views.`);

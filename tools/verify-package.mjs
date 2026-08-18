import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

function filesUnder(directory, extension) {
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...filesUnder(full, extension));
    else if (entry.name.endsWith(extension)) result.push(full);
  }
  return result;
}

const htmlFiles = filesUnder(root, ".html");
for (const htmlFile of htmlFiles) {
  const html = fs.readFileSync(htmlFile, "utf8");
  const references = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  for (const reference of references) {
    if (/^(?:https?:|mailto:|data:|#)/.test(reference)) continue;
    const clean = decodeURIComponent(reference.split("#")[0].split("?")[0]);
    if (!clean) continue;
    const resolved = path.resolve(path.dirname(htmlFile), clean);
    if (!fs.existsSync(resolved)) {
      errors.push(`${path.relative(root, htmlFile)} -> missing ${reference}`);
    }
  }
}

const manualFiles = filesUnder(path.join(root, "manuals"), ".html");
const svgFiles = filesUnder(path.join(root, "diagrams"), ".svg");
const dotFiles = filesUnder(path.join(root, "exports", "dot"), ".dot");
const mermaidFiles = filesUnder(path.join(root, "exports", "mermaid"), ".mmd");
const iconFiles = filesUnder(path.join(root, "assets", "icons"), ".svg");
const vendorIconFiles = filesUnder(path.join(root, "assets", "icons", "vendors"), ".svg");
const allFiles = filesUnder(root, "");
let diagramDownloadCount = 0;

if (manualFiles.length !== 10) errors.push(`Expected 10 manuals; found ${manualFiles.length}`);
if (svgFiles.length !== 21) errors.push(`Expected 21 SVG diagrams; found ${svgFiles.length}`);
if (dotFiles.length !== 21) errors.push(`Expected 21 DOT exports; found ${dotFiles.length}`);
if (mermaidFiles.length !== 21) errors.push(`Expected 21 Mermaid exports; found ${mermaidFiles.length}`);
if (iconFiles.length !== 29) errors.push(`Expected 29 icon assets; found ${iconFiles.length}`);
if (vendorIconFiles.length !== 17) errors.push(`Expected 17 official vendor icon assets; found ${vendorIconFiles.length}`);

const svgContents = [];
let semanticBoxCount = 0;
const iconCategoryBySemanticKey = new Map();
const iconCategoryByDisplayName = new Map();

function registerCanonicalIcon(map, key, category, location) {
  const existing = map.get(key);
  if (existing && existing.category !== category) {
    errors.push(`Inconsistent icon for ${key}: ${existing.category} in ${existing.location}, but ${category} in ${location}`);
  } else if (!existing) {
    map.set(key, { category, location });
  }
}

function visibleBoxName(body) {
  const parts = [];
  let technologyFound = false;
  for (const match of body.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)) {
    const text = match[1]
      .replace(/<[^>]+>/g, "")
      .replace(/&#45;/g, "-")
      .replace(/&amp;/g, "&")
      .trim();
    if (/^\[/.test(text)) {
      technologyFound = true;
      break;
    }
    if (text) parts.push(text);
  }
  const name = technologyFound ? parts.join(" ") : parts[0];
  return name?.toLowerCase().replace(/\s+/g, " ");
}

for (const svg of svgFiles) {
  const content = fs.readFileSync(svg, "utf8");
  svgContents.push(content);
  if (!content.includes('class="architecture-icon"')) {
    errors.push(`${path.relative(root, svg)} has no semantic node icons`);
  }
  const semanticBoxes = [...content.matchAll(/<g id="([^"]+)" class="(node|cluster)">([\s\S]*?)<\/g>/g)];
  semanticBoxCount += semanticBoxes.length;
  for (const box of semanticBoxes) {
    if (!box[3].includes("<!-- architecture-icon:start -->")) {
      errors.push(`${path.relative(root, svg)} has an undecorated ${box[2]} box (${box[1]})`);
      continue;
    }
    const category = box[3].match(/data-icon="([^"]+)"/)?.[1];
    const clusterTitle = box[2] === "cluster" ? box[3].match(/<title>([^<]+)<\/title>/)?.[1] : undefined;
    const elementId = box[2] === "node" ? box[1] : clusterTitle?.match(/^cluster_(\d+)$/)?.[1];
    const semanticKey = elementId ? `element:${elementId}` : `boundary:${clusterTitle ?? box[1]}`;
    const location = `${path.relative(root, svg)} ${box[2]} ${box[1]}`;
    if (category) {
      registerCanonicalIcon(iconCategoryBySemanticKey, semanticKey, category, location);
      const displayName = visibleBoxName(box[3]);
      if (displayName) registerCanonicalIcon(iconCategoryByDisplayName, `name:${displayName}`, category, location);
    }
  }
}

for (const category of ["sap-official", "gcp-cloud-storage", "gcp-cloud-sql", "gcp-gke", "kubernetes-official", "helm-official"]) {
  if (!svgContents.some((content) => content.includes(`data-icon="${category}"`))) {
    errors.push(`No exported SVG uses required official icon category ${category}`);
  }
}
if (!svgContents.some((content) => content.includes('data-icon="api"'))) {
  errors.push("No exported SVG retains the provider-neutral API icon");
}

for (const manual of manualFiles) {
  const html = fs.readFileSync(manual, "utf8");
  const diagramCount = (html.match(/class="diagram-frame"/g) ?? []).length;
  const downloadLinks = [...html.matchAll(/<a class="diagram-download" href="([^"]+)" download="([^"]+)"/g)];
  const downloadCount = downloadLinks.length;
  const legendCategories = new Set([...html.matchAll(/data-icon-category="([^"]+)"/g)].map((match) => match[1]));
  const diagramSources = [...html.matchAll(/src="\.\.\/diagrams\/([^"]+\.svg)"/g)].map((match) => match[1]);
  diagramDownloadCount += downloadCount;
  if (!html.includes("<h1>")) errors.push(`${path.relative(root, manual)} has no H1`);
  if (!html.includes("class=\"diagram-frame\"")) errors.push(`${path.relative(root, manual)} has no diagram`);
  if (downloadCount !== diagramCount) errors.push(`${path.relative(root, manual)} has ${diagramCount} diagrams but ${downloadCount} download controls`);
  if (!html.includes("class=\"icon-legend\"")) errors.push(`${path.relative(root, manual)} has no icon legend`);
  if (!html.includes("../diagram-viewer.html?src=")) errors.push(`${path.relative(root, manual)} does not link diagrams to the full-screen viewer`);
  if (!html.includes("../assets/diagram-downloads.js")) errors.push(`${path.relative(root, manual)} does not load the forced diagram-download handler`);
  if (!html.includes("lang=\"en\"")) errors.push(`${path.relative(root, manual)} is not marked English`);
  for (const [, href, downloadName] of downloadLinks) {
    const sourceName = path.basename(decodeURIComponent(href));
    if (sourceName !== downloadName) {
      errors.push(`${path.relative(root, manual)} downloads ${downloadName} from the mismatched diagram ${sourceName}`);
    }
  }
  for (const diagramSource of diagramSources) {
    const svg = fs.readFileSync(path.join(root, "diagrams", diagramSource), "utf8");
    const usedCategories = new Set([...svg.matchAll(/data-icon="([^"]+)"/g)].map((match) => match[1]));
    for (const category of usedCategories) {
      if (!legendCategories.has(category)) errors.push(`${path.relative(root, manual)} legend omits ${category} used by ${diagramSource}`);
    }
  }
}
if (diagramDownloadCount !== 21) errors.push(`Expected 21 diagram download controls; found ${diagramDownloadCount}`);

const containerOverviewDot = fs.readFileSync(path.join(root, "exports", "dot", "structurizr-02-container-microservices.dot"), "utf8");
for (const [layer, nodeIds, expectedDimensions] of [
  ["frontend", [13, 18, 25], "3.95x2.5"],
  ["backend/API", [31, 37, 62, 46, 54], "6x3.65"],
  ["data storage", [6, 7], "4.35x3.15"]
]) {
  const dimensions = nodeIds.map((id) => {
    const line = containerOverviewDot.split(/\r?\n/).find((candidate) => new RegExp(`^\\s*${id} \\[` ).test(candidate) && !candidate.includes(" -> ")) ?? "";
    const width = line.match(/\bwidth=([0-9.]+)/)?.[1];
    const height = line.match(/\bheight=([0-9.]+)/)?.[1];
    return `${width}x${height}`;
  });
  if (dimensions.some((dimension) => dimension !== expectedDimensions)) {
    errors.push(`Container overview ${layer} layer boxes are not consistently sized: ${dimensions.join(", ")}`);
  }
}

const diagramDownloadsPath = path.join(root, "assets", "diagram-downloads.js");
if (fs.existsSync(diagramDownloadsPath)) {
  const downloadScript = fs.readFileSync(diagramDownloadsPath, "utf8");
  const payloadMatch = downloadScript.match(/const encodedDiagrams = (\{.*\});/);
  if (!payloadMatch) {
    errors.push("Forced diagram-download handler has no embedded SVG payload map");
  } else {
    const payloads = JSON.parse(payloadMatch[1]);
    for (const svgFile of svgFiles) {
      const fileName = path.basename(svgFile);
      const expected = fs.readFileSync(svgFile).toString("base64");
      if (payloads[fileName] !== expected) errors.push(`Forced download payload is missing or stale for ${fileName}`);
    }
  }
  if (!downloadScript.includes("event.preventDefault()") || !downloadScript.includes("URL.createObjectURL")) {
    errors.push("Diagram download handler does not prevent navigation and force a Blob download");
  }
}

for (const required of [
  "index.html",
  "diagram-viewer.html",
  "assets/diagram-viewer.css",
  "assets/diagram-viewer.js",
  "assets/diagram-downloads.js",
  "workspace.dsl",
  "exports/workspace.json",
  "structurizr-site/index.html",
  "structurizr-site/workspace.js",
  "structurizr-site/js/structurizr-static-init.js",
  "structurizr-site/js/crypto-js-4.2.0.js",
  "tools/vendor/crypto-js-4.2.0.js",
  "tools/vendor/crypto-js-LICENSE.txt",
  "tools/serve-secure.mjs",
  "_headers",
  "hosting/nginx-security-headers.conf",
  "hosting/README.md",
  "SECURITY.md",
  "sbom/architecture.cdx.json",
  "sbom/DEPENDENCIES.md",
  "architecture-inventory.md",
  "traceability-matrix.md",
  "assumptions-and-gaps.md"
]) {
  if (!fs.existsSync(path.join(root, required))) errors.push(`Missing required file ${required}`);
}

for (const file of allFiles) {
  const relative = path.relative(root, file).replaceAll("\\", "/");
  if (/lodash-4\.17\.21|backbone-1\.4\.1|joint-3\.6\.5|crypto-js-4\.1\.1/i.test(relative)) {
    errors.push(`Obsolete vulnerable viewer artifact remains: ${relative}`);
  }
}

const structurizrIndex = fs.readFileSync(path.join(root, "structurizr-site", "index.html"), "utf8");
if (/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/i.test(structurizrIndex)) {
  errors.push("Structurizr static viewer contains executable inline JavaScript");
}
if (!structurizrIndex.includes("./js/structurizr-static-init.js")) {
  errors.push("Structurizr static viewer does not load the hardened external initializer");
}
if (!structurizrIndex.includes("./js/crypto-js-4.2.0.js") || structurizrIndex.includes("crypto-js-4.1.1")) {
  errors.push("Structurizr static viewer does not use CryptoJS 4.2.0 exclusively");
}

const headers = fs.readFileSync(path.join(root, "_headers"), "utf8");
for (const header of ["Content-Security-Policy", "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy"]) {
  if (!headers.includes(header)) errors.push(`Hosting headers do not include ${header}`);
}
if (headers.includes("'unsafe-eval'")) errors.push("Hosting CSP permits unsafe-eval");

const sbom = JSON.parse(fs.readFileSync(path.join(root, "sbom", "architecture.cdx.json"), "utf8"));
if (sbom.bomFormat !== "CycloneDX" || sbom.specVersion !== "1.6") errors.push("SBOM is not CycloneDX 1.6");
const sbomText = JSON.stringify(sbom).toLowerCase();
if (sbomText.includes("lodash")) errors.push("SBOM still contains Lodash");
if (!sbomText.includes("2026.06.28")) errors.push("SBOM does not identify Structurizr vNext 2026.06.28");
if (!sbomText.includes("crypto-js@4.2.0") || sbomText.includes("crypto-js@4.1.1")) errors.push("SBOM does not identify the remediated CryptoJS 4.2.0 dependency");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`PASS: ${htmlFiles.length} HTML files checked; 10 manuals; ${diagramDownloadCount} downloadable diagrams and full-screen SVG viewer; ${semanticBoxCount} semantic boxes use consistent icons across ${iconCategoryByDisplayName.size} canonical identities and 21 SVG, DOT, and Mermaid views; 12 generic and 17 official icon assets; Structurizr vNext viewer, hosting headers, and CycloneDX SBOM verified; all local links resolve.`);
}

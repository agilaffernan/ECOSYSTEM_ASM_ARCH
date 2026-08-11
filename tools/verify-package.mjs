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

if (manualFiles.length !== 10) errors.push(`Expected 10 manuals; found ${manualFiles.length}`);
if (svgFiles.length !== 21) errors.push(`Expected 21 SVG diagrams; found ${svgFiles.length}`);
if (dotFiles.length !== 21) errors.push(`Expected 21 DOT exports; found ${dotFiles.length}`);
if (mermaidFiles.length !== 21) errors.push(`Expected 21 Mermaid exports; found ${mermaidFiles.length}`);
if (iconFiles.length !== 29) errors.push(`Expected 29 icon assets; found ${iconFiles.length}`);
if (vendorIconFiles.length !== 17) errors.push(`Expected 17 official vendor icon assets; found ${vendorIconFiles.length}`);

const svgContents = [];
for (const svg of svgFiles) {
  const content = fs.readFileSync(svg, "utf8");
  svgContents.push(content);
  if (!content.includes('class="architecture-icon"')) {
    errors.push(`${path.relative(root, svg)} has no semantic node icons`);
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
  if (!html.includes("<h1>")) errors.push(`${path.relative(root, manual)} has no H1`);
  if (!html.includes("class=\"diagram-frame\"")) errors.push(`${path.relative(root, manual)} has no diagram`);
  if (!html.includes("class=\"icon-legend\"")) errors.push(`${path.relative(root, manual)} has no icon legend`);
  if (!html.includes("../diagram-viewer.html?src=")) errors.push(`${path.relative(root, manual)} does not link diagrams to the full-screen viewer`);
  if (!html.includes("lang=\"en\"")) errors.push(`${path.relative(root, manual)} is not marked English`);
}

for (const required of [
  "index.html",
  "diagram-viewer.html",
  "assets/diagram-viewer.css",
  "assets/diagram-viewer.js",
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
  console.log(`PASS: ${htmlFiles.length} HTML files checked; 10 manuals; full-screen SVG viewer; 21 decorated SVG, DOT, and Mermaid views; 12 generic and 17 official icon assets; Structurizr vNext viewer, hosting headers, and CycloneDX SBOM verified; all local links resolve.`);
}

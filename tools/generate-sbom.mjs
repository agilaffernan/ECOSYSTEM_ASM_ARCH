import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "sbom");
fs.mkdirSync(outputDir, { recursive: true });

function sha256(relativePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relativePath))).digest("hex");
}

function fileComponent(relativePath) {
  return {
    type: "file",
    name: relativePath.replaceAll("\\", "/"),
    "bom-ref": `file:${relativePath.replaceAll("\\", "/")}`,
    hashes: [{ alg: "SHA-256", content: sha256(relativePath) }]
  };
}

function library({ name, version, purl, license, files }) {
  const component = {
    type: "library",
    name,
    version,
    "bom-ref": purl,
    purl,
    scope: "required",
    components: files.map(fileComponent)
  };
  if (license) component.licenses = [{ license: { id: license } }];
  return component;
}

const runtime = [
  library({
    name: "Structurizr static viewer",
    version: "2026.06.28",
    purl: "pkg:generic/structurizr-static-viewer@2026.06.28",
    license: "Apache-2.0",
    files: [
      "structurizr-site/js/structurizr.js",
      "structurizr-site/js/structurizr-diagram.js",
      "structurizr-site/js/structurizr-embed.js",
      "structurizr-site/js/structurizr-navigation.js",
      "structurizr-site/js/structurizr-quick-navigation.js",
      "structurizr-site/js/structurizr-tooltip.js",
      "structurizr-site/js/structurizr-ui.js",
      "structurizr-site/js/structurizr-util.js",
      "structurizr-site/js/structurizr-workspace.js",
      "structurizr-site/css/structurizr.css",
      "structurizr-site/css/structurizr-static.css",
      "structurizr-site/css/structurizr-static-dark.css"
    ]
  }),
  library({ name: "Bootstrap", version: "5.3.7", purl: "pkg:npm/bootstrap@5.3.7", license: "MIT", files: ["structurizr-site/js/bootstrap-5.3.7.min.js", "structurizr-site/css/bootstrap-5.3.7.min.css"] }),
  library({ name: "CryptoJS", version: "4.2.0", purl: "pkg:npm/crypto-js@4.2.0", license: "MIT", files: ["structurizr-site/js/crypto-js-4.2.0.js"] }),
  library({ name: "Dagre", version: "1.1.8", purl: "pkg:npm/%40dagrejs/dagre@1.1.8", license: "MIT", files: ["structurizr-site/js/dagre-1.1.8.js"] }),
  library({ name: "Graphlib", version: "2.2.4", purl: "pkg:npm/%40dagrejs/graphlib@2.2.4", license: "MIT", files: ["structurizr-site/js/graphlib-2.2.4.min.js"] }),
  library({ name: "JointJS Core", version: "4.1.3", purl: "pkg:npm/%40joint/core@4.1.3", license: "MPL-2.0", files: ["structurizr-site/js/jointjs-Core-4.1.3.js"] }),
  library({ name: "JointJS Directed Graph", version: "4.1.3", purl: "pkg:npm/%40joint/layout-directed-graph@4.1.3", license: "MPL-2.0", files: ["structurizr-site/js/jointjs-DirectedGraph-4.1.3.min.js"] }),
  library({ name: "jQuery", version: "3.7.1", purl: "pkg:npm/jquery@3.7.1", license: "MIT", files: ["structurizr-site/js/jquery-3.7.1.min.js"] })
];

const buildTools = [
  {
    type: "application",
    name: "Structurizr vNext",
    version: "2026.06.28",
    "bom-ref": "pkg:generic/structurizr-vnext@2026.06.28?scope=build",
    purl: "pkg:generic/structurizr-vnext@2026.06.28",
    scope: "excluded",
    properties: [{ name: "auritas:usage", value: "Build-time validation and JSON, Mermaid, and static-site export" }]
  },
  {
    type: "application",
    name: "Structurizr CLI legacy DOT exporter",
    version: "2025.11.09",
    "bom-ref": "pkg:generic/structurizr-cli@2025.11.09?scope=build",
    purl: "pkg:generic/structurizr-cli@2025.11.09",
    scope: "excluded",
    properties: [{ name: "auritas:usage", value: "Build-time DOT export only; not shipped or executed by the hosted site" }]
  },
  {
    type: "application",
    name: "Graphviz",
    version: "15.1.0",
    "bom-ref": "pkg:generic/graphviz@15.1.0?scope=build",
    purl: "pkg:generic/graphviz@15.1.0",
    scope: "excluded",
    properties: [{ name: "auritas:usage", value: "Build-time SVG rendering only" }]
  },
  {
    type: "application",
    name: "Eclipse Temurin JRE",
    version: "21.0.12+8",
    "bom-ref": "pkg:generic/eclipse-temurin-jre@21.0.12%2B8?scope=build",
    purl: "pkg:generic/eclipse-temurin-jre@21.0.12%2B8",
    scope: "excluded",
    properties: [{ name: "auritas:usage", value: "Build-time Structurizr runtime only" }]
  }
];

const rootRef = "pkg:generic/auritas/asm-plus-gcp-architecture@2026.08.11";
const bom = {
  bomFormat: "CycloneDX",
  specVersion: "1.6",
  version: 1,
  serialNumber: "urn:uuid:0e692c18-1cea-5a7c-b34b-5d651df292c1",
  metadata: {
    component: {
      type: "application",
      name: "ASM+ GCP Architecture Documentation",
      group: "Auritas",
      version: "2026.08.11",
      "bom-ref": rootRef,
      purl: rootRef,
      properties: [
        { name: "auritas:deployment-project", value: "sap-ecosystem-asmplus" },
        { name: "auritas:artifact-kind", value: "Static architecture documentation" }
      ]
    }
  },
  components: [...runtime, ...buildTools],
  dependencies: [
    { ref: rootRef, dependsOn: runtime.map((component) => component["bom-ref"]) },
    ...runtime.map((component) => ({ ref: component["bom-ref"], dependsOn: component.components.map((file) => file["bom-ref"]) })),
    ...buildTools.map((component) => ({ ref: component["bom-ref"], dependsOn: [] }))
  ]
};

fs.writeFileSync(path.join(outputDir, "architecture.cdx.json"), `${JSON.stringify(bom, null, 2)}\n`, "utf8");

const markdown = `# ASM+ Architecture Dependency Inventory

This inventory accompanies the CycloneDX 1.6 SBOM in \`architecture.cdx.json\`. Runtime components are delivered to the browser by the static documentation site. Build-time tools are not shipped or executed by the hosted site.

## Runtime components

| Component | Version | Package URL |
|---|---:|---|
${runtime.map((component) => `| ${component.name} | ${component.version} | \`${component.purl}\` |`).join("\n")}

## Build-time tools

| Component | Version | Purpose |
|---|---:|---|
${buildTools.map((component) => `| ${component.name} | ${component.version} | ${component.properties[0].value} |`).join("\n")}

## Security note

The previous static viewer bundled Lodash 4.17.21. The Structurizr vNext 2026.06.28 export no longer includes Lodash or Backbone, so the affected Lodash component is absent from the delivered site rather than suppressed or patched in place. The vNext export's CryptoJS 4.1.1 file is reproducibly replaced with the official CryptoJS 4.2.0 release during hardening.
`;

fs.writeFileSync(path.join(outputDir, "DEPENDENCIES.md"), markdown, "utf8");
console.log(`Generated CycloneDX SBOM with ${runtime.length} runtime components and ${buildTools.length} build-time tools.`);

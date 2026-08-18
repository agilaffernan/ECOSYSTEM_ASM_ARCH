import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dotDir = path.join(root, "exports", "dot");
const preservedViews = new Set([
  "structurizr-01-system-context.dot"
]);

const componentViews = new Set([
  "structurizr-03a-component-asm-api.dot",
  "structurizr-03b-component-api-asm-plus.dot",
  "structurizr-03c-component-api-auth.dot",
  "structurizr-03d-component-api-sap.dot",
  "structurizr-03e-component-api-sf.dot",
  "structurizr-03f-component-front-asm-plus.dot",
  "structurizr-03g-component-front-auth.dot",
  "structurizr-03h-component-front-viewer.dot"
]);

const horizontalComponentViews = new Set([
  "structurizr-03a-component-asm-api.dot",
  "structurizr-03f-component-front-asm-plus.dot",
  "structurizr-03g-component-front-auth.dot"
]);

const compactComponentViews = new Set([
  "structurizr-02-container-microservices.dot",
  "structurizr-03a-component-asm-api.dot",
  "structurizr-03e-component-api-sf.dot",
  "structurizr-03f-component-front-asm-plus.dot",
  "structurizr-03g-component-front-auth.dot"
]);

const dynamicViews = new Set([
  "structurizr-09a-runtime-sso.dot",
  "structurizr-09b-runtime-upload.dot",
  "structurizr-09c-runtime-view.dot",
  "structurizr-09d-runtime-sap.dot",
  "structurizr-09e-runtime-successfactors.dot"
]);

const layeredViews = new Set([
  "structurizr-02-container-microservices.dot",
  "structurizr-04-api-integration.dot",
  "structurizr-05-data-architecture.dot",
  "structurizr-06-deployment-architecture.dot",
  "structurizr-07-network-architecture.dot",
  "structurizr-08-security-architecture.dot",
  "structurizr-10-observability-architecture.dot"
]);

const applicationDataNoise = [
  /^Retrieves SAP-origin document components$/,
  /^Reads and writes document objects/,
  /^Reads and writes SAP document objects/,
  /^Reads and writes SAP SuccessFactors/,
  /^Reads and writes identity and access tables/,
  /^Reads and writes document metadata/,
  /^Persists SAP document hierarchy/,
  /^Persists SAP SuccessFactors/,
  /^Stores and retrieves binaries/
];

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
  /^Selects GCP\/GCS/,
  ...applicationDataNoise
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
  /^Selects GCP\/GCS/,
  ...applicationDataNoise.filter((pattern) => pattern.source !== "^Stores and retrieves binaries")
];

const containerNoise = [
  /^Redirects browser-origin SAP launch/,
  /^Redirects the browser to the SSO portal$/,
  /^Redirects the browser to SSO when a session is absent$/
];

const applicationFlowNoise = [
  /^Redirects browser-origin SAP launch/,
  /^Redirects the browser/,
  /^Launches the selected document$/,
  /^Authenticates users and administers/,
  /^Authenticates and checks/,
  /^Validates authentication/,
  /^Performs document, workflow/,
  /^Retrieves ASM\+ metadata/
];

const apiIntegrationNoise = [
  /^Signs in and manages a profile$/,
  /^Views document content$/,
  /^Launches the selected document$/,
  /^Exchanges assertions when configured$/
];

const securityNoise = [
  /^Redirects browser-origin SAP launch/,
  /^Uses the main application$/,
  /^Views document content$/,
  /^Performs document, workflow/,
  /^Launches the selected document$/,
  /^Redirects the browser/,
  /^Retrieves ASM\+ metadata/,
  /^Retrieves SAP-origin document components$/
];

const observabilityNoise = [
  /^Reads and writes document objects/,
  /^Reads and writes SAP document objects/,
  /^Reads and writes SAP SuccessFactors/,
  /^Administers users, roles/,
  /^Authenticates users and administers/,
  /^Authenticates and checks/,
  /^Validates authentication/,
  /^Performs document, workflow/,
  /^Launches the selected document$/,
  /^Redirects /,
  /^Retrieves ASM\+ metadata/,
  /^Retrieves SAP-origin document components$/
];

const representativeLabelIds = {
  "structurizr-02-container-microservices.dot": new Set(),
  "structurizr-03f-component-front-asm-plus.dot": new Set([96, 97, 112, 147, 149, 150, 153, 154, 155]),
  "structurizr-04-api-integration.dot": new Set([82, 87, 88, 89, 90, 93, 96, 97, 98, 100]),
  "structurizr-05-data-architecture.dot": new Set([100, 103, 107]),
  "structurizr-06-deployment-architecture.dot": new Set([306, 307, 308, 315, 319, 323, 324, 325]),
  "structurizr-07-network-architecture.dot": new Set([281, 306, 307, 308, 315, 319]),
  "structurizr-08-security-architecture.dot": new Set([89, 90, 100, 103, 107, 108, 118]),
  "structurizr-10-observability-architecture.dot": new Set([86, 125, 128, 129, 130, 131, 134, 137, 138, 139, 140])
};

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

function retainRepresentativeLabels(source, relationshipIds) {
  if (!relationshipIds) return source;

  return source.split(/\r?\n/).map((line) => {
    if (!line.includes(" -> ")) return line;
    const idMatch = line.match(/\bid=(\d+)/);
    if (!idMatch || relationshipIds.has(Number(idMatch[1]))) return line;
    return line.replace(/label=<<font point-size="18">.*?<\/font><br \/><font point-size="13">.*?<\/font>>,\s*/, "");
  }).join("\n");
}

function compactNodeTypography(source) {
  return source.split(/\r?\n/).map((line) => {
    if (!/^\s*\d+\s+\[/.test(line) || line.includes(" -> ")) return line;
    return line
      .replaceAll('point-size="34"', 'point-size="27"')
      .replaceAll('point-size="24"', 'point-size="18"')
      .replaceAll('point-size="19"', 'point-size="15"');
  }).join("\n");
}

function extraCompactContainerTypography(source, fileName) {
  if (fileName !== "structurizr-02-container-microservices.dot") return source;
  return source.split(/\r?\n/).map((line) => {
    if (!/^\s*\d+\s+\[/.test(line) || line.includes(" -> ")) return line;
    return line
      .replaceAll('point-size="27"', 'point-size="24"')
      .replaceAll('point-size="18"', 'point-size="16"')
      .replaceAll('point-size="15"', 'point-size="13"');
  }).join("\n");
}

function reserveIconHeaderSpace(source, fileName) {
  const headerLinesByView = {
    "structurizr-01-system-context.dot": new Map([[4, 3]]),
    "structurizr-02-container-microservices.dot": new Map([[13, 2], [18, 3], [25, 3]]),
    "structurizr-03a-component-asm-api.dot": new Map([[63, 3], [65, 3], [67, 3], [69, 3]]),
    "structurizr-03b-component-api-asm-plus.dot": new Map([[39, 3], [41, 3], [42, 3], [44, 3]]),
    "structurizr-03c-component-api-auth.dot": new Map([[36, 3]]),
    "structurizr-03d-component-api-sap.dot": new Map([[51, 3], [52, 3]]),
    "structurizr-03e-component-api-sf.dot": new Map([[55, 2], [56, 3], [57, 2], [58, 3], [59, 2]]),
    "structurizr-03f-component-front-asm-plus.dot": new Map([[19, 3], [20, 3], [22, 3], [23, 3], [24, 3], [25, 3], [70, 3]]),
    "structurizr-03g-component-front-auth.dot": new Map([[14, 3], [15, 3], [16, 3], [17, 2], [70, 3]]),
    "structurizr-03h-component-front-viewer.dot": new Map([[26, 3], [29, 3], [70, 3]]),
    "structurizr-04-api-integration.dot": new Map([[4, 3], [18, 3]]),
    "structurizr-06-deployment-architecture.dot": new Map([[216, 3], [223, 3], [293, 3]]),
    "structurizr-07-network-architecture.dot": new Map([[223, 3]]),
    "structurizr-08-security-architecture.dot": new Map([[18, 3]]),
    "structurizr-09a-runtime-sso.dot": new Map([[18, 3]]),
    "structurizr-09b-runtime-upload.dot": new Map([[18, 3]]),
    "structurizr-09c-runtime-view.dot": new Map([[18, 3]]),
    "structurizr-09e-runtime-successfactors.dot": new Map([[4, 3]]),
    "structurizr-10-observability-architecture.dot": new Map([[11, 3], [18, 3]])
  };
  const headerLines = headerLinesByView[fileName];
  if (!headerLines) return source;

  return source.split(/\r?\n/).map((line) => {
    const nodeId = Number(line.match(/^\s*(\d+)\s+\[/)?.[1]);
    if (!headerLines.has(nodeId) || line.includes(" -> ")) return line;
    return line.replace(
      /label=<(?:<br \/>)*/,
      `label=<${"<br />".repeat(headerLines.get(nodeId))}`
    );
  }).join("\n");
}

function recomposeContainerOverview(source, fileName) {
  if (fileName !== "structurizr-02-container-microservices.dot") return source;

  const lines = source.split(/\r?\n/);
  const nodeIds = [6, 7, 13, 18, 25, 31, 37, 46, 54, 62];
  const nodes = new Map(nodeIds.map((id) => {
    const line = lines.find((candidate) => new RegExp(`^\\s*${id} \\[` ).test(candidate) && !candidate.includes(" -> "));
    if (!line) throw new Error(`Container overview node ${id} was not found.`);
    const compactLine = line.trim()
      .replace(/,\s*fixedsize=true,\s*width=[0-9.]+,\s*height=[0-9.]+/g, "")
      .replace(/,\s*labelloc=c/g, "")
      .replace(/,\s*penwidth=5,\s*peripheries=2/g, "")
      .replaceAll("Node.js, TypeScript, Express; port ", "Node.js/Express<br />port ")
      .replaceAll("React, Vite, Node static server", "React/Vite<br />Node static server")
      .replaceAll("React, Vite, NGINX", "React/Vite<br />NGINX")
      .replace(/<font point-size="16"><b>(.*?)<\/b><\/font>/g, '<font point-size="16">$1</font>')
      .replace(/(<font point-size="16">)(?!<b>)(.*?)(<\/font>)/, "$1<b>$2</b>$3");
    const dimensions = [13, 18, 25].includes(id)
      ? { width: 3.95, height: 2.5 }
      : [31, 37, 62, 46, 54].includes(id)
        ? { width: 6.0, height: 3.65 }
        : { width: 4.35, height: 3.15 };
    return [id, compactLine.replace(/\]$/, `, labelloc=c, fixedsize=true, width=${dimensions.width}, height=${dimensions.height}]`)];
  }));
  const relationships = lines
    .filter((line) => /^\s*\d+ -> \d+ \[/.test(line) && /\bid=\d+\b/.test(line))
    .map((line) => line.trim()
      .replace(/(?:,\s*constraint=false)+(?=\])/g, "")
      .replace(/\]$/, ", constraint=false]"));
  const title = lines.find((line) => /^\s*label=<</.test(line))?.trim();
  if (!title) throw new Error("Container overview title was not found.");

  return `digraph {
  compound=true
  graph [fontname="Arial", rankdir=TB, ranksep=0.62, nodesep=0.32, newrank=true, remincross=true, mclimit=8.0, splines=ortho, outputorder=edgesfirst]
  node [fontname="Arial", shape=box, margin="0.24,0.16"]
  edge [fontname="Arial"]
  ${title}

  subgraph cluster_12 {
    margin=22
    label=""
    color="#64748b"
    style="rounded"

    subgraph cluster_layer_frontend {
      margin=20
      label=<<font point-size="21"><b>Frontend Layer</b></font>>
      labelloc=t
      color="#93c5fd"
      fontcolor="#1d4ed8"
      fillcolor="#eff6ff"
      style="rounded,filled"

      ${nodes.get(13)}
      ${nodes.get(18)}
      ${nodes.get(25)}
    }

    subgraph cluster_layer_backend {
      margin=20
      label=<<font point-size="21"><b>Backend and API Layer</b></font>>
      labelloc=t
      color="#99f6e4"
      fontcolor="#0f766e"
      fillcolor="#f0fdfa"
      style="rounded,filled"

      ${nodes.get(31)}
      ${nodes.get(37)}
      ${nodes.get(62)}
      ${nodes.get(46)}
      ${nodes.get(54)}
    }
  }

  subgraph cluster_layer_data {
    margin=20
    label=<<font point-size="21"><b>Data Storage Layer</b></font>>
    labelloc=t
    color="#86efac"
    fontcolor="#166534"
    fillcolor="#f0fdf4"
    style="rounded,filled"

    ${nodes.get(6)}
    ${nodes.get(7)}
  }

  ${relationships.join("\n  ")}

  { rank=same; 13; 18; 25; }
  { rank=same; 31; 37; 62; 46; 54; }
  { rank=same; 6; 7; }
  13 -> 18 -> 25 [style=invis, weight=180]
  31 -> 37 -> 62 -> 46 -> 54 [style=invis, weight=220]
  6 -> 7 [style=invis, weight=180]
  18 -> 62 [style=invis, weight=500, minlen=3]
  62 -> 6 [style=invis, weight=500, minlen=3]
}
`;
}

function emphasizeAsmStorage(source, fileName) {
  let emphasized = source.split(/\r?\n/).map((line) => {
    if (!/^\s*\d+\s+\[/.test(line) || !line.includes("ASM Storage API")) return line;
    return line
      .replace(/(?:,\s*penwidth=5,\s*peripheries=2)+(?=\])/g, "")
      .replace('color="#6d28d9"', 'color="#4c1d95"')
      .replace('fillcolor="#7c3aed"', 'fillcolor="#6d28d9"')
      .replace(/\]$/, ', penwidth=5, peripheries=2]');
  }).join("\n");

  if (fileName === "structurizr-03a-component-asm-api.dot") {
    emphasized = emphasized.replace(
      /(subgraph cluster_62 \{\s*\r?\n\s*margin=25)/,
      '$1\n      penwidth=5\n      style="rounded,bold"'
    );
    const clusterStart = emphasized.indexOf("subgraph cluster_62 {");
    const clusterEnd = emphasized.indexOf("\n    }", clusterStart);
    if (clusterStart >= 0 && clusterEnd > clusterStart) {
      const before = emphasized.slice(0, clusterStart);
      const cluster = emphasized.slice(clusterStart, clusterEnd)
        .replace('color="#444444"', 'color="#6d28d9"')
        .replace('fontcolor="#444444"', 'fontcolor="#6d28d9"');
      emphasized = before + cluster + emphasized.slice(clusterEnd);
    }
  }

  return emphasized;
}

function addAsmStorageLayoutHints(source, fileName) {
  const hints = {
    "structurizr-03b-component-api-asm-plus.dot": `
  asm_storage_balance_03b [label="", shape=box, fixedsize=true, width=5.5, height=0.01, style=invis]
  { rank=same; asm_storage_balance_03b; 62; 6; }
  6 -> 62 [style=invis, weight=100]
  62 -> asm_storage_balance_03b [style=invis, weight=100]
`,
    "structurizr-03d-component-api-sap.dot": `
  { rank=same; 6; 62; 25; }
  6 -> 62 [style=invis, weight=100]
  62 -> 25 [style=invis, weight=100]
`,
    "structurizr-03e-component-api-sf.dot": `
  asm_storage_balance_03e [label="", shape=box, fixedsize=true, width=4.5, height=0.01, style=invis]
  { rank=same; 61; 55; 56; 60; }
  { rank=same; 58; 59; 57; }
  { rank=same; asm_storage_balance_03e; 62; 6; }
  6 -> 62 [style=invis, weight=100]
  62 -> asm_storage_balance_03e [style=invis, weight=100]
`
  };

  const hint = hints[fileName];
  return hint ? source.replace(/\n}\s*$/, `${hint}\n}\n`) : source;
}

function optimizedGraphAttributes(fileName) {
  if (preservedViews.has(fileName)) {
    return 'graph [fontname="Arial", rankdir=LR, ranksep=1.08, nodesep=1.08, newrank=true, remincross=true, mclimit=8.0, splines=spline, outputorder=edgesfirst]';
  }

  if (fileName === "structurizr-02-container-microservices.dot") {
    return 'graph [fontname="Arial", rankdir=TB, ranksep=0.62, nodesep=0.32, newrank=true, remincross=true, mclimit=8.0, splines=ortho, outputorder=edgesfirst]';
  }

  if (dynamicViews.has(fileName)) {
    return 'graph [fontname="Arial", rankdir=LR, ranksep=0.45, nodesep=0.45, newrank=true, remincross=true, mclimit=8.0, splines=ortho, outputorder=edgesfirst]';
  }

  const spacing = horizontalComponentViews.has(fileName)
    ? "ranksep=0.48, nodesep=0.48"
    : componentViews.has(fileName)
      ? "ranksep=0.58, nodesep=0.52"
      : "ranksep=0.62, nodesep=0.56";
  const rankDirection = horizontalComponentViews.has(fileName)
    ? "LR"
    : componentViews.has(fileName) || layeredViews.has(fileName) ? "TB" : "LR";
  return `graph [fontname="Arial", rankdir=${rankDirection}, ${spacing}, newrank=true, remincross=true, mclimit=8.0, splines=ortho, outputorder=edgesfirst]`;
}

const requestedDotFiles = new Set(process.argv.slice(2));
const availableDotFiles = fs.readdirSync(dotDir).filter((file) => file.endsWith(".dot"));
const unknownDotFiles = [...requestedDotFiles].filter((file) => !availableDotFiles.includes(file));
if (unknownDotFiles.length) throw new Error(`Unknown DOT view(s): ${unknownDotFiles.join(", ")}`);
const dotFiles = requestedDotFiles.size
  ? availableDotFiles.filter((file) => requestedDotFiles.has(file))
  : availableDotFiles;
for (const fileName of dotFiles) {
  const filePath = path.join(dotDir, fileName);
  const source = fs.readFileSync(filePath, "utf8");
  const graphAttributes = /^\s*graph \[[^\r\n]+\]$/m;

  if (!graphAttributes.test(source)) {
    throw new Error(`Graph attributes were not found in ${fileName}`);
  }

  let optimized = source.replace(graphAttributes, `  ${optimizedGraphAttributes(fileName)}`);
  if (compactComponentViews.has(fileName)) {
    optimized = optimized.replace('node [fontname="Arial", shape=box, margin="0.4,0.3"]', 'node [fontname="Arial", shape=box, margin="0.24,0.16"]');
    optimized = compactNodeTypography(optimized);
    optimized = extraCompactContainerTypography(optimized, fileName);
  }
  optimized = reserveIconHeaderSpace(optimized, fileName);
  if (fileName === "structurizr-06-deployment-architecture.dot") {
    optimized = removeVisualNoise(optimized, deploymentNoise);
  }
  if (fileName === "structurizr-07-network-architecture.dot") {
    optimized = removeVisualNoise(optimized, [...networkNoise, ...applicationFlowNoise]);
  }
  if (fileName === "structurizr-02-container-microservices.dot") {
    optimized = removeVisualNoise(optimized, containerNoise);
    optimized = recomposeContainerOverview(optimized, fileName);
  }
  if (fileName === "structurizr-04-api-integration.dot") {
    optimized = removeVisualNoise(optimized, [...containerNoise, ...apiIntegrationNoise]);
  }
  if (fileName === "structurizr-08-security-architecture.dot") {
    optimized = removeVisualNoise(optimized, securityNoise);
  }
  if (fileName === "structurizr-10-observability-architecture.dot") {
    optimized = removeVisualNoise(optimized, observabilityNoise);
  }
  optimized = retainRepresentativeLabels(optimized, representativeLabelIds[fileName]);
  optimized = emphasizeAsmStorage(optimized, fileName);
  optimized = addAsmStorageLayoutHints(optimized, fileName);
  if (source !== optimized) fs.writeFileSync(filePath, optimized, "utf8");
}

console.log(`Optimized layout attributes in ${dotFiles.length} DOT views.`);

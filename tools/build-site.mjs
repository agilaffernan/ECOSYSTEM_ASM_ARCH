import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { manuals } from "./site-content.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const manualsDir = path.join(root, "manuals");
const diagramsDir = path.join(root, "diagrams");
const assetsDir = path.join(root, "assets");
fs.mkdirSync(manualsDir, { recursive: true });

const encodedDiagrams = Object.fromEntries(
  fs.readdirSync(diagramsDir)
    .filter((file) => file.endsWith(".svg"))
    .sort()
    .map((file) => [file, fs.readFileSync(path.join(diagramsDir, file)).toString("base64")])
);

const diagramDownloadsScript = `(() => {
  const encodedDiagrams = ${JSON.stringify(encodedDiagrams)};

  function forceSvgDownload(event) {
    const link = event.currentTarget;
    const fileName = link.getAttribute("download");
    const encodedSvg = encodedDiagrams[fileName];
    if (!encodedSvg) return;

    event.preventDefault();
    event.stopPropagation();

    const binary = atob(encodedSvg);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);

    const objectUrl = URL.createObjectURL(new Blob([bytes], { type: "image/svg+xml;charset=utf-8" }));
    const transfer = document.createElement("a");
    transfer.href = objectUrl;
    transfer.download = fileName;
    transfer.hidden = true;
    document.body.append(transfer);
    transfer.click();
    transfer.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".diagram-download, #download-svg-link").forEach((link) => {
      link.addEventListener("click", forceSvgDownload);
    });
  });
})();
`;

fs.writeFileSync(path.join(assetsDir, "diagram-downloads.js"), diagramDownloadsScript, "utf8");

const observedDate = "August 11, 2026";
const manualIcons = {
  "1": "system",
  "2": "api",
  "3": "component",
  "4": "api",
  "5": "database",
  "6": "system",
  "7": "network",
  "8": "security",
  "9": "api",
  "10": "observability"
};

const iconLegendCatalog = [
  ["user", "user", "User or administrator"],
  ["system", "system", "System or deployment boundary"],
  ["api", "api", "API or API client"],
  ["frontend", "frontend", "Frontend"],
  ["component", "component", "Internal component"],
  ["database", "database", "Database or data adapter"],
  ["object-storage", "object-storage", "Object storage"],
  ["security", "security", "Identity or security"],
  ["configuration", "configuration", "Runtime configuration"],
  ["package", "package", "Artifact package"],
  ["network", "network", "Network entry or external service"],
  ["observability", "observability", "Health and telemetry"],
  ["sap-official", "vendors/sap", "SAP System (official)"],
  ["kubernetes-official", "vendors/kubernetes", "Kubernetes (official)"],
  ["helm-official", "vendors/helm", "Helm (official)"],
  ["gcp-cloud-storage", "vendors/gcp-cloud-storage", "Cloud Storage (official)"],
  ["gcp-cloud-sql", "vendors/gcp-cloud-sql", "Cloud SQL (official)"],
  ["gcp-gke", "vendors/gcp-gke", "Google Kubernetes Engine (official)"],
  ["gcp-artifact-registry", "vendors/gcp-artifact-registry", "Artifact Registry (official)"],
  ["gcp-secret-manager", "vendors/gcp-secret-manager", "Secret Manager (official)"],
  ["gcp-load-balancing", "vendors/gcp-cloud-load-balancing", "Cloud Load Balancing (official)"],
  ["gcp-cloud-monitoring", "vendors/gcp-cloud-monitoring", "Cloud Monitoring (official)"],
  ["gcp-workload-identity", "vendors/gcp-workload-identity", "Workload Identity (official)"],
  ["gcp-network", "vendors/gcp-cloud-network", "Google Cloud VPC (official)"],
  ["gcp-certificate", "vendors/gcp-certificate-manager", "Certificate Manager (official)"]
];

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function navigation(current, fromManual) {
  const prefix = fromManual ? "../" : "";
  const homeCurrent = current === "home" ? ' aria-current="page"' : "";
  const links = manuals.map((manual) => {
    const active = current === manual.slug ? ' aria-current="page"' : "";
    return `<li><a href="${prefix}manuals/${manual.slug}.html"${active}>${manual.number}. ${escapeHtml(manual.shortTitle)}</a></li>`;
  }).join("\n");

  return `<aside class="sidebar">
    <a class="brand" href="${prefix}index.html">ASM+ Architecture</a>
    <p class="brand-subtitle">Auritas Storage Manager</p>
    <p class="nav-label">Manuals</p>
    <ul class="nav-list">
      <li><a href="${prefix}index.html"${homeCurrent}>Overview</a></li>
      ${links}
    </ul>
    <p class="nav-label">Model and evidence</p>
    <ul class="nav-list">
      <li><a href="${prefix}structurizr-site/index.html">Interactive Structurizr</a></li>
      <li><a href="${prefix}workspace.dsl">Structurizr DSL</a></li>
      <li><a href="${prefix}architecture-inventory.md">Inventory</a></li>
      <li><a href="${prefix}traceability-matrix.md">Traceability</a></li>
      <li><a href="${prefix}assumptions-and-gaps.md">Assumptions and gaps</a></li>
    </ul>
  </aside>`;
}

function shell({ title, description, current, fromManual, body }) {
  const prefix = fromManual ? "../" : "";
  const downloadsScript = fromManual
    ? `  <script src="${prefix}assets/diagram-downloads.js"></script>\n`
    : "";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)} | ASM+ Architecture</title>
  <link rel="stylesheet" href="${prefix}assets/styles.css">
</head>
<body>
  <a class="skip-link" href="#content">Skip to content</a>
  <div class="layout">
    ${navigation(current, fromManual)}
    <main class="main" id="content">
      <div class="content">${body}</div>
    </main>
  </div>
${downloadsScript}\
  <script src="${prefix}assets/site.js"></script>
</body>
</html>`;
}

function diagrams(manual) {
  return manual.diagrams.map((diagram, index) => {
    const viewerHref = `../diagram-viewer.html?src=${encodeURIComponent(`diagrams/${diagram.file}`)}&title=${encodeURIComponent(diagram.title)}`;
    return `
    <section class="diagram-block" aria-labelledby="diagram-${index + 1}">
      <h3 id="diagram-${index + 1}">${escapeHtml(diagram.title)}</h3>
      <div class="diagram-frame">
        <a class="diagram-download" href="../diagrams/${diagram.file}" download="${diagram.file}" aria-label="Download ${escapeHtml(diagram.title)} as SVG" title="Download SVG">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M4 20h16"/></svg>
        </a>
        <a class="diagram-open-link" href="${viewerHref}" aria-label="Open ${escapeHtml(diagram.title)} in the full-screen diagram viewer"><img src="../diagrams/${diagram.file}" alt="${escapeHtml(diagram.alt)}"></a>
      </div>
      <p class="diagram-caption">${diagram.caption}</p>
      <p class="diagram-links"><a href="${viewerHref}">Open full-screen viewer</a><a href="../structurizr-site/index.html#${diagram.view}">Open this view in Structurizr</a></p>
    </section>`;
  }).join("\n");
}

function iconCategories(files) {
  const categories = new Set();
  for (const file of files) {
    const svg = fs.readFileSync(path.join(diagramsDir, file), "utf8");
    for (const match of svg.matchAll(/data-icon="([^"]+)"/g)) categories.add(match[1]);
  }
  return categories;
}

function iconLegend(manual, prefix = "../") {
  const files = manual ? manual.diagrams.map((diagram) => diagram.file) : Object.keys(encodedDiagrams);
  const usedCategories = iconCategories(files);
  const entries = iconLegendCatalog.filter(([category]) => usedCategories.has(category));
  const mappedCategories = new Set(entries.map(([category]) => category));
  const missingCategories = [...usedCategories].filter((category) => !mappedCategories.has(category));
  if (missingCategories.length) throw new Error(`Missing legend definitions for: ${missingCategories.join(", ")}`);

  return `<div class="icon-legend" aria-label="Icon key for the diagrams on this page">${entries.map(([category, icon, label]) => `<span class="icon-legend-item" data-icon-category="${category}"><img src="${prefix}assets/icons/${icon}.svg" alt="">${label}</span>`).join("")}</div>`;
}

function wrapTables(html) {
  return html.replaceAll("<table>", '<div class="table-scroll"><table>').replaceAll("</table>", "</table></div>");
}

function buildManual(manual) {
  const sections = manual.sections.map((section) => `<section><h2>${escapeHtml(section.title)}</h2>${wrapTables(section.html)}</section>`).join("\n");
  const body = `
    <div class="title-row"><img class="title-icon" src="../assets/icons/${manualIcons[manual.number]}.svg" alt=""><div><p class="eyebrow">Architecture manual ${manual.number}</p><h1>${escapeHtml(manual.title)}</h1></div></div>
    <p class="lead">${manual.summary}</p>
    <div class="meta-row"><span><strong>Project:</strong> sap-ecosystem-asmplus</span><span><strong>Environment:</strong> Live GCP</span><span><strong>Observed:</strong> ${observedDate}</span></div>
    <div class="status-key" aria-label="Evidence status key">
      <span class="status observed">Observed live</span>
      <span class="status optional">Optional capability</span>
      <span class="status recommendation">Recommendation</span>
      <span class="status gap">Observed gap</span>
    </div>
    ${iconLegend(manual)}
    <section><h2>Architecture View</h2>${diagrams(manual)}</section>
    ${sections}
    <footer class="page-footer">ASM+ architecture baseline. Generated from the validated Structurizr model and read-only deployment evidence. No secret values are included.</footer>`;

  const html = shell({
    title: `${manual.number}. ${manual.title}`,
    description: manual.summary,
    current: manual.slug,
    fromManual: true,
    body
  });
  fs.writeFileSync(path.join(manualsDir, `${manual.slug}.html`), html, "utf8");
}

for (const manual of manuals) buildManual(manual);

const cards = manuals.map((manual) => `<article class="manual-card"><div class="manual-card-heading"><img src="assets/icons/${manualIcons[manual.number]}.svg" alt=""><h2>${manual.number}. ${escapeHtml(manual.shortTitle)}</h2></div><p>${manual.summary}</p><a href="manuals/${manual.slug}.html">Open manual</a></article>`).join("\n");

const architectureTree = `<nav class="architecture-tree" aria-label="Architecture repository structure">
  <div class="tree-root"><img src="assets/icons/system.svg" alt=""><strong>auritas.com</strong></div>
  <ul>
    <li><span><img src="assets/icons/system.svg" alt=""><strong>ASM+</strong></span>
      <ul>
        ${manuals.map((manual) => `<li><a href="manuals/${manual.slug}.html"><img src="assets/icons/${manualIcons[manual.number]}.svg" alt="">${escapeHtml(manual.shortTitle)}</a></li>`).join("\n")}
        <li><a href="assumptions-and-gaps.md"><img src="assets/icons/configuration.svg" alt="">Architecture Decisions and Gaps</a></li>
      </ul>
    </li>
  </ul>
</nav>`;

const indexBody = `
  <p class="eyebrow">Architecture package</p>
  <h1>ASM+ on Google Cloud</h1>
  <p class="lead">A navigable, evidence-grounded architecture baseline for the live ASM+ deployment in Google Cloud. The package combines ten focused manuals, twenty-one visual diagrams, and the complete Structurizr model.</p>
  <div class="meta-row"><span><strong>Project:</strong> sap-ecosystem-asmplus</span><span><strong>Region / zone:</strong> us-east1 / us-east1-b</span><span><strong>Cluster / namespace:</strong> asmplus-demo-gke / asm-plus-demo</span><span><strong>Observed:</strong> ${observedDate}</span></div>
  <div class="notice"><strong>Scope.</strong> This is a point-in-time description of the running GCP environment and relevant application source. It is documentation only. Secret values, user data, and AWS resources are outside the package.</div>
  <section>
    <h2>Architecture Repository</h2>
    <p>This tree shows where the ASM+ architecture package fits in a company-wide architecture portal. It is the navigation structure; Structurizr remains the architecture model.</p>
    ${architectureTree}
  </section>
  <section>
    <h2>Architecture Manuals</h2>
    <div class="manual-grid">${cards}</div>
  </section>
  <section>
    <h2>How to Use This Package</h2>
    <ol>
      <li>Start with System Context, then Container / Microservices.</li>
      <li>Use the focused manuals for component, data, network, security, runtime, and operations detail.</li>
      <li>Open the interactive Structurizr viewer to navigate between linked C4 views.</li>
      <li>Consult the traceability and assumptions files before treating an observation as a design guarantee.</li>
    </ol>
    <p><a href="structurizr-site/index.html"><strong>Open the interactive Structurizr viewer</strong></a></p>
  </section>
  <section>
    <h2>Evidence Status</h2>
    <div class="status-key"><span class="status observed">Observed live</span><span class="status optional">Optional capability</span><span class="status recommendation">Recommendation</span><span class="status gap">Observed gap</span></div>
    ${iconLegend(null, "")}
    <p>Statements in the manuals are deliberately qualified. For example, SAML and OnlyOffice are supported capabilities but were not verified as active, while the lack of custom alert policies was directly observed.</p>
  </section>
  <footer class="page-footer">ASM+ architecture baseline. Generated from read-only GCP, Kubernetes, Helm, database-catalog, and source evidence.</footer>`;

fs.writeFileSync(path.join(root, "index.html"), shell({
  title: "Overview",
  description: "ASM+ on Google Cloud architecture documentation",
  current: "home",
  fromManual: false,
  body: indexBody
}), "utf8");

const viewerHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Full-screen ASM+ architecture diagram viewer">
  <title>Architecture Diagram | ASM+ Architecture</title>
  <link rel="stylesheet" href="assets/diagram-viewer.css">
</head>
<body>
  <header class="viewer-toolbar">
    <button class="icon-button" id="back-button" type="button" aria-label="Return to the manual" title="Back">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/><path d="M9 12h10"/></svg>
    </button>
    <h1 id="viewer-title">Architecture diagram</h1>
    <div class="viewer-controls" aria-label="Diagram controls">
      <button class="icon-button" id="zoom-out-button" type="button" aria-label="Zoom out" title="Zoom out">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M8 11h6M20 20l-4-4"/></svg>
      </button>
      <output id="zoom-value" aria-live="polite">Fit</output>
      <button class="icon-button" id="zoom-in-button" type="button" aria-label="Zoom in" title="Zoom in">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M11 8v6M8 11h6M20 20l-4-4"/></svg>
      </button>
      <button class="icon-button" id="fit-button" type="button" aria-label="Fit diagram to screen" title="Fit to screen">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/><path d="m3 8 5-5M21 8l-5-5M3 16l5 5M21 16l-5 5"/></svg>
      </button>
      <button class="icon-button" id="fullscreen-button" type="button" aria-label="Toggle browser full screen" title="Browser full screen">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></svg>
      </button>
      <a class="icon-button" id="raw-svg-link" href="diagrams/structurizr-01-system-context.svg" target="_blank" rel="noopener" aria-label="Open raw SVG in a new tab" title="Open raw SVG">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h7v7M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></svg>
      </a>
      <a class="icon-button" id="download-svg-link" href="diagrams/structurizr-01-system-context.svg" download="structurizr-01-system-context.svg" aria-label="Download diagram as SVG" title="Download SVG">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M4 20h16"/></svg>
      </a>
    </div>
  </header>
  <main class="viewer-stage" id="viewer-stage" aria-label="Architecture diagram canvas">
    <img id="diagram-image" alt="" draggable="false">
    <p class="viewer-error" id="viewer-error" hidden>Unable to open this diagram.</p>
  </main>
  <script src="assets/diagram-downloads.js"></script>
  <script src="assets/diagram-viewer.js"></script>
</body>
</html>`;

fs.writeFileSync(path.join(root, "diagram-viewer.html"), viewerHtml, "utf8");

console.log(`Generated ${manuals.length} manuals, index.html, and diagram-viewer.html in ${root}`);

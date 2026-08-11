import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = JSON.parse(fs.readFileSync(path.join(root, "exports", "workspace.json"), "utf8"));
const elements = new Map();
const vendorIconFiles = {
  "sap-official": "sap.svg",
  "kubernetes-official": "kubernetes.svg",
  "helm-official": "helm.svg",
  "gcp-cloud-storage": "gcp-cloud-storage.svg",
  "gcp-cloud-sql": "gcp-cloud-sql.svg",
  "gcp-gke": "gcp-gke.svg",
  "gcp-artifact-registry": "gcp-artifact-registry.svg",
  "gcp-secret-manager": "gcp-secret-manager.svg",
  "gcp-load-balancing": "gcp-cloud-load-balancing.svg",
  "gcp-cloud-monitoring": "gcp-cloud-monitoring.svg",
  "gcp-workload-identity": "gcp-workload-identity.svg",
  "gcp-network": "gcp-cloud-network.svg",
  "gcp-certificate": "gcp-certificate-manager.svg"
};
const vendorIconData = Object.fromEntries(Object.entries(vendorIconFiles).map(([category, file]) => {
  const bytes = fs.readFileSync(path.join(root, "assets", "icons", "vendors", file));
  return [category, `data:image/svg+xml;base64,${bytes.toString("base64")}`];
}));

function collect(value) {
  if (Array.isArray(value)) {
    value.forEach(collect);
    return;
  }
  if (!value || typeof value !== "object") return;

  if (value.id && (value.name || value.tags)) {
    elements.set(String(value.id), {
      id: String(value.id),
      name: value.name ?? "",
      technology: value.technology ?? "",
      tags: value.tags ?? "",
      containerId: value.containerId ? String(value.containerId) : undefined,
      softwareSystemId: value.softwareSystemId ? String(value.softwareSystemId) : undefined
    });
  }

  for (const [key, child] of Object.entries(value)) {
    if (key !== "relationships" && key !== "views") collect(child);
  }
}

collect(workspace.model);

for (const element of elements.values()) {
  const referenced = element.containerId ?? element.softwareSystemId;
  if (referenced && elements.has(referenced)) {
    const parent = elements.get(referenced);
    element.name ||= parent.name;
    element.technology ||= parent.technology;
    element.tags = `${element.tags},${parent.tags}`;
  }
}

function has(tags, value) {
  return tags.split(",").map((tag) => tag.trim()).includes(value);
}

function iconCategory(element) {
  const { tags, name, technology } = element;
  const searchable = `${name} ${technology}`.toLowerCase();

  // Branded icons are reserved for elements that explicitly represent that
  // vendor or managed product. Auritas APIs and provider-neutral abstractions
  // continue to use the generic semantic icon set below.
  if (name.trim().toLowerCase() === "sap system" || has(tags, "SAP Official")) return "sap-official";
  if (has(tags, "GCP Cloud Storage") || /\b(cloud storage|gcs repository)\b/.test(searchable)) return "gcp-cloud-storage";
  if (has(tags, "GCP Cloud SQL") || /\bcloud sql\b/.test(searchable)) return "gcp-cloud-sql";
  if (has(tags, "GCP Artifact Registry") || /\bartifact registry\b/.test(searchable)) return "gcp-artifact-registry";
  if (has(tags, "GCP Secret Manager") || /\bsecret manager\b/.test(searchable)) return "gcp-secret-manager";
  if (has(tags, "GCP Load Balancing") || /\b(global external application load balancer|gce ingress)\b/.test(searchable)) return "gcp-load-balancing";
  if (has(tags, "GCP Certificate") || /\bgke managedcertificate\b/.test(searchable)) return "gcp-certificate";
  if (has(tags, "GCP Workload Identity") || /\b(workload identity|gke metadata server)\b/.test(searchable)) return "gcp-workload-identity";
  if (has(tags, "GCP Cloud Monitoring") || /\b(cloud operations|cloud logging and monitoring)\b/.test(searchable)) return "gcp-cloud-monitoring";
  if (has(tags, "GCP Network") || /\bgoogle cloud vpc\b/.test(searchable)) return "gcp-network";
  if (has(tags, "GCP GKE") || /^gke:|\bgke health management\b|\bgke node runtime\b/.test(searchable)) return "gcp-gke";
  if (has(tags, "Helm Official") || /\bhelm release\b/.test(searchable)) return "helm-official";
  if (has(tags, "Kubernetes") || /\b(kubernetes pod|kubernetes configmaps|kubernetes opaque secret|kubelet)\b/.test(searchable)) return "kubernetes-official";

  if (["API", "Integration API", "Internal API", "API Surface", "API Client"].some((tag) => has(tags, tag))) return "api";
  if (["Frontend", "Frontend Component"].some((tag) => has(tags, tag))) return "frontend";
  if (["Data Store", "Data Adapter"].some((tag) => has(tags, tag))) return "database";
  if (["Object Store", "Storage Adapter"].some((tag) => has(tags, tag))) return "object-storage";
  if (["Secret Store", "Certificate", "Security Component", "Managed Security"].some((tag) => has(tags, tag))) return "security";
  if (has(tags, "Configuration")) return "configuration";
  if (["Artifact Store", "Managed Delivery"].some((tag) => has(tags, tag))) return "package";
  if (["Observability", "Platform Service", "Managed Operations", "Health Component"].some((tag) => has(tags, tag))) return "observability";
  if (["Load Balancer", "Network", "External Network"].some((tag) => has(tags, tag))) return "network";
  if (["External System", "Optional System", "External Service"].some((tag) => has(tags, tag))) return "network";
  if (["User", "Administrator", "Person"].some((tag) => has(tags, tag))) return "user";
  if (has(tags, "Core System")) return "system";
  if (["Deployment Node", "Cloud Boundary", "Kubernetes Cluster", "Namespace", "Compute"].some((tag) => has(tags, tag))) return "system";

  if (/\b(api|http|route|openapi|client)\b/.test(searchable)) return "api";
  if (/\b(postgres|database|persistence|query|reporting)\b/.test(searchable)) return "database";
  if (/\b(gcs|storage|object|manifest|document|certificate store)\b/.test(searchable)) return "object-storage";
  if (/\b(auth|jwt|token|identity|access|sso|license|certificate|key guard)\b/.test(searchable)) return "security";
  if (/\b(runtime config|configuration|configmap)\b/.test(searchable)) return "configuration";
  if (/\b(log|monitor|health|probe|metric|telemetry)\b/.test(searchable)) return "observability";
  if (/\b(ingress|load balancer|network|dns|vpc|subnet)\b/.test(searchable)) return "network";
  if (/\b(front|portal|viewer|browser|ui|shell|react)\b/.test(searchable)) return "frontend";
  if (/\b(artifact|image|registry|package)\b/.test(searchable)) return "package";
  return "component";
}

const paths = {
  system: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/>',
  api: '<path d="m8 5-5 7 5 7"/><path d="m16 5 5 7-5 7"/><path d="m14 4-4 16"/>',
  frontend: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 8h18"/><path d="M7 6h.01M10 6h.01"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  "object-storage": '<path d="M4 8h16l-1 12H5L4 8Z"/><path d="M7 8V5h10v3"/><path d="M9 12h6"/>',
  security: '<path d="M12 3 5 6v5c0 4.6 2.8 8.2 7 10 4.2-1.8 7-5.4 7-10V6l-7-3Z"/><rect x="9" y="10" width="6" height="5" rx="1"/><path d="M10.5 10V8.8a1.5 1.5 0 0 1 3 0V10"/>',
  network: '<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="m10.8 7.2-4.6 8.6M13.2 7.2l4.6 8.6M7.5 18h9"/>',
  observability: '<path d="M3 12h4l2.2-6 4.2 12 2.2-6H21"/><path d="M4 4h16v16H4z" opacity=".35"/>',
  configuration: '<path d="M4 6h7M15 6h5M4 12h3M11 12h9M4 18h9M17 18h3"/><circle cx="13" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="15" cy="18" r="2"/>',
  package: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12.1V21"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4.2 3.5-6 8-6s7.2 1.8 8 6"/>',
  component: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8M8 13h3M14 13h2"/>'
};

const labels = {
  system: "System",
  api: "API",
  frontend: "Frontend",
  database: "Database",
  "object-storage": "Object storage",
  security: "Security",
  network: "Network",
  observability: "Observability",
  configuration: "Configuration",
  package: "Artifact package",
  user: "User",
  component: "Component",
  "sap-official": "SAP System",
  "kubernetes-official": "Kubernetes",
  "helm-official": "Helm",
  "gcp-cloud-storage": "Google Cloud Storage",
  "gcp-cloud-sql": "Google Cloud SQL",
  "gcp-gke": "Google Kubernetes Engine",
  "gcp-artifact-registry": "Google Artifact Registry",
  "gcp-secret-manager": "Google Secret Manager",
  "gcp-load-balancing": "Google Cloud Load Balancing",
  "gcp-cloud-monitoring": "Google Cloud Monitoring",
  "gcp-workload-identity": "Google Cloud Workload Identity",
  "gcp-network": "Google Cloud VPC",
  "gcp-certificate": "Google-managed certificate"
};

function numbers(value) {
  return [...value.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
}

function nodeBounds(body) {
  const polygon = body.match(/<polygon\b[^>]*points="([^"]+)"/);
  if (polygon) {
    const values = numbers(polygon[1]);
    const xs = values.filter((_, index) => index % 2 === 0);
    const ys = values.filter((_, index) => index % 2 === 1);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys), hexagon: xs.length === 6 };
  }

  const ellipse = body.match(/<ellipse\b[^>]*cx="([^"]+)"[^>]*cy="([^"]+)"[^>]*rx="([^"]+)"[^>]*ry="([^"]+)"/);
  if (ellipse) {
    const [, cx, cy, rx, ry] = ellipse.map(Number);
    return { minX: cx - rx, maxX: cx + rx, minY: cy - ry, maxY: cy + ry, hexagon: false };
  }

  const rect = body.match(/<rect\b[^>]*x="([^"]+)"[^>]*y="([^"]+)"[^>]*width="([^"]+)"[^>]*height="([^"]+)"/);
  if (rect) {
    const [, x, y, width, height] = rect.map(Number);
    return { minX: x, maxX: x + width, minY: y, maxY: y + height, hexagon: false };
  }

  const path = body.match(/<path\b[^>]*fill="(?!none)[^"]+"[^>]*d="([^"]+)"/);
  if (path) {
    const values = numbers(path[1]);
    const xs = values.filter((_, index) => index % 2 === 0);
    const ys = values.filter((_, index) => index % 2 === 1);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys), hexagon: false };
  }
}

function foreground(body) {
  const match = body.match(/<(?:polygon|ellipse|rect|path)\b[^>]*fill="(#[0-9a-fA-F]{6})"/);
  if (!match) return "#172033";
  const hex = match[1].slice(1);
  const rgb = [0, 2, 4].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
  const linear = rgb.map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  return luminance < 0.42 ? "#ffffff" : "#172033";
}

function iconMarkup(category, x, y, size, color) {
  const scale = size / 30;
  if (vendorIconData[category]) {
    const isSap = category === "sap-official";
    const brandStroke = category === "sap-official" ? "#0070B1" : category === "kubernetes-official" ? "#326CE5" : category === "helm-official" ? "#0F1689" : "#4285F4";
    const imageBox = isSap ? 'x="2" y="7" width="26" height="16"' : 'x="4" y="4" width="22" height="22"';
    return `<!-- architecture-icon:start --><g class="architecture-icon architecture-icon-official" data-icon="${category}" data-icon-source="official" role="img" aria-label="${labels[category]}" transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(4)})"><title>${labels[category]}</title><rect x="0.75" y="0.75" width="28.5" height="28.5" rx="6" fill="#ffffff" fill-opacity="0.98" stroke="${brandStroke}" stroke-opacity="0.58" stroke-width="1.5"/><image ${imageBox} preserveAspectRatio="xMidYMid meet" href="${vendorIconData[category]}"/></g><!-- architecture-icon:end -->`;
  }
  const darkNode = color === "#ffffff";
  const badgeFill = darkNode ? "#ffffff" : "#f7f9fc";
  const badgeOpacity = darkNode ? "0.16" : "0.96";
  const badgeStrokeOpacity = darkNode ? "0.62" : "0.42";
  return `<!-- architecture-icon:start --><g class="architecture-icon" data-icon="${category}" role="img" aria-label="${labels[category]}" transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(4)})" fill="none" stroke="${color}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><title>${labels[category]}</title><rect x="0.75" y="0.75" width="28.5" height="28.5" rx="6" fill="${badgeFill}" fill-opacity="${badgeOpacity}" stroke="${color}" stroke-opacity="${badgeStrokeOpacity}" stroke-width="1.5"/><g transform="translate(3 3)">${paths[category]}</g></g><!-- architecture-icon:end -->`;
}

let total = 0;
for (const file of fs.readdirSync(path.join(root, "diagrams")).filter((name) => name.endsWith(".svg"))) {
  const full = path.join(root, "diagrams", file);
  let svg = fs.readFileSync(full, "utf8");
  svg = svg
    .replace(/<!-- architecture-icon:start -->[\s\S]*?<!-- architecture-icon:end -->\s*/g, "")
    .replace(/<g class="architecture-icon"[\s\S]*?<\/g>\s*/g, "");

  let count = 0;
  svg = svg.replace(/<g id="(\d+)" class="node">([\s\S]*?)<\/g>/g, (group, id, body) => {
    const element = elements.get(id);
    if (!element) return group;
    const bounds = nodeBounds(body);
    if (!bounds) return group;

    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const size = Math.max(50, Math.min(68, Math.min(width, height) * 0.24));
    const x = bounds.hexagon ? bounds.minX + width * 0.22 : bounds.minX + 4;
    const y = bounds.minY + 8;
    const category = iconCategory(element);
    const icon = iconMarkup(category, x, y, size, foreground(body));
    count += 1;
    return `<g id="${id}" class="node">${body}\n${icon}</g>`;
  });

  if (!svg.includes("Discrete architecture iconography generated")) {
    svg = svg.replace("<!-- Pages: 1 -->", `<!-- Pages: 1 -->\n<!-- Discrete architecture iconography generated from Structurizr element semantics. -->`);
  }
  fs.writeFileSync(full, svg, "utf8");
  total += count;
  console.log(`${file}: ${count} icons`);
}

console.log(`Decorated 21 diagrams with ${total} semantic icons.`);

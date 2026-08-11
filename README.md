# ASM+ on Google Cloud Architecture

This package documents the live ASM+ deployment in Google Cloud as observed on August 11, 2026. It contains a validated Structurizr model, 21 visual views, ten focused architecture manuals, and a navigable offline HTML site.

## Start Here

Open `index.html` in a browser. It links to every manual, a full-screen pan-and-zoom SVG viewer, and the native Structurizr interactive viewer.

## Package Contents

| Path | Purpose |
|---|---|
| `index.html` | Main offline navigation page |
| `manuals/` | Ten English architecture manuals |
| `workspace.dsl` | Authoritative Structurizr DSL source |
| `structurizr-site/` | Official Structurizr interactive static export |
| `diagrams/` | 21 SVG diagrams rendered from Structurizr DOT exports |
| `exports/workspace.json` | Structurizr JSON representation |
| `exports/dot/` | DOT source for the static SVG diagrams |
| `exports/mermaid/` | Mermaid source exported from the same workspace |
| `architecture-inventory.md` | Point-in-time live resource and workload inventory |
| `traceability-matrix.md` | Mapping from each architecture view to supporting evidence |
| `assumptions-and-gaps.md` | Scope, qualifications, differences, and known gaps |
| `sbom/architecture.cdx.json` | CycloneDX 1.6 software bill of materials |
| `_headers` and `hosting/` | Reusable browser security-header policies |
| `SECURITY.md` | Security posture and dependency-remediation notes |
| `tools/` | Site content, diagram layout optimization, and reproducible HTML generator |

## Architecture Manuals

1. System Context
2. Container / Microservices
3. Component Architecture
4. API / Integration Architecture
5. Data Architecture
6. Deployment Architecture
7. Network Architecture
8. Security Architecture
9. Runtime / Sequence Architecture
10. Observability Architecture

## Architecture Repository Placement

The HTML overview presents this package as the ASM+ branch of a larger architecture portal:

```text
auritas.com
|
`-- ASM+
    |-- System Context
    |-- Container / Microservices
    |-- Component Architecture
    |-- API / Integration Architecture
    |-- Data Architecture
    |-- Deployment Architecture
    |-- Network Architecture
    |-- Security Architecture
    |-- Runtime / Sequence Architecture
    |-- Observability Architecture
    `-- Architecture Decisions and Gaps
```

This tree is the documentation navigation structure. The Structurizr workspace remains the authoritative architecture model.

## Diagram Iconography

The diagrams use two intentionally separate icon sets:

- Official product or project artwork identifies an explicitly modeled SAP System, Google Cloud managed service, GKE, Kubernetes, or Helm element.
- Local generic vector icons identify Auritas APIs, frontends, internal components, provider-neutral storage, security, networking, configuration, artifacts, users, and observability.

This distinction prevents a generic ASM+ component from being presented as a vendor-owned product. All assets are stored under `assets/icons/`, so the generated package has no runtime web dependency. Shape, color, label, and text remain present so the diagrams do not depend on icons alone for meaning. Official asset origins are recorded in `assets/icons/vendors/SOURCES.md`.

## Evidence Boundary

- GCP and Kubernetes inspection was read-only.
- PostgreSQL access was limited to catalog metadata; no application rows are included.
- Secret names are documented, but secret values are not.
- AWS resources were not inspected or changed for this package.
- Optional product capabilities are clearly separated from verified live configuration.
- The reusable Terraform package is not treated as proof of the current live topology.

## Rebuild the HTML Site

From the `Architecture` directory:

```powershell
node .\tools\build-site.mjs
```

The generated site has no web-server dependency and can be opened directly from the filesystem.

To preview the site with the production-equivalent security headers:

```powershell
node .\tools\serve-secure.mjs 4173
```

## Validate and Re-export Structurizr

Use Structurizr vNext 2026.06.28 with Java 21 for validation and the supported JSON, Mermaid, and static exports. Structurizr CLI 2025.11.09 is retained only as a trusted build-time DOT exporter because vNext does not expose DOT through its export command. Graphviz 15.1.1 renders the local DOT files. None of these build tools are shipped to the browser.

```powershell
java -jar .\structurizr-2026.06.28.war validate -w .\workspace.dsl
java -jar .\structurizr-2026.06.28.war export -w .\workspace.dsl -f static -o .\structurizr-site
java -jar .\structurizr-2026.06.28.war export -w .\workspace.dsl -f json -o .\exports
java -jar .\structurizr-2026.06.28.war export -w .\workspace.dsl -f mermaid -o .\exports\mermaid
structurizr export -workspace .\workspace.dsl -format dot -output .\exports\dot
node .\tools\optimize-dot-layout.mjs
node .\tools\harden-structurizr-static.mjs
```

The hardening step also replaces the CryptoJS 4.1.1 file emitted by Structurizr with the official 4.2.0 release stored in `tools/vendor/`. This source copy and its license are versioned so a rebuild does not depend on a CDN or an unpinned download.

Render a DOT view to SVG with Graphviz:

```powershell
dot -Tsvg .\exports\dot\structurizr-01-system-context.dot -o .\diagrams\structurizr-01-system-context.svg
```

The DOT optimization step increases node separation and gives Graphviz additional crossing-minimization passes, with extra spacing for the dense Deployment and Network views. It also removes repeated configuration, health, logging, and other out-of-scope relationship lines from those two static physical diagrams; the same relationships remain documented in the focused Container, Security, Runtime, and Observability views and in the authoritative Structurizr model. Run it after every DOT export and before rendering SVG files.

After rendering all DOT files, restore the local icon directory in `structurizr-site/assets/icons`, then run:

```powershell
node .\tools\decorate-diagrams.mjs
node .\tools\build-site.mjs
node .\tools\generate-sbom.mjs
node .\tools\verify-package.mjs
```

The source workspace is the architectural authority. Generated HTML, JSON, DOT, Mermaid, SVG, static-viewer, and SBOM files should be refreshed after a model change.

## Secure Hosting

The package remains usable from the local filesystem, but publication should use HTTPS and the supplied security headers. Cloudflare Pages and Netlify can consume `_headers`; NGINX can include `hosting/nginx-security-headers.conf`. See `hosting/README.md` before adding HSTS or relaxing the Content Security Policy.

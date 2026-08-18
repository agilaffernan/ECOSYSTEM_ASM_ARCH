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

Use Structurizr vNext 2026.06.28 with Java 21 for validation and the supported JSON, Mermaid, and static exports. Structurizr CLI 2025.11.09 is retained only as a trusted build-time DOT exporter because vNext does not expose DOT through its export command. Graphviz 15.1.0 renders the local DOT files. None of these build tools are shipped to the browser.

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

The DOT optimization step preserves the approved System Context layout and applies compact, layered, orthogonal routing to the other static views. Component and physical diagrams flow top-to-bottom, runtime sequences remain left-to-right, and repeated relationship labels are retained only on representative paths. Every view containing ASM Storage API gives the primary storage service a stronger visual treatment; focused component layouts place it centrally when that does not alter the meaning of the flow. The focused API, Deployment, Network, Security, and Observability views also omit relationships that belong to another concern, while the complete relationship set remains in the authoritative Structurizr model and its specialized views. Run the optimization after every DOT export and before rendering SVG files.

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

## Updating the Complete Ecosystem with Codex

Codex can extend this repository from the ASM+ baseline into an architecture portal for the complete Auritas ecosystem. The update must remain evidence-driven: deployed infrastructure and application repositories describe the implementation, while `workspace.dsl` remains the authoritative architecture model.

### Evidence and Safety Rules

1. Give Codex the repositories, deployment manifests, Helm values, Terraform, API specifications, and approved environment inventory for the systems being added.
2. Cloud inspection must be read-only unless a separate request explicitly authorizes a change. Architecture maintenance must not create, update, restart, or delete cloud resources.
3. Never place passwords, tokens, private keys, connection strings containing credentials, service-account JSON, secret values, or customer data in the model or generated artifacts.
4. Record observed facts separately from supported-but-disabled capabilities, recommendations, assumptions, and gaps.
5. Preserve existing Structurizr element and view identifiers whenever the represented responsibility has not changed. Stable identifiers keep links, comparisons, and review history useful.

### Codex Update Workflow

1. Inventory the ecosystem systems and their owners, users, repositories, APIs, data stores, integrations, runtime platforms, network entry points, identity controls, and observability services.
2. Compare the evidence with `workspace.dsl`, `architecture-inventory.md`, `traceability-matrix.md`, and `assumptions-and-gaps.md`. Report contradictions before changing the model.
3. Add each product or domain as a clearly named software system under `auritas.com`. Use system-context and container views for cross-system communication, then component views only where source evidence supports that level of detail.
4. Create or update the ten architecture areas used by this package: System Context, Containers, Components, API/Integration, Data, Deployment, Network, Security, Runtime/Sequence, and Observability.
5. Update `tools/site-content.mjs` so the manuals explain the new systems, relationships, protocols, trust boundaries, data ownership, deployment targets, failure paths, and operational controls.
6. Add official vendor icons only for explicitly modeled vendor products. Store local copies under `assets/icons/vendors/`, document their origins in `assets/icons/vendors/SOURCES.md`, and use generic icons for Auritas-owned or provider-neutral components.
7. Regenerate JSON, Mermaid, DOT, SVG, the Structurizr static site, manuals, and the SBOM with the pinned workflow documented above. Run DOT optimization before SVG rendering and hardening after every Structurizr static export.
8. If the ecosystem adds legitimate manuals, diagrams, or icon categories, update the expected counts and required categories in `tools/verify-package.mjs` as part of the same reviewed change.
9. Run `node .\tools\verify-package.mjs`, validate `workspace.dsl` with Structurizr vNext, scan the exact browser dependencies, and preview the site with `node .\tools\serve-secure.mjs 4173`.
10. Use browser QA to open the overview, every changed manual, the interactive Structurizr viewer, and representative full-screen SVG diagrams. Confirm that images are nonblank, links resolve, labels remain readable, and the browser console has no CSP or runtime errors.
11. Review the final Git diff for unintended generated changes and sensitive information. Commit the source model and all synchronized generated artifacts together so the repository never contains a partially regenerated architecture.

### Recommended Codex Prompt

```text
Update the Auritas ecosystem architecture in this repository using the supplied
source repositories, deployment files, and read-only cloud evidence.

Do not modify any cloud resource or application repository. Do not include
secret values or customer data. Preserve stable Structurizr identifiers.

Update workspace.dsl, the architecture inventory, traceability matrix,
assumptions and gaps, manuals, and icon sources. Cover System Context,
Containers, Components, API/Integration, Data, Deployment, Network, Security,
Runtime/Sequence, and Observability for every affected system.

Regenerate and synchronize the Structurizr JSON/static export, Mermaid, DOT,
decorated SVG diagrams, HTML manuals, and CycloneDX SBOM. Apply the hosting
hardening step, run the package verifier and dependency audit, and perform
browser QA under the supplied security headers.

Before committing, summarize observed changes, assumptions, unresolved gaps,
security findings, validation results, and the exact files changed.
```

### Completion Criteria

- Every modeled relationship is supported by source, deployment, API, or approved operational evidence.
- Provider-specific deployment views are separated from provider-neutral application views.
- New systems are reachable from the `auritas.com` navigation tree and the relevant Structurizr views.
- Generated JSON, Mermaid, DOT, SVG, HTML, static-viewer, and SBOM artifacts represent the same workspace revision.
- Package verification, dependency audit, secret scan, link validation, CSP checks, and browser rendering tests pass before publication.

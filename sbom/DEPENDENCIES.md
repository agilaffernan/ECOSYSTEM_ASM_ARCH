# ASM+ Architecture Dependency Inventory

This inventory accompanies the CycloneDX 1.6 SBOM in `architecture.cdx.json`. Runtime components are delivered to the browser by the static documentation site. Build-time tools are not shipped or executed by the hosted site.

## Runtime components

| Component | Version | Package URL |
|---|---:|---|
| Structurizr static viewer | 2026.06.28 | `pkg:generic/structurizr-static-viewer@2026.06.28` |
| Bootstrap | 5.3.7 | `pkg:npm/bootstrap@5.3.7` |
| CryptoJS | 4.2.0 | `pkg:npm/crypto-js@4.2.0` |
| Dagre | 1.1.8 | `pkg:npm/%40dagrejs/dagre@1.1.8` |
| Graphlib | 2.2.4 | `pkg:npm/%40dagrejs/graphlib@2.2.4` |
| JointJS Core | 4.1.3 | `pkg:npm/%40joint/core@4.1.3` |
| JointJS Directed Graph | 4.1.3 | `pkg:npm/%40joint/layout-directed-graph@4.1.3` |
| jQuery | 3.7.1 | `pkg:npm/jquery@3.7.1` |

## Build-time tools

| Component | Version | Purpose |
|---|---:|---|
| Structurizr vNext | 2026.06.28 | Build-time validation and JSON, Mermaid, and static-site export |
| Structurizr CLI legacy DOT exporter | 2025.11.09 | Build-time DOT export only; not shipped or executed by the hosted site |
| Graphviz | 15.1.0 | Build-time SVG rendering only |
| Eclipse Temurin JRE | 21.0.12+8 | Build-time Structurizr runtime only |

## Security note

The previous static viewer bundled Lodash 4.17.21. The Structurizr vNext 2026.06.28 export no longer includes Lodash or Backbone, so the affected Lodash component is absent from the delivered site rather than suppressed or patched in place. The vNext export's CryptoJS 4.1.1 file is reproducibly replaced with the official CryptoJS 4.2.0 release during hardening.

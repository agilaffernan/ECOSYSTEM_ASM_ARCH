# Security Notes

## Supported artifact

Only the current generated package is supported. Regenerate all exports after changing `workspace.dsl`, then run the package verifier before publication.

## Browser security

- The package loads scripts, styles, fonts, icons, diagrams, and workspace data locally.
- The supplied hosting policy blocks remote connections and third-party active content.
- The Structurizr initialization code is stored in an external JavaScript file so `script-src 'self'` can remain strict.
- Diagram links opened in a new tab use `noopener` isolation.
- The full-screen SVG viewer accepts only local diagram paths and assigns user-visible values with safe DOM APIs.

## Dependency remediation

The old Structurizr static export bundled Lodash 4.17.21. The package was regenerated with Structurizr vNext 2026.06.28, whose static viewer does not include Lodash or Backbone. This removes the affected Lodash dependency instead of carrying a locally modified vendor file.

Structurizr vNext 2026.06.28 exports CryptoJS 4.1.1. The hardening step replaces that file with the official CryptoJS 4.2.0 release stored under `tools/vendor/`; this addresses the PBKDF2 advisory affecting versions below 4.2.0 and keeps future regeneration deterministic.

Dependency versions and file hashes are recorded in `sbom/architecture.cdx.json`. Build-time tools are marked with excluded scope because they are not delivered to browsers.

## Reporting

Do not place credentials, tokens, secret values, user data, private keys, or service-account JSON files in this repository. Report a suspected exposure privately to the repository owner before opening a public issue.

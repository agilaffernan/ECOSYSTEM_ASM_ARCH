# Assumptions, Qualifications, and Gaps

Observed: August 11, 2026

## Scope

This package describes the live ASM+ deployment in GCP project `sap-ecosystem-asmplus`. It does not modify or validate AWS resources. It does not contain secret values, database row data, or private keys.

## Point-in-Time Nature

Kubernetes, GCP, DNS, image tags, source branches, and application configuration can change. The model records the state observed on August 11, 2026. Re-run the inventory and regenerate the exports after a deployment change.

## Live Versus Target Architecture

The live deployment and the reusable Terraform package are not identical:

| Topic | Live deployment | Reusable Terraform target |
|---|---|---|
| VPC | `default` VPC | Dedicated VPC design |
| PostgreSQL | Version 18 | Version 16 target |
| GKE node size | `e2-medium` | Different target sizing |
| Authority in this package | Live observations | Future/portable deployment intent |

The diagrams show the live deployment. Terraform is referenced only as a separate future target.

## Optional Product Capabilities

- SAML and Microsoft identity support exist in Auth, but an active provider was not verified.
- Vector clients exist, but `VECTOR_API_URL` was empty in the live runtime.
- OnlyOffice support exists in Viewer, but its live endpoint values were empty.
- These capabilities appear in diagrams as optional, not as active dependencies.

## Source-to-Image Qualification

The deployed images use development-line tags imported into Artifact Registry. Source was reviewed from the corresponding development repositories/branches available during the assessment. The package does not claim a reproducible source commit for every image unless the image provenance records that commit externally.

## Data Qualifications

- The database architecture is based on table and foreign-key catalog metadata.
- No application rows were read into this package.
- No distributed transaction is assumed between PostgreSQL and GCS.
- The GCS bucket inventory did not report versioning as enabled.

## Security Gaps Observed

- No namespace Roles or RoleBindings were observed.
- No Kubernetes NetworkPolicies were observed.
- Application containers did not specify a consistent explicit security context.
- GKE application-layer secret encryption was reported as `DECRYPTED`.
- The live cluster is in the default VPC, which retains broad default firewall rules.
- The architecture documents these gaps but does not remediate them.

## Availability Gaps Observed

- GKE is zonal in `us-east1-b`.
- Cloud SQL is zonal rather than regional HA.
- Each application Deployment has one replica.
- Backups and PITR protect recovery but do not provide runtime high availability.

## Observability Gaps Observed

- No custom alert policies.
- No custom dashboards.
- No uptime checks.
- No log-based metrics.
- No notification channels.
- Managed Prometheus automatic application monitoring scope was `NONE`.
- Cloud SQL Query Insights was not verified as enabled.

## Security and Change Principle

Any hardening, scaling, network, database, or observability change should first be tested in an isolated project or environment. This architecture work was documentation-only and made no deployment change.

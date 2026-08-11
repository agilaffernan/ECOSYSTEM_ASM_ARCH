# ASM+ Live Architecture Inventory

Observed: August 11, 2026

This is a point-in-time, read-only inventory supporting the architecture model. It is not a credential file and contains no secret values.

## Environment

| Item | Observed value |
|---|---|
| GCP project | `sap-ecosystem-asmplus` |
| Region / zone | `us-east1` / `us-east1-b` |
| GKE cluster | `asmplus-demo-gke` |
| Cluster type | Standard, zonal |
| GKE version / channel | `1.35.6-gke.1250000` / Regular |
| Kubernetes namespace | `asm-plus-demo` |
| Helm release | `asm-plus-demo` |
| VPC / subnet | `default` / regional default subnet |
| Nodes | Three Ready `e2-medium` nodes |
| Pod CIDR | `10.104.128.0/17` |
| Service CIDR | `34.118.224.0/20` |

## Workloads

All eight deployments were observed at one desired and one ready replica.

| Deployment | Service exposure | Deployed Artifact Registry image |
|---|---|---|
| `front-auth` | Public, port 80 | `front-auth:dockerhub-dev-20260805-195902` |
| `api-auth` | Public, port 3000 | `api-auth:dockerhub-dev-20260805-195902` |
| `front-asm-plus` | Public, port 8080 | `front-asm-plus:dockerhub-dev-20260805-195902` |
| `api-asm-plus` | Public, port 3000 | `api-asm-plus:dockerhub-dev-20260805-195902` |
| `front-viewer` | Public, port 8080 | `front-viewer:dockerhub-dev-20260805-195902` |
| `api-sap` | Public, port 3020 | `api-sap:dockerhub-dev-20260805-195902` |
| `api-sf` | Public, port 3030 | `api-sf:dockerhub-dev-20260805-195902-sf-managed-users-rootfix` |
| `asm-api` | Internal ClusterIP, port 3000 | `api-asm:dockerhub-dev-20260805-195902` |

The image repository prefix is `us-east1-docker.pkg.dev/sap-ecosystem-asmplus/asm-plus/`.

## Public Entry

| Item | Observed value |
|---|---|
| GKE Ingress | `asm-plus-ingress` |
| Static IP name / address | `asmplus-demo-ip` / `34.36.209.159` |
| Managed certificate | `asmplus-demo-certificate-v2`, Active |
| HTTP behavior | Permanent redirect to HTTPS |
| Backends | GKE Network Endpoint Groups |

The certificate covers these seven DNS A records:

- `auth.asmplus-demo.auritas.com`
- `api-auth.asmplus-demo.auritas.com`
- `app.asmplus-demo.auritas.com`
- `api-asm-plus.asmplus-demo.auritas.com`
- `viewer.asmplus-demo.auritas.com`
- `api-sap.asmplus-demo.auritas.com`
- `api-sf.asmplus-demo.auritas.com`

## Cloud SQL

| Item | Observed value |
|---|---|
| Instance | `asmplus-demo-postgres` |
| Engine | PostgreSQL 18 |
| Region | `us-east1` |
| Address | Private `10.61.176.3`; no public IPv4 |
| Tier / availability | `db-g1-small`; zonal |
| Storage | 60 GB PD-SSD |
| Encryption mode | `ENCRYPTED_ONLY` |
| Backups | Enabled at 03:00; seven retained |
| Point-in-time recovery | Enabled; seven days of transaction logs |

The database-backed APIs use Cloud SQL Auth Proxy `2.14.1` sidecars with private IP. Applications connect to `127.0.0.1:5432`.

## PostgreSQL Public Schema

Twenty-three tables were observed:

`applications`, `audit_logs`, `client_connections`, `document_report_rollups`, `files`, `folder_access`, `folder_search_preferences`, `folders`, `generic_access`, `metadata_key_mappings`, `notification_recipients`, `notifications`, `role_group_folder_roles`, `role_group_users`, `role_groups`, `roles`, `sso_configurations`, `sso_identity_providers`, `structures`, `user_application_access`, `users`, `workflow`, and `workflow_step`.

## Cloud Storage

| Item | Observed value |
|---|---|
| Bucket | `sap-ecosystem-asmplus-asm-binaries` |
| Location | `US-EAST1` |
| Uniform bucket-level access | Enabled |
| Public access prevention | Enforced |
| Soft delete | Seven days |
| Application identity | `asm-api-demo@sap-ecosystem-asmplus.iam.gserviceaccount.com` |
| Application role | `roles/storage.objectAdmin` |

Bucket versioning was not returned as enabled in the live inventory.

## Identity and Secrets

Workload Identity mappings:

- KSA `asm-api` to GSA `asm-api-demo@sap-ecosystem-asmplus.iam.gserviceaccount.com`
- KSA `cloudsql-client` to GSA `asmplus-cloudsql-client@sap-ecosystem-asmplus.iam.gserviceaccount.com`

No user-managed service-account keys were observed. GCS access uses Application Default Credentials; no JSON key is mounted.

Kubernetes Secret key names:

`ASM_API_KEY`, `AUTH_CLIENT_KEY`, `AUTH_SUPER_ADMIN_PASSWORD`, `JWT_SECRET`, `PGPASSWORD`, `SAP_BASIC_AUTH_USERS_JSON`, and `SF_MANAGED_USERS_JSON`.

Core Secret Manager object names:

`asm-api-key`, `auth-client-key-front-asm-plus`, `auth-jwt-secret`, `auth-superadmin-password`, and `postgres-password`.

## Observability

- GKE system and workload logging are enabled.
- GKE monitoring components are enabled.
- Managed Service for Prometheus is enabled; automatic application-monitoring scope was `NONE`.
- Every Deployment has readiness and liveness probes.
- No custom alert policies, dashboards, uptime checks, log-based metrics, or notification channels were observed.

## Current Security Observations

- TLS is active for all seven public hostnames.
- Cloud SQL uses private IP and encrypted connections.
- GCS is private and keyless through Workload Identity.
- No namespace Roles, RoleBindings, or NetworkPolicies were observed.
- Application containers had no explicit security context in the inspected manifests.
- GKE application-layer secret encryption was reported as `DECRYPTED`.
- The default VPC retains broad default SSH, RDP, and ICMP firewall rules.

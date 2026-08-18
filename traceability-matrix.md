# Architecture Evidence Traceability

Observed: August 11, 2026

The table maps each Structurizr view to the evidence types used to build it. All cloud and database inspection was read-only.

| View key | View | Primary supporting evidence | Confidence |
|---|---|---|---|
| `01-system-context` | System Context | Live GCP resource inventory, public DNS/TLS checks, deployed services, source capabilities | High for live dependencies; qualified for optional IdP |
| `02-container-microservices` | Container / Microservices | Kubernetes Deployments/Services, image tags, ConfigMaps, Secret key names, source routes | High |
| `03a-component-asm-api` | ASM Storage API components | `ECOSYSTEM_API_ASM` development source, live runtime configuration, GCS IAM | High |
| `03b-component-api-asm-plus` | ASM+ API components | `ECOSYSTEM_API_ASM_PLUS` source, routes/controllers/services, DB schema | High |
| `03c-component-api-auth` | Auth API components | `ECOSYSTEM_API_AUTH` source, routes/services, DB schema | High |
| `03d-component-api-sap` | SAP API components | `ECOSYSTEM_API_SAP` source, live OpenAPI, environment configuration | High |
| `03e-component-api-sf` | SAP SuccessFactors API components | `ECOSYSTEM_API_SF` source, live OpenAPI, environment configuration | High |
| `03f-component-front-asm-plus` | ASM+ Web components | `ECOSYSTEM_FRONT_ASM_PLUS` source and live `runtime-config.js` | High |
| `03g-component-front-auth` | Auth Portal components | `ECOSYSTEM_FRONT_AUTH` source and live runtime configuration | High |
| `03h-component-front-viewer` | Viewer components | `ECOSYSTEM_FRONT_VIEWER` source and live `runtime-config.js` | High; OnlyOffice marked optional |
| `04-api-integration` | API / Integration | Ingress host rules, Services, live OpenAPI where exposed, source routes and clients | High |
| `05-data-architecture` | Data | Cloud SQL configuration, read-only PostgreSQL catalog and foreign keys, GCS configuration, source adapters | High |
| `06-deployment-architecture` | Deployment | GKE cluster/node/deployment inventory, Artifact Registry, Cloud SQL, GCS, Ingress | High |
| `07-network-architecture` | Network | DNS, GCE Ingress, NEGs, Services, VPC/subnet/CIDRs, firewall inventory, Cloud SQL private IP | High |
| `08-security-architecture` | Security | ManagedCertificate, IAM, service accounts, Secret names, Pod specs, RBAC/NetworkPolicy inventory | High for observed controls and gaps |
| `09a-runtime-sso` | SSO sequence | Frontend runtime settings, Auth frontend/API source, route behavior | High for local SSO path; external IdP optional |
| `09b-runtime-upload` | Upload sequence | Frontend/API routes, database adapter, ASM client, GCS repository | High |
| `09c-runtime-view` | View sequence | Frontend Viewer source, ASM+/SAP APIs, range support, GCS repository | High |
| `09d-runtime-sap` | SAP write sequence | SAP OpenAPI/source, ASM storage client, DB and GCS configuration | High |
| `09e-runtime-successfactors` | SAP SuccessFactors write sequence | SF OpenAPI/source, token/user services, DB and GCS configuration | High |
| `10-observability-architecture` | Observability | Probe specs, GKE logging/monitoring configuration, Monitoring inventory | High |

## Evidence Types

- `kubectl` reads: Deployments, Pods, Services, Ingress, ConfigMaps, Secret key names, service accounts, probes, RBAC, NetworkPolicies, and certificate resources.
- `gcloud` reads: GKE, nodes, VPC/firewalls, load balancing, Cloud SQL, GCS, IAM, Artifact Registry, Secret Manager names, Logging, and Monitoring.
- PostgreSQL reads: public-schema table and foreign-key catalog metadata only.
- Helm and Terraform reads: current chart behavior and the separate reusable target package.
- Source reads: route, middleware, service, adapter, storage, and frontend runtime behavior.

## Interpretation Rule

An observed live resource has stronger evidentiary weight than a value in a template or guide. A source capability is not represented as active unless runtime configuration or live behavior confirms it.

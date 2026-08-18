export const manuals = [
  {
    number: "1",
    slug: "01-system-context",
    shortTitle: "System Context",
    title: "System Context Architecture",
    summary: "Explains where ASM+ lives, who uses it, which enterprise systems connect to it, and which Google Cloud services form its external operating context.",
    diagrams: [
      {
        file: "structurizr-01-system-context.svg",
        view: "01-system-context",
        title: "ASM+ System Context",
        alt: "C4 system context diagram for ASM+ on Google Cloud",
        caption: "Figure 1. People, external systems, and managed-service dependencies around the ASM+ software system."
      }
    ],
    sections: [
      {
        title: "What This View Answers",
        html: `<p>ASM+ is a document-management and integration platform running in project <code>sap-ecosystem-asmplus</code>. Users reach its web applications and APIs through seven HTTPS hostnames. The application tier runs on GKE; Cloud SQL stores metadata; Cloud Storage stores binaries and ASM objects; Cloud Operations receives platform and workload telemetry.</p>
        <div class="fact-grid">
          <article class="fact"><h3>Primary users</h3><p>Business users manage and view documents. Platform administrators operate application access, Kubernetes workloads, and GCP resources.</p></article>
          <article class="fact"><h3>Enterprise integrations</h3><p>SAP business systems use the ArchiveLink-compatible API, while SAP SuccessFactors uses its repository, document, and token endpoints.</p></article>
          <article class="fact"><h3>Data services</h3><p>Private Cloud SQL PostgreSQL stores application metadata. A private GCS bucket stores binary objects and manifests.</p></article>
          <article class="fact"><h3>Entry point</h3><p>Auritas DNS resolves seven A records to the external load balancer at <code>34.36.209.159</code>.</p></article>
        </div>`
      },
      {
        title: "Actors and External Systems",
        html: `<table><thead><tr><th>Element</th><th>Role</th><th>Status</th></tr></thead><tbody>
          <tr><td>ASM+ User</td><td>Creates folders, uploads files, searches content, and opens the document viewer.</td><td>Observed use case</td></tr>
          <tr><td>Platform Administrator</td><td>Administers applications, roles, users, GKE, Cloud SQL, GCS, and operational evidence.</td><td>Observed use case</td></tr>
          <tr><td>SAP System</td><td>Calls the SAP ArchiveLink-compatible integration over HTTPS.</td><td>Deployed API</td></tr>
          <tr><td>SAP SuccessFactors</td><td>Calls SuccessFactors document/repository endpoints and obtains bounded tokens.</td><td>Deployed API</td></tr>
          <tr><td>Auritas DNS</td><td>Publishes the public <code>asmplus-demo.auritas.com</code> names.</td><td>Observed live</td></tr>
        </tbody></table>`
      },
      {
        title: "System Boundary and Ownership",
        html: `<p>The ASM+ boundary includes the eight application workloads, their runtime configuration, and the Kubernetes secret used by those workloads. GKE, Cloud SQL, GCS, Artifact Registry, Secret Manager, the external load balancer, DNS, and Cloud Operations are platform dependencies outside the software-system boundary.</p>`
      },
      {
        title: "Evidence Basis",
        html: `<ul><li>Read-only GKE, Kubernetes, Ingress, ManagedCertificate, Cloud SQL, GCS, IAM, Artifact Registry, Logging, and Monitoring inventory.</li><li>Read-only PostgreSQL catalog queries for schema structure only.</li><li>Helm values/templates and the currently deployed image tags.</li><li>Read-only source review of the eight application repositories and active development branches.</li></ul>`
      }
    ]
  },
  {
    number: "2",
    slug: "02-container-microservices",
    shortTitle: "Container / Microservices",
    title: "Container and Microservices Architecture",
    summary: "Shows the eight deployed workloads, their responsibilities, public or internal exposure, and their principal runtime dependencies.",
    diagrams: [
      {
        file: "structurizr-02-container-microservices.svg",
        view: "02-container-microservices",
        title: "Deployed Containers and Service Dependencies",
        alt: "C4 container diagram for the ASM+ microservices",
        caption: "Figure 2. The deployed workloads are organized into frontend, backend/API, and data-storage layers; ASM Storage API remains the highlighted central storage service."
      }
    ],
    sections: [
      {
        title: "Live Workload Inventory",
        html: `<table><thead><tr><th>Deployment</th><th>Purpose</th><th>Service</th><th>Live image tag</th></tr></thead><tbody>
          <tr><td><code>front-auth</code></td><td>Login, SSO, and identity/access administration portal.</td><td>Public; port 80</td><td><code>front-auth:dockerhub-dev-20260805-195902</code></td></tr>
          <tr><td><code>front-asm-plus</code></td><td>Main document, workflow, search, report, and audit web application.</td><td>Public; port 8080</td><td><code>front-asm-plus:dockerhub-dev-20260805-195902</code></td></tr>
          <tr><td><code>front-viewer</code></td><td>Document display for ASM+ and SAP-origin content.</td><td>Public; port 8080</td><td><code>front-viewer:dockerhub-dev-20260805-195902</code></td></tr>
          <tr><td><code>api-auth</code></td><td>Authentication, JWT issuance, users, roles, apps, structures, connections, and SSO.</td><td>Public; port 3000</td><td><code>api-auth:dockerhub-dev-20260805-195902</code></td></tr>
          <tr><td><code>api-asm-plus</code></td><td>Document metadata, permissions, workflows, notifications, reports, and storage orchestration.</td><td>Public; port 3000</td><td><code>api-asm-plus:dockerhub-dev-20260805-195902</code></td></tr>
          <tr><td><code>api-sap</code></td><td>SAP ArchiveLink-compatible document integration and viewer launch.</td><td>Public; port 3020</td><td><code>api-sap:dockerhub-dev-20260805-195902</code></td></tr>
          <tr><td><code>api-sf</code></td><td>SAP SuccessFactors token, repository, document, and managed-user integration.</td><td>Public; port 3030</td><td><code>api-sf:dockerhub-dev-20260805-195902-sf-managed-users-rootfix</code></td></tr>
          <tr><td><code>asm-api</code></td><td>Internal binary, manifest, license, and certificate storage service.</td><td>Internal ClusterIP; port 3000</td><td><code>api-asm:dockerhub-dev-20260805-195902</code></td></tr>
        </tbody></table>
        <p>All eight deployments were observed at <code>1/1</code> Ready. The public services are NEG-backed through GKE Ingress. <code>asm-api</code> remains internal.</p>`
      },
      {
        title: "Primary Communication Paths",
        html: `<table><thead><tr><th>Caller</th><th>Target</th><th>Purpose</th><th>Protocol / control</th></tr></thead><tbody>
          <tr><td>Auth Portal</td><td>Auth API</td><td>Login and identity administration</td><td>HTTPS JSON</td></tr>
          <tr><td>ASM+ Web</td><td>Auth API</td><td>Authentication and application access checks</td><td>HTTPS JSON, JWT</td></tr>
          <tr><td>ASM+ Web</td><td>ASM+ API</td><td>Document and workflow operations</td><td>HTTPS JSON and binary</td></tr>
          <tr><td>Viewer</td><td>Auth, ASM+ API, SAP API</td><td>Access validation and content retrieval</td><td>HTTPS, JSON, HTTP range</td></tr>
          <tr><td>ASM+ API, SAP API, SF API</td><td>ASM Storage API</td><td>Binary, manifest, certificate, and license operations</td><td>Internal HTTP with <code>X-Api-Key</code></td></tr>
          <tr><td>Auth, ASM+, SAP, SF APIs</td><td>Cloud SQL</td><td>Metadata persistence</td><td>Local proxy at <code>127.0.0.1:5432</code></td></tr>
          <tr><td>ASM Storage API</td><td>GCS</td><td>Object persistence</td><td>GCS API with ADC / Workload Identity</td></tr>
        </tbody></table>`
      }
    ]
  },
  {
    number: "3",
    slug: "03-component-architecture",
    shortTitle: "Component Architecture",
    title: "Component Architecture",
    summary: "Decomposes each frontend and API into its principal code responsibilities so maintainers can see where authentication, business logic, persistence, and integration behavior live.",
    diagrams: [
      { file: "structurizr-03a-component-asm-api.svg", view: "03a-component-asm-api", title: "ASM Storage API Components", alt: "Component diagram of asm-api", caption: "Figure 3a. Internal storage contract, license and certificate services, document manifests, and the GCS repository." },
      { file: "structurizr-03b-component-api-asm-plus.svg", view: "03b-component-api-asm-plus", title: "ASM+ API Components", alt: "Component diagram of api-asm-plus", caption: "Figure 3b. API routing, authorization, domain services, reporting, persistence, and storage delegation." },
      { file: "structurizr-03c-component-api-auth.svg", view: "03c-component-api-auth", title: "Auth API Components", alt: "Component diagram of api-auth", caption: "Figure 3c. Authentication, access administration, SSO, and PostgreSQL persistence." },
      { file: "structurizr-03d-component-api-sap.svg", view: "03d-component-api-sap", title: "SAP API Components", alt: "Component diagram of api-sap", caption: "Figure 3d. ArchiveLink HTTP, SAP authentication, metadata persistence, viewer tokens, and ASM storage calls." },
      { file: "structurizr-03e-component-api-sf.svg", view: "03e-component-api-sf", title: "SAP SuccessFactors API Components", alt: "Component diagram of api-sf", caption: "Figure 3e. SAP SuccessFactors API, token service, managed users, persistence, and ASM storage calls." },
      { file: "structurizr-03f-component-front-asm-plus.svg", view: "03f-component-front-asm-plus", title: "ASM+ Web Components", alt: "Component diagram of front-asm-plus", caption: "Figure 3f. Runtime configuration, application shell, authentication, document UI, API client, and Viewer launch." },
      { file: "structurizr-03g-component-front-auth.svg", view: "03g-component-front-auth", title: "Auth Portal Components", alt: "Component diagram of front-auth", caption: "Figure 3g. Runtime configuration, portal routes, authentication context, and Auth API client." },
      { file: "structurizr-03h-component-front-viewer.svg", view: "03h-component-front-viewer", title: "Document Viewer Components", alt: "Component diagram of front-viewer", caption: "Figure 3h. Runtime configuration, parameter parsing, document retrieval, native rendering, and optional OnlyOffice integration." }
    ],
    sections: [
      {
        title: "Backend Responsibility Map",
        html: `<table><thead><tr><th>Service</th><th>Core responsibilities</th><th>Data / downstream dependency</th></tr></thead><tbody>
          <tr><td>ASM Storage API</td><td>Internal API-key guard, license validation, certificates, document components, manifests, versions, ranges, and optimistic concurrency.</td><td>GCS via <code>@google-cloud/storage</code> and ADC.</td></tr>
          <tr><td>ASM+ API</td><td>Folders, files, authorization, role groups, workflows, notifications, reports, audit, search, and metadata mappings.</td><td>Cloud SQL plus ASM Storage API.</td></tr>
          <tr><td>Auth API</td><td>Password verification, JWT signing, users, applications, roles, structures, connections, access, and optional SSO.</td><td>Cloud SQL.</td></tr>
          <tr><td>SAP API</td><td>ArchiveLink interface, Basic/certificate authentication, SAP hierarchy persistence, HMAC viewer launch, and administration.</td><td>Cloud SQL, ASM Storage API, Viewer.</td></tr>
          <tr><td>SAP SuccessFactors API</td><td>Repository/document interface, OAuth/SAML bearer token handling, managed users, public keys, repository scope, and administration.</td><td>Cloud SQL and ASM Storage API.</td></tr>
        </tbody></table>`
      },
      {
        title: "Frontend Responsibility Map",
        html: `<table><thead><tr><th>Frontend</th><th>Core responsibilities</th><th>Runtime dependencies</th></tr></thead><tbody>
          <tr><td>Auth Portal</td><td>Login, SSO initiation, user/role/application/structure/connection administration.</td><td><code>runtime-config.js</code> and Auth API.</td></tr>
          <tr><td>ASM+ Web</td><td>Document tree, uploads, recycle bin, permissions, workflows, notifications, reporting, audit, and search.</td><td><code>runtime-config.js</code>, Auth API, ASM+ API, Viewer.</td></tr>
          <tr><td>Document Viewer</td><td>Parses launch parameters, validates access, retrieves content, and selects a rendering path.</td><td>Auth API, ASM+ API, SAP API, optional OnlyOffice.</td></tr>
        </tbody></table>`
      },
      {
        title: "Cross-Cutting Controls",
        html: `<ul><li>JWT validation and application access are shared concepts between Auth, ASM+ API, and the frontends.</li><li>The internal <code>X-Api-Key</code> separates business APIs from the storage API.</li><li>License checks protect write paths that depend on the ASM storage service.</li><li>Database access is isolated behind a Cloud SQL Auth Proxy sidecar for each database-backed API.</li><li>Optional vector adapters exist in the ASM+, SAP, and SAP SuccessFactors APIs, but <code>VECTOR_API_URL</code> was empty in the live configuration.</li></ul>`
      },
      {
        title: "Source Alignment",
        html: `<p>The component decomposition reflects source-level routes, middleware, services, adapters, and frontend contexts from the deployed development-line repositories. It is a logical map rather than a class diagram; components group code by responsibility so operators and developers can trace runtime behavior without exposing implementation noise.</p>`
      }
    ]
  },
  {
    number: "4",
    slug: "04-api-integration",
    shortTitle: "API / Integration",
    title: "API and Integration Architecture",
    summary: "Documents public endpoints, internal service calls, protocols, and authentication controls used by browser, SAP, SAP SuccessFactors, database, and object-storage traffic.",
    diagrams: [
      { file: "structurizr-04-api-integration.svg", view: "04-api-integration", title: "API and Integration Map", alt: "API and integration architecture diagram", caption: "Figure 4. Public HTTPS interfaces, internal storage calls, database connectors, object storage, and optional identity exchange." }
    ],
    sections: [
      {
        title: "Public Hostnames",
        html: `<table><thead><tr><th>Hostname</th><th>Layer</th><th>Workload</th><th>Primary interface</th></tr></thead><tbody>
          <tr><td><code>auth.asmplus-demo.auritas.com</code></td><td>Frontend</td><td>Auth Portal</td><td>Browser login, SSO, and administration UI</td></tr>
          <tr><td><code>api-auth.asmplus-demo.auritas.com</code></td><td>Backend API</td><td>Auth API</td><td>JSON authentication and identity/access administration</td></tr>
          <tr><td><code>app.asmplus-demo.auritas.com</code></td><td>Frontend</td><td>ASM+ Web</td><td>Main browser application</td></tr>
          <tr><td><code>api-asm-plus.asmplus-demo.auritas.com</code></td><td>Backend API</td><td>ASM+ API</td><td>JSON and binary document-management API</td></tr>
          <tr><td><code>viewer.asmplus-demo.auritas.com</code></td><td>Frontend</td><td>Viewer</td><td>Browser document rendering</td></tr>
          <tr><td><code>api-sap.asmplus-demo.auritas.com</code></td><td>Backend API</td><td>SAP API</td><td>ArchiveLink-compatible operations; five OpenAPI paths observed</td></tr>
          <tr><td><code>api-sf.asmplus-demo.auritas.com</code></td><td>Backend API</td><td>SAP SuccessFactors API</td><td>Repository/document/token operations; health and repository paths observed</td></tr>
        </tbody></table>
        <p>All names resolve to <code>34.36.209.159</code> and are covered by the active Google-managed certificate <code>asmplus-demo-certificate-v2</code>.</p>`
      },
      {
        title: "Protocol and Authentication Matrix",
        html: `<table><thead><tr><th>Integration</th><th>Protocol</th><th>Authentication / trust</th></tr></thead><tbody>
          <tr><td>Browser to frontends/APIs</td><td>HTTPS; JSON, binary, and range requests</td><td>JWT and application access checks</td></tr>
          <tr><td>SAP to SAP API</td><td>ArchiveLink over HTTPS; raw or multipart HTTP</td><td>Basic Auth, certificate, or trusted service key depending on operation</td></tr>
          <tr><td>SAP SuccessFactors to SF API</td><td>REST over HTTPS</td><td>OAuth 2.0/JWT and SAML bearer support with managed users</td></tr>
          <tr><td>Business APIs to ASM Storage API</td><td>Internal HTTP REST</td><td><code>X-Api-Key</code>; storage service is not on public Ingress</td></tr>
          <tr><td>APIs to Cloud SQL</td><td>PostgreSQL to localhost proxy</td><td>Workload Identity authorizes the Cloud SQL connector</td></tr>
          <tr><td>ASM Storage API to GCS</td><td>GCS JSON API over HTTPS</td><td>Application Default Credentials from Workload Identity</td></tr>
        </tbody></table>`
      },
      {
        title: "Internal Contract",
        html: `<p>The central storage contract is the internal <code>/api/asm</code> API. ASM+ API, SAP API, and SAP SuccessFactors API retain their own domain behavior and metadata persistence, then delegate object storage to <code>asm-api</code>. This keeps GCS credentials and storage-provider selection out of the public integration APIs.</p>
        <div class="notice"><strong>Current GCP mode.</strong> The storage service selects GCS when <code>BTP_HYPERSCALER=GCP</code>. The GCS client uses ADC; no JSON key path is required or mounted.</div>`
      }
    ]
  },
  {
    number: "5",
    slug: "05-data-architecture",
    shortTitle: "Data Architecture",
    title: "Data Architecture",
    summary: "Separates relational metadata from binary object storage, groups the live PostgreSQL tables by domain, and explains how application APIs coordinate both stores.",
    diagrams: [
      { file: "structurizr-05-data-architecture.svg", view: "05-data-architecture", title: "Metadata and Binary Data Paths", alt: "ASM+ data architecture diagram", caption: "Figure 5. Database-backed APIs persist metadata while the internal storage API persists objects and manifests in GCS." }
    ],
    sections: [
      {
        title: "Live Data Stores",
        html: `<table><thead><tr><th>Store</th><th>Live configuration</th><th>Content</th></tr></thead><tbody>
          <tr><td>Cloud SQL</td><td><code>asmplus-demo-postgres</code>, PostgreSQL 18, private IP <code>10.61.176.3</code>, 60 GB PD-SSD, zonal <code>db-g1-small</code></td><td>Identity, access, document metadata, folders, workflow, audit, notifications, reports, and integration mappings.</td></tr>
          <tr><td>Cloud Storage</td><td><code>sap-ecosystem-asmplus-asm-binaries</code>, region <code>US-EAST1</code>, uniform access, public access prevention</td><td>Document binaries, manifests, licenses, certificates, and integration-managed objects.</td></tr>
        </tbody></table>`
      },
      {
        title: "Observed PostgreSQL Tables",
        html: `<table><thead><tr><th>Domain</th><th>Tables</th></tr></thead><tbody>
          <tr><td>Identity and application access</td><td><code>applications</code>, <code>users</code>, <code>roles</code>, <code>structures</code>, <code>client_connections</code>, <code>user_application_access</code>, <code>generic_access</code>, <code>sso_configurations</code>, <code>sso_identity_providers</code></td></tr>
          <tr><td>Document hierarchy</td><td><code>folders</code>, <code>files</code></td></tr>
          <tr><td>Folder and role-group authorization</td><td><code>folder_access</code>, <code>role_groups</code>, <code>role_group_users</code>, <code>role_group_folder_roles</code></td></tr>
          <tr><td>Workflow</td><td><code>workflow</code>, <code>workflow_step</code></td></tr>
          <tr><td>Audit and notifications</td><td><code>audit_logs</code>, <code>notifications</code>, <code>notification_recipients</code></td></tr>
          <tr><td>Search, metadata, and reports</td><td><code>metadata_key_mappings</code>, <code>folder_search_preferences</code>, <code>document_report_rollups</code></td></tr>
        </tbody></table>
        <p>The inventory contains 23 public-schema tables. Only catalog metadata was queried; no application rows or credentials are included in this package.</p>`
      },
      {
        title: "Relational Integrity",
        html: `<p>Foreign keys connect users to roles and service connections, applications to roles and structures, files to folders, folder access to users/folders, role groups to users/folders/roles, notifications to creators and recipients, workflows to folders and users, and workflow steps to workflows. These constraints keep identity, authorization, hierarchy, and workflow state coherent.</p>`
      },
      {
        title: "Write and Read Coordination",
        html: `<ol><li>A domain API validates the caller and the operation.</li><li>The domain API writes or reads relational metadata through its local Cloud SQL Auth Proxy.</li><li>For binary or manifest operations, the API calls <code>asm-api</code> with the internal API key.</li><li><code>asm-api</code> uses the GCS repository with ADC and generation preconditions.</li><li>The API returns a result only after the relevant metadata/object operation succeeds according to that route's transaction strategy.</li></ol>
        <p>For exact compensation or partial-failure behavior, consult the service implementation for the route being changed; the architecture does not claim a distributed transaction across PostgreSQL and GCS.</p>`
      },
      {
        title: "Protection and Recovery Characteristics",
        html: `<ul><li>Cloud SQL automated backups are enabled at 03:00.</li><li>Seven backups are retained, and point-in-time recovery keeps seven days of transaction logs.</li><li>Cloud SQL requires encrypted connections and has no public IPv4 address.</li><li>The GCS bucket blocks public access, uses uniform bucket-level access, and has a seven-day soft-delete policy.</li></ul>
        <div class="notice warning"><strong>Verification boundary.</strong> GCS versioning was not returned as enabled by the live bucket inventory. Do not treat versioning in a reusable Terraform target as evidence that it is active in this deployment.</div>`
      }
    ]
  },
  {
    number: "6",
    slug: "06-deployment-architecture",
    shortTitle: "Deployment Architecture",
    title: "Deployment Architecture",
    summary: "Maps the logical services to their live GCP resources: DNS, load balancer, zonal GKE cluster, pods and sidecars, Cloud SQL, GCS, Artifact Registry, Secret Manager, and Cloud Operations.",
    diagrams: [
      { file: "structurizr-06-deployment-architecture.svg", view: "06-deployment-architecture", title: "Live GCP Deployment Topology", alt: "Deployment diagram of ASM+ on Google Cloud", caption: "Figure 6. Physical deployment nodes and workload instances in the live project. Repetitive configuration, health, logging, and application-flow lines are shown in their focused manuals instead of this physical view." }
    ],
    sections: [
      {
        title: "Deployment Baseline",
        html: `<table><thead><tr><th>Layer</th><th>Observed live resource</th></tr></thead><tbody>
          <tr><td>Project</td><td><code>sap-ecosystem-asmplus</code></td></tr>
          <tr><td>Region / zone</td><td><code>us-east1</code> / <code>us-east1-b</code></td></tr>
          <tr><td>GKE</td><td><code>asmplus-demo-gke</code>, Standard, version <code>1.35.6-gke.1250000</code>, Regular channel</td></tr>
          <tr><td>Namespace / Helm release</td><td><code>asm-plus-demo</code> / <code>asm-plus-demo</code></td></tr>
          <tr><td>Node pool</td><td><code>default-pool</code>; three Ready <code>e2-medium</code> nodes; COS_CONTAINERD</td></tr>
          <tr><td>Ingress</td><td><code>asm-plus-ingress</code>, static IPv4 <code>34.36.209.159</code></td></tr>
          <tr><td>Cloud SQL</td><td><code>asmplus-demo-postgres</code>, PostgreSQL 18, private IP</td></tr>
          <tr><td>GCS</td><td><code>sap-ecosystem-asmplus-asm-binaries</code></td></tr>
          <tr><td>Artifact Registry</td><td><code>us-east1-docker.pkg.dev/sap-ecosystem-asmplus/asm-plus</code></td></tr>
        </tbody></table>`
      },
      {
        title: "Pod Composition",
        html: `<p>The three frontends and <code>asm-api</code> run one application container each. The four database-backed APIs run an application container and a <code>cloud-sql-proxy:2.14.1</code> sidecar. The proxy is configured for private IP, structured logs, and local port 5432.</p>
        <p>Every deployment was observed at one desired and one ready replica. Kubernetes Services provide stable ClusterIP endpoints; seven Services are connected to the external load balancer through NEGs.</p>`
      },
      {
        title: "Delivery Path",
        html: `<ol><li>Application images are stored in the regional Artifact Registry repository.</li><li>Helm renders Deployments, Services, ConfigMaps, service accounts, Ingress, BackendConfig, FrontendConfig, and ManagedCertificate resources.</li><li>GKE nodes pull OCI images and start application and proxy containers.</li><li>Readiness probes determine when NEG endpoints can receive traffic.</li><li>The Google-managed certificate and load balancer expose the ready services over HTTPS.</li></ol>`
      }
    ]
  },
  {
    number: "7",
    slug: "07-network-architecture",
    shortTitle: "Network Architecture",
    title: "Network Architecture",
    summary: "Traces public traffic from DNS and the external load balancer to GKE NEGs, and traces private service traffic to Cloud SQL and GCS.",
    diagrams: [
      { file: "structurizr-07-network-architecture.svg", view: "07-network-architecture", title: "Public and Private Network Paths", alt: "Network architecture diagram for ASM+ on GCP", caption: "Figure 7. DNS, TLS load balancing, GKE Ingress and NEGs, internal Services, proxy sidecars, and managed-service paths. Configuration, health, logging, image-delivery, and identity-control lines are documented in their focused views." }
    ],
    sections: [
      {
        title: "Public Request Path",
        html: `<ol><li>A client resolves one of seven <code>asmplus-demo.auritas.com</code> names to <code>34.36.209.159</code>.</li><li>The global external Application Load Balancer terminates TLS with <code>asmplus-demo-certificate-v2</code>.</li><li>Plain HTTP is permanently redirected to HTTPS by the GKE FrontendConfig.</li><li>GCE Ingress selects a backend by hostname.</li><li>The backend sends the request to a GKE Network Endpoint Group and then to a ready pod endpoint.</li></ol>`
      },
      {
        title: "Host Routing",
        html: `<table><thead><tr><th>Host class</th><th>Destinations</th></tr></thead><tbody>
          <tr><td>Web</td><td>Auth Portal, ASM+ Web, Document Viewer</td></tr>
          <tr><td>Core APIs</td><td>Auth API, ASM+ API</td></tr>
          <tr><td>Integration APIs</td><td>SAP API, SAP SuccessFactors API</td></tr>
          <tr><td>Internal only</td><td><code>asm-api</code> ClusterIP; not present in public Ingress</td></tr>
        </tbody></table>`
      },
      {
        title: "Private Service Paths",
        html: `<ul><li>Database-backed APIs connect to a sidecar on <code>127.0.0.1:5432</code>.</li><li>The sidecar opens the Cloud SQL connector path using private IP and Workload Identity.</li><li><code>asm-api</code> reaches GCS over the Google API endpoint using short-lived ADC credentials.</li><li>API-to-<code>asm-api</code> traffic remains inside Kubernetes through a ClusterIP Service.</li></ul>`
      },
      {
        title: "Cluster Addressing",
        html: `<p>The cluster is VPC-native. The observed Pod secondary range is <code>10.104.128.0/17</code>; the service range is <code>34.118.224.0/20</code>. Intra-node visibility is enabled. The cluster uses the regional <code>default</code> subnet in <code>us-east1</code>.</p>`
      },
      {
        title: "Current Network Controls",
        html: `<p>GKE-created firewall rules and the load-balancer health-check rule are present. The default VPC also retains broad default SSH, RDP, and ICMP rules. No Kubernetes NetworkPolicies were observed in the application namespace, and no FQDN network policy was enabled.</p>
        <div class="notice risk"><strong>Observed gaps.</strong> The deployment functions correctly, but workload east-west traffic is not restricted by namespace NetworkPolicy, and the default VPC has a broader firewall posture than a purpose-built application VPC. Any hardening change should be tested separately because it can interrupt Ingress, node, proxy, or GCS connectivity.</div>`
      }
    ]
  },
  {
    number: "8",
    slug: "08-security-architecture",
    shortTitle: "Security Architecture",
    title: "Security Architecture",
    summary: "Explains TLS, JWT and integration authentication, secret injection, Workload Identity, protected data paths, and the current security gaps observed in the deployment.",
    diagrams: [
      { file: "structurizr-08-security-architecture.svg", view: "08-security-architecture", title: "Identity, Secret, and Data Protection Controls", alt: "Security architecture diagram for ASM+", caption: "Figure 8. Authentication mechanisms, secret stores, Workload Identity mappings, and protected service boundaries." }
    ],
    sections: [
      {
        title: "Authentication and Authorization Controls",
        html: `<table><thead><tr><th>Boundary</th><th>Control</th></tr></thead><tbody>
          <tr><td>Browser and public APIs</td><td>HTTPS, JWT validation, application access, roles, folder capabilities, and service-user scope.</td></tr>
          <tr><td>Auth API</td><td>Password hashes with bcrypt, password policy, signed JWTs, and optional SSO adapters.</td></tr>
          <tr><td>Business APIs to storage API</td><td>Internal <code>X-Api-Key</code> plus license enforcement for protected writes.</td></tr>
          <tr><td>SAP integration</td><td>Basic Auth, ArchiveLink certificates, or trusted service key depending on route.</td></tr>
          <tr><td>SAP SuccessFactors integration</td><td>OAuth/JWT and SAML bearer support with managed-user public keys and repository restrictions.</td></tr>
        </tbody></table>`
      },
      {
        title: "Secrets",
        html: `<p>Secret values are excluded. The observed Kubernetes Secret <code>asmplus-runtime-secrets</code> contains these key names:</p>
        <p><code>ASM_API_KEY</code>, <code>AUTH_CLIENT_KEY</code>, <code>AUTH_SUPER_ADMIN_PASSWORD</code>, <code>JWT_SECRET</code>, <code>PGPASSWORD</code>, <code>SAP_BASIC_AUTH_USERS_JSON</code>, and <code>SF_MANAGED_USERS_JSON</code>.</p>
        <p>Five core Secret Manager objects were observed: <code>asm-api-key</code>, <code>auth-client-key-front-asm-plus</code>, <code>auth-jwt-secret</code>, <code>auth-superadmin-password</code>, and <code>postgres-password</code>. The architecture records the provisioning relationship without claiming automatic runtime synchronization.</p>`
      },
      {
        title: "Workload Identity and Keyless Access",
        html: `<table><thead><tr><th>Kubernetes service account</th><th>Google service account</th><th>Purpose</th></tr></thead><tbody>
          <tr><td><code>asm-api</code></td><td><code>asm-api-demo@sap-ecosystem-asmplus.iam.gserviceaccount.com</code></td><td>GCS object administration using ADC.</td></tr>
          <tr><td><code>cloudsql-client</code></td><td><code>asmplus-cloudsql-client@sap-ecosystem-asmplus.iam.gserviceaccount.com</code></td><td>Cloud SQL client access for proxy sidecars.</td></tr>
        </tbody></table>
        <p>The GKE metadata server supplies short-lived credentials. No JSON key is mounted, <code>GOOGLE_APPLICATION_CREDENTIALS</code> is not required, and the listed service-account keys were system-managed rather than user-managed.</p>`
      },
      {
        title: "Data Protection",
        html: `<ul><li>Public endpoints use an active Google-managed TLS certificate.</li><li>Cloud SQL has private IP only and requires encrypted connections.</li><li>Cloud SQL backups and seven-day PITR are enabled.</li><li>The GCS bucket enforces public access prevention and uniform bucket-level access.</li><li>GCS object access is granted through IAM to the ASM GSA, not a mounted key file.</li></ul>`
      },
      {
        title: "Observed Security Gaps",
        html: `<table><thead><tr><th>Observation</th><th>Risk / consequence</th></tr></thead><tbody>
          <tr><td>No namespace Role or RoleBinding was observed.</td><td>No application-specific Kubernetes RBAC boundary is documented at namespace level.</td></tr>
          <tr><td>No NetworkPolicy was observed.</td><td>Pod-to-pod traffic is not restricted by application policy.</td></tr>
          <tr><td>Application containers had no explicit <code>securityContext</code>.</td><td>Non-root, read-only filesystem, and dropped capabilities are not consistently enforced by manifests.</td></tr>
          <tr><td>GKE application-layer secret encryption state was <code>DECRYPTED</code>.</td><td>Kubernetes secrets are not protected with a customer-controlled application-layer key.</td></tr>
          <tr><td>Default VPC firewall rules remain.</td><td>The network perimeter is broader than a dedicated least-privilege VPC baseline.</td></tr>
        </tbody></table>
        <div class="notice risk"><strong>Change discipline.</strong> These are observations, not automatic remediation instructions. Security hardening should be applied in an isolated environment and validated against GKE health checks, Ingress, Cloud SQL, GCS, SAP ArchiveLink, SAP SuccessFactors, and SSO flows before production rollout.</div>`
      }
    ]
  },
  {
    number: "9",
    slug: "09-runtime-sequences",
    shortTitle: "Runtime / Sequence",
    title: "Runtime and Sequence Architecture",
    summary: "Walks through the principal interactive and integration flows: SSO, document upload, document viewing, SAP ArchiveLink writes, and SAP SuccessFactors writes.",
    diagrams: [
      { file: "structurizr-09a-runtime-sso.svg", view: "09a-runtime-sso", title: "SSO Login Flow", alt: "Dynamic diagram of ASM+ SSO login", caption: "Figure 9a. Browser redirection to Auth, credential exchange, token callback, and application API use." },
      { file: "structurizr-09b-runtime-upload.svg", view: "09b-runtime-upload", title: "Folder and Document Upload Flow", alt: "Dynamic diagram of ASM+ upload", caption: "Figure 9b. Metadata validation and persistence combined with internal GCS-backed object storage." },
      { file: "structurizr-09c-runtime-view.svg", view: "09c-runtime-view", title: "Document View Flow", alt: "Dynamic diagram of ASM+ document viewing", caption: "Figure 9c. Viewer access validation, metadata lookup, and ranged binary retrieval." },
      { file: "structurizr-09d-runtime-sap.svg", view: "09d-runtime-sap", title: "SAP ArchiveLink Write Flow", alt: "Dynamic diagram of SAP document write", caption: "Figure 9d. SAP authentication, object storage, and metadata persistence." },
      { file: "structurizr-09e-runtime-successfactors.svg", view: "09e-runtime-successfactors", title: "SAP SuccessFactors Token and Write Flow", alt: "Dynamic diagram of a SAP SuccessFactors document write", caption: "Figure 9e. Managed-user token issuance followed by repository-scoped document persistence." }
    ],
    sections: [
      {
        title: "SSO Login",
        html: `<ol><li>The ASM+ frontend redirects the browser to the Auth Portal with an encoded return URL.</li><li>The Auth Portal submits credentials or initiates an available federated flow.</li><li>The Auth API verifies identity and signs a JWT.</li><li>The browser returns to the ASM+ callback with the bounded token.</li><li>The frontend confirms application access and uses the token for ASM+ API requests.</li></ol>`
      },
      {
        title: "Folder Creation and Upload",
        html: `<ol><li>The user submits a folder or file operation from ASM+ Web.</li><li>ASM+ API validates JWT, application access, folder capability, and license requirements.</li><li>Metadata is read or written in Cloud SQL through the local proxy.</li><li>Binary content and manifests are delegated to <code>asm-api</code> with <code>X-Api-Key</code>.</li><li><code>asm-api</code> stores objects in GCS using ADC and generation preconditions.</li><li>The API returns identifiers and status to the frontend.</li></ol>
        <div class="notice warning"><strong>Operational dependency.</strong> A missing or invalid ASM license can block protected storage operations even when folder metadata and the UI are otherwise healthy.</div>`
      },
      {
        title: "Document Viewing",
        html: `<ol><li>ASM+ Web launches the Viewer with document context.</li><li>The Viewer validates or renews the Auth session and confirms application access.</li><li>The Viewer requests document metadata and content from ASM+ API or SAP API.</li><li>The domain API calls <code>asm-api</code> for the stored binary as needed.</li><li><code>asm-api</code> reads the GCS object and supports byte ranges for compatible clients.</li><li>The Viewer selects native browser rendering or the optional OnlyOffice path.</li></ol>`
      },
      {
        title: "SAP ArchiveLink Write",
        html: `<ol><li>SAP sends an ArchiveLink request to the SAP API public hostname.</li><li>The API validates Basic Auth, certificate, or service-key context.</li><li>The SAP API delegates object storage to <code>asm-api</code>.</li><li>The storage API writes the document object and manifest to GCS.</li><li>The SAP API maps repository/document information into Cloud SQL folders/files and returns the ArchiveLink response.</li></ol>`
      },
      {
        title: "SAP SuccessFactors Token and Write",
        html: `<ol><li>SAP SuccessFactors obtains a bounded token through the configured JWT/OAuth or SAML-bearer flow.</li><li>The SF API validates the managed user, public key, and allowed repository scope.</li><li>The document operation is delegated to <code>asm-api</code> for object storage.</li><li>The SF API persists repository, version, folder, and document metadata in Cloud SQL.</li><li>The integration response is returned to SAP SuccessFactors.</li></ol>`
      },
      {
        title: "Failure Boundaries",
        html: `<ul><li>Ingress readiness controls whether a pod receives new external traffic.</li><li>JWT, application access, folder permissions, integration credentials, internal API keys, and licenses fail at distinct layers.</li><li>A Cloud SQL proxy failure affects metadata operations for one API pod.</li><li>A GCS or Workload Identity failure affects object operations through <code>asm-api</code>.</li><li>Optional providers such as OnlyOffice, vector indexing, or enterprise SSO should not be assumed available when their runtime values are empty.</li></ul>`
      }
    ]
  },
  {
    number: "10",
    slug: "10-observability",
    shortTitle: "Observability",
    title: "Observability Architecture",
    summary: "Documents the health probes, logs, platform metrics, and monitoring coverage that exist today, together with the custom alerting and dashboard gaps still present.",
    diagrams: [
      { file: "structurizr-10-observability-architecture.svg", view: "10-observability-architecture", title: "Health, Logs, and Metrics", alt: "Observability architecture diagram for ASM+", caption: "Figure 10. Kubernetes probes and workload telemetry flow into GKE health management and Cloud Operations." }
    ],
    sections: [
      {
        title: "Health Probe Matrix",
        html: `<table><thead><tr><th>Deployment</th><th>Readiness</th><th>Liveness</th></tr></thead><tbody>
          <tr><td><code>api-asm-plus</code></td><td><code>/health/ready</code></td><td><code>/health/live</code></td></tr>
          <tr><td><code>api-auth</code></td><td><code>/health/db</code></td><td><code>/health</code></td></tr>
          <tr><td><code>api-sap</code></td><td><code>/health</code></td><td><code>/health</code></td></tr>
          <tr><td><code>api-sf</code></td><td><code>/health</code></td><td><code>/health</code></td></tr>
          <tr><td><code>asm-api</code></td><td><code>/ready</code></td><td><code>/health</code></td></tr>
          <tr><td><code>front-auth</code></td><td><code>/health</code></td><td><code>/health</code></td></tr>
          <tr><td><code>front-asm-plus</code></td><td><code>/health</code></td><td><code>/health</code></td></tr>
          <tr><td><code>front-viewer</code></td><td><code>/health</code></td><td><code>/health</code></td></tr>
        </tbody></table>`
      },
      {
        title: "Telemetry Present Today",
        html: `<ul><li>GKE system logging and workload logging are enabled.</li><li>Application and web-server stdout/stderr are collected by the platform.</li><li>Cloud SQL proxy sidecars emit structured logs.</li><li>GKE monitoring components and Managed Service for Prometheus are enabled.</li><li>Kubernetes Deployment and Pod status provide rollout and availability signals.</li><li>Backend health and ManagedCertificate status provide public-entry signals.</li></ul>`
      },
      {
        title: "Observed Monitoring Gaps",
        html: `<table><thead><tr><th>Capability</th><th>Observed state</th></tr></thead><tbody>
          <tr><td>Custom alert policies</td><td>None observed</td></tr>
          <tr><td>Custom dashboards</td><td>None observed</td></tr>
          <tr><td>Uptime checks</td><td>None observed</td></tr>
          <tr><td>Log-based metrics</td><td>None observed</td></tr>
          <tr><td>Notification channels</td><td>None observed</td></tr>
          <tr><td>Managed Prometheus automatic application monitoring</td><td>Scope reported as <code>NONE</code></td></tr>
          <tr><td>Cloud SQL Query Insights</td><td>Not verified as enabled in the live configuration</td></tr>
        </tbody></table>`
      },
      {
        title: "Operator Investigation Path",
        html: `<ol><li>Check Deployment readiness and recent rollouts in namespace <code>asm-plus-demo</code>.</li><li>Inspect Pod events before application logs when a container does not start.</li><li>Inspect both the application and <code>cloud-sql-proxy</code> containers for database-backed APIs.</li><li>Check Ingress backend health and certificate status for public availability issues.</li><li>Check Cloud SQL connections, CPU/storage, and backup state for metadata failures.</li><li>Check GCS IAM and <code>asm-api</code> logs for binary-operation failures.</li></ol>`
      },
      {
        title: "Recommended Monitoring Baseline",
        html: `<p class="status recommendation">Recommendation</p><ul><li>Create HTTPS uptime checks for the three frontends and health endpoints for the four public APIs.</li><li>Alert on Deployment unavailable replicas, repeated container restarts, and failed readiness probes.</li><li>Alert on load-balancer 5xx rate and latency, Cloud SQL CPU/connections/storage, backup failure, and GCS permission errors.</li><li>Create log-based metrics for authentication failures, license failures, internal API-key failures, and integration 5xx responses.</li><li>Configure notification channels and an operational ownership matrix before relying on alerts.</li><li>Define service-level objectives for login, document upload, document retrieval, SAP ArchiveLink integration, and SAP SuccessFactors integration.</li></ul>
        <div class="notice"><strong>Not applied.</strong> These recommendations are documentation only. No monitoring resources or alert policies were created during this work.</div>`
      }
    ]
  }
];

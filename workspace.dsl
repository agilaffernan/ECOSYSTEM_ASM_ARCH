workspace "ASM+ on Google Cloud" "Evidence-grounded architecture of the live sap-ecosystem-asmplus deployment, observed on 2026-08-11." {
    !identifiers flat

    model {
        businessUser = person "ASM+ User" "Creates folders, uploads files, searches content, and views documents." {
            tags "User"
        }
        platformAdmin = person "Platform Administrator" "Operates ASM+, Kubernetes, and Google Cloud resources." {
            tags "Administrator"
        }

        sapSystem = softwareSystem "SAP System" "Calls the SAP ArchiveLink-compatible interface for document storage and retrieval." {
            tags "External System,SAP Official"
        }
        salesforce = softwareSystem "Salesforce" "Calls the Salesforce document/repository integration and token endpoints." {
            tags "External System"
        }
        enterpriseIdp = softwareSystem "Enterprise Identity Provider" "Optional SAML or Microsoft identity provider supported by Auth; active provider configuration was not verified." {
            tags "Optional System"
        }
        corporateDns = softwareSystem "Auritas DNS" "Publishes seven A records under asmplus-demo.auritas.com." {
            tags "External Service"
        }

        cloudSql = softwareSystem "Cloud SQL for PostgreSQL" "Private PostgreSQL 18 instance asmplus-demo-postgres; database auritasdemo contains 23 application tables." {
            tags "Data Store,GCP Cloud SQL"
        }
        gcs = softwareSystem "Cloud Storage" "Private bucket sap-ecosystem-asmplus-asm-binaries stores document binaries and ASM manifests." {
            tags "Object Store,GCP Cloud Storage"
        }
        secretManager = softwareSystem "Secret Manager" "Stores the five observed core secret objects; secret values are not represented in this model." {
            tags "Secret Store,GCP Secret Manager"
        }
        artifactRegistry = softwareSystem "Artifact Registry" "Repository us-east1-docker.pkg.dev/sap-ecosystem-asmplus/asm-plus stores the deployed images." {
            tags "Artifact Store,GCP Artifact Registry"
        }
        cloudOperations = softwareSystem "Cloud Logging and Monitoring" "Receives GKE system/workload logs and platform metrics. No custom alert policies were observed." {
            tags "Observability,GCP Cloud Monitoring"
        }
        gkeHealth = softwareSystem "GKE Health Management" "Runs Kubernetes readiness and liveness probes and controls rollout availability." {
            tags "Platform Service,GCP GKE"
        }

        asmPlus = softwareSystem "ASM+" "Document management, authentication, viewing, and SAP/Salesforce integrations deployed on GKE." {
            tags "Core System"

            group "Web Experience" {
                frontAuth = container "Auth Portal" "Login, SSO, and access-administration web application." "React, Vite, NGINX" {
                    tags "Frontend"
                    faRuntime = component "Runtime Configuration Loader" "Loads API_BASE_URL and UI settings from runtime-config.js." "JavaScript" "Configuration"
                    faApp = component "Portal Application" "Routes login, users, roles, applications, structures, and connections pages." "React" "Frontend Component"
                    faAuthContext = component "Authentication and SSO Context" "Maintains the JWT/session state and coordinates local, SAML, and Microsoft flows." "React Context" "Security Component"
                    faApiClient = component "Auth API Client" "Calls authentication and administration endpoints." "Fetch/JSON" "API Client"
                }

                frontAsm = container "ASM+ Web Application" "Primary document, workflow, report, search, and administration UI." "React, Vite, Node static server" {
                    tags "Frontend"
                    fpRuntime = component "Runtime Configuration Loader" "Loads public endpoint URLs and feature switches from runtime-config.js." "JavaScript" "Configuration"
                    fpApp = component "Application Shell and Router" "Coordinates navigation, layouts, notifications, and error handling." "React" "Frontend Component"
                    fpAuth = component "Authentication Context" "Processes SSO callbacks, retains the JWT, and applies client-side authorization." "React Context" "Security Component"
                    fpDocuments = component "Document and Workflow UI" "Implements folders, files, recycle bin, workflows, reports, audit, and search experiences." "React" "Frontend Component"
                    fpApiClient = component "ASM+ API Client" "Calls the ASM+ API and notification/workflow endpoints." "Fetch/JSON and binary" "API Client"
                    fpViewerLink = component "Viewer URL Builder" "Launches the document viewer with the selected document context." "JavaScript" "Frontend Component"
                }

                viewer = container "Document Viewer" "Displays files retrieved from ASM+ or SAP integration endpoints." "React, Vite, Node static server" {
                    tags "Frontend"
                    vwRuntime = component "Runtime Configuration Loader" "Loads Auth, ASM+, SAP, and optional OnlyOffice endpoints." "JavaScript" "Configuration"
                    vwShell = component "Viewer Shell and Parameter Parser" "Validates route parameters and selects a viewer implementation." "React" "Frontend Component"
                    vwDocumentApi = component "Document API Client" "Retrieves metadata and binary content from ASM+ or SAP APIs." "Fetch/HTTP range" "API Client"
                    vwNative = component "Native Browser Viewer" "Renders supported non-Office content in the browser." "React" "Frontend Component"
                    vwOnlyOffice = component "OnlyOffice Adapter" "Optional Office document integration; endpoint is empty in the live configuration." "React, optional" "Frontend Component"
                }
            }

            group "Application APIs" {
                authApi = container "Auth API" "Authenticates users, issues JWTs, and administers applications, roles, structures, SSO, and access." "Node.js, TypeScript, Express; port 3000" {
                    tags "API"
                    auHttp = component "HTTP Routes and OpenAPI" "Exposes health, auth, users, roles, applications, structures, connections, directory, and access routes." "Express" "API Surface"
                    auAuth = component "Authentication and JWT Service" "Verifies password hashes, enforces password policy, and signs JWTs." "bcrypt, jsonwebtoken" "Security Component"
                    auAccess = component "Identity and Access Services" "Manages users, applications, roles, structures, service connections, and generic access." "TypeScript services" "Security Component"
                    auSso = component "SSO Adapter" "Stores SSO configuration and supports SAML and Microsoft identity flows." "node-saml, Microsoft integration" "Security Component"
                    auDb = component "PostgreSQL Adapter" "Reads and writes Auth and access-control tables." "pg" "Data Adapter"
                }

                apiPlus = container "ASM+ API" "Orchestrates document metadata, access, workflows, notifications, reports, audit, and binary operations." "Node.js, TypeScript, Express; port 3000" {
                    tags "API"
                    apHttp = component "Routes and Controllers" "Exposes file, folder, audit, workflow, report, RBAC, user, and metadata endpoints." "Express" "API Surface"
                    apAuth = component "JWT and Authorization Middleware" "Validates shared JWTs, role policy, folder capabilities, and service-user home scope." "jsonwebtoken" "Security Component"
                    apLicense = component "License Middleware" "Blocks licensed operations when the shared ASM license is not valid." "TypeScript middleware" "Security Component"
                    apDomain = component "Document and Access Services" "Coordinates folders, files, permissions, role groups, notifications, workflows, and audit." "TypeScript services"
                    apReporting = component "Search and Reporting Services" "Builds reports, durable summaries, and folder/search scopes." "TypeScript services" "Data Adapter"
                    apAsmClient = component "ASM Storage Client" "Delegates binary and manifest operations to asm-api with the internal API key." "HTTP, X-Api-Key" "API Client"
                    apDb = component "PostgreSQL Adapter" "Reads and writes the 23-table application schema." "pg" "Data Adapter"
                    apVector = component "Vector Integration Client" "Optional indexing/reindexing adapter; VECTOR_API_URL is empty in the live deployment." "HTTP, optional" "API Client"
                }

                apiSap = container "SAP API" "Provides SAP ArchiveLink-compatible document operations and SAP viewer launch support." "Node.js, TypeScript, Express; port 3020" {
                    tags "Integration API"
                    sapHttp = component "ArchiveLink HTTP Interface" "Exposes GET, PUT, and POST /api/sap plus health and administrative routes." "Express, raw/multipart HTTP" "API Surface"
                    sapAuth = component "SAP Authentication" "Validates Basic Auth, trusted service keys, and ArchiveLink certificates." "Basic Auth, X-Api-Key" "Security Component"
                    sapPersistence = component "SAP Metadata Persistence" "Maps SAP systems, repositories, documents, and components into folders/files." "pg" "Data Adapter"
                    sapViewer = component "Viewer Token and Redirect Service" "Creates bounded HMAC viewer tokens and redirects browser launches to the Viewer." "HMAC-SHA256" "Security Component"
                    sapAsmClient = component "ASM Storage Client" "Delegates binary and certificate storage to asm-api." "HTTP, X-Api-Key" "API Client"
                    sapAdmin = component "SAP Management UI and Services" "Provides service-user, license, and certificate administration endpoints." "Static UI and Express" "Frontend Component"
                    sapVector = component "Vector Integration Client" "Optional indexing adapter; VECTOR_API_URL is empty in the live deployment." "HTTP, optional" "API Client"
                }

                apiSf = container "Salesforce API" "Provides Salesforce repository/document operations and token issuance." "Node.js, TypeScript, Express; port 3030" {
                    tags "Integration API"
                    sfHttp = component "Salesforce Document Interface" "Exposes /api/sf document and repository operations." "Express, JSON and binary" "API Surface"
                    sfToken = component "OAuth and SAML Bearer Token Service" "Issues bounded access tokens and validates managed Salesforce users." "JWT, OAuth 2.0, SAML bearer" "Security Component"
                    sfUsers = component "Managed User Registry" "Manages Salesforce public keys and allowed repositories." "TypeScript service" "Security Component"
                    sfPersistence = component "Salesforce Metadata Persistence" "Maps Salesforce repositories, documents, versions, and folders into folders/files." "pg" "Data Adapter"
                    sfAsmClient = component "ASM Storage Client" "Delegates document and registry objects to asm-api." "HTTP, X-Api-Key" "API Client"
                    sfAdmin = component "Salesforce Management UI" "Provides managed-user and repository administration." "Static UI and Express" "Frontend Component"
                    sfVector = component "Vector Integration Client" "Optional indexing adapter; VECTOR_API_URL is empty in the live deployment." "HTTP, optional" "API Client"
                }
            }

            group "Storage Core" {
                asmApi = container "ASM Storage API" "Internal storage service for document components, manifests, licenses, and certificates." "Node.js, TypeScript, Express; port 3000" {
                    tags "Internal API"
                    asHttp = component "ASM HTTP Contract" "Implements GET, PUT, and POST on /api/asm plus health, readiness, license, and certificate routes." "Express, raw/multipart HTTP" "API Surface"
                    asKeyGuard = component "Internal API Key Guard" "Requires X-Api-Key for storage operations." "Express middleware" "Security Component"
                    asLicense = component "License Service" "Stores and validates the ASM license before write operations." "TypeScript service" "Security Component"
                    asCertificate = component "Certificate Store" "Stores and manages ArchiveLink certificates." "TypeScript service" "Security Component"
                    asDocument = component "Document and Manifest Service" "Maintains document manifests, versions, components, ranges, and optimistic concurrency." "TypeScript service" "Storage Adapter"
                    asStoragePort = component "Object Storage Abstraction" "Selects the configured storage provider and exposes a common object contract." "TypeScript adapter" "Storage Adapter"
                    asGcs = component "GCS Repository" "Uses @google-cloud/storage with Application Default Credentials and generation preconditions." "Google Cloud Storage client" "Storage Adapter,GCP Cloud Storage"
                }
            }

            runtimeConfig = container "Runtime Configuration" "Non-secret environment configuration supplied by Kubernetes ConfigMaps." "Kubernetes ConfigMaps" {
                tags "Configuration,Kubernetes"
            }
            runtimeSecrets = container "Runtime Secrets" "Namespace-scoped secret containing the seven keys observed in the live deployment; values are not modeled." "Kubernetes Opaque Secret" {
                tags "Secret Store,Kubernetes"
            }
        }

        businessUser -> asmPlus "Uses document management and viewing capabilities" "HTTPS"
        platformAdmin -> asmPlus "Administers application access and operations" "HTTPS and kubectl"
        sapSystem -> asmPlus "Stores and retrieves SAP documents" "ArchiveLink over HTTPS"
        salesforce -> asmPlus "Stores and retrieves Salesforce documents" "REST over HTTPS"
        asmPlus -> cloudSql "Stores application metadata" "PostgreSQL"
        asmPlus -> gcs "Stores document binaries and manifests" "GCS JSON API over HTTPS"
        asmPlus -> cloudOperations "Emits workload logs and metrics" "Cloud Operations agents"
        artifactRegistry -> asmPlus "Supplies eight deployment images" "OCI image pull"
        corporateDns -> asmPlus "Resolves seven public hostnames to 34.36.209.159" "DNS A records"

        businessUser -> frontAsm "Uses the main application" "HTTPS" "Public HTTPS"
        businessUser -> frontAuth "Signs in and manages a profile" "HTTPS" "Public HTTPS"
        businessUser -> viewer "Views document content" "HTTPS" "Public HTTPS"
        platformAdmin -> frontAuth "Administers users, roles, applications, structures, and connections" "HTTPS" "Public HTTPS"
        platformAdmin -> cloudOperations "Inspects logs, metrics, and workload health" "Google Cloud Console and gcloud" "Operations"

        sapSystem -> apiSap "Performs ArchiveLink operations" "HTTPS, Basic Auth or certificate" "Public HTTPS"
        salesforce -> apiSf "Requests tokens and performs repository/document operations" "HTTPS, OAuth/JWT" "Public HTTPS"
        enterpriseIdp -> authApi "Provides optional federated identity assertions" "SAML 2.0 or Microsoft identity" "Optional"

        frontAuth -> authApi "Authenticates users and administers identity/access data" "HTTPS/JSON" "Public HTTPS"
        frontAsm -> frontAuth "Redirects the browser to the SSO portal" "HTTPS" "Authentication"
        frontAsm -> authApi "Authenticates and checks application access" "HTTPS/JSON, JWT" "Public HTTPS"
        frontAsm -> apiPlus "Performs document, workflow, report, search, and audit operations" "HTTPS/JSON and binary" "Public HTTPS"
        frontAsm -> viewer "Launches the selected document" "HTTPS" "Public HTTPS"
        viewer -> frontAuth "Redirects the browser to SSO when a session is absent" "HTTPS" "Authentication"
        viewer -> authApi "Validates authentication and application access" "HTTPS/JSON, JWT" "Public HTTPS"
        viewer -> apiPlus "Retrieves ASM+ metadata and file content" "HTTPS/JSON and HTTP range" "Public HTTPS"
        viewer -> apiSap "Retrieves SAP-origin document components" "HTTPS/ArchiveLink" "Public HTTPS"
        apiSap -> viewer "Redirects browser-origin SAP launch requests" "HTTPS with bounded viewer token" "Public HTTPS"

        apiPlus -> asmApi "Reads and writes document objects, manifests, licenses, and certificates" "HTTP/REST, X-Api-Key" "Internal HTTP"
        apiSap -> asmApi "Reads and writes SAP document objects and certificates" "HTTP/REST, X-Api-Key" "Internal HTTP"
        apiSf -> asmApi "Reads and writes Salesforce document and registry objects" "HTTP/REST, X-Api-Key" "Internal HTTP"

        authApi -> cloudSql "Reads and writes identity and access tables through a local Cloud SQL Auth Proxy" "PostgreSQL on 127.0.0.1:5432" "Database"
        apiPlus -> cloudSql "Reads and writes document metadata, RBAC, workflow, audit, and reporting tables through a local proxy" "PostgreSQL on 127.0.0.1:5432" "Database"
        apiSap -> cloudSql "Persists SAP document hierarchy and metadata through a local proxy" "PostgreSQL on 127.0.0.1:5432" "Database"
        apiSf -> cloudSql "Persists Salesforce document hierarchy and metadata through a local proxy" "PostgreSQL on 127.0.0.1:5432" "Database"
        asmApi -> gcs "Stores and retrieves binaries, manifests, licenses, and certificates using ADC" "GCS API over HTTPS" "Object Storage"

        secretManager -> runtimeSecrets "Provides approved core secret material during provisioning" "Administrative provisioning path" "Secret Provisioning"
        runtimeConfig -> frontAuth "Injects non-secret runtime configuration" "Environment variables" "Configuration"
        runtimeConfig -> frontAsm "Injects non-secret runtime configuration" "Environment variables" "Configuration"
        runtimeConfig -> viewer "Injects non-secret runtime configuration" "Environment variables" "Configuration"
        runtimeConfig -> authApi "Injects non-secret runtime configuration" "Environment variables" "Configuration"
        runtimeConfig -> apiPlus "Injects non-secret runtime configuration" "Environment variables" "Configuration"
        runtimeConfig -> apiSap "Injects non-secret runtime configuration" "Environment variables" "Configuration"
        runtimeConfig -> apiSf "Injects non-secret runtime configuration" "Environment variables" "Configuration"
        runtimeConfig -> asmApi "Selects GCP/GCS and supplies bucket/project configuration" "Environment variables" "Configuration"

        runtimeSecrets -> authApi "Injects database, JWT, superadmin, and client-key secrets" "Environment variables" "Secret Injection"
        runtimeSecrets -> apiPlus "Injects database, JWT, internal API, and optional vector secrets" "Environment variables" "Secret Injection"
        runtimeSecrets -> apiSap "Injects database, JWT, internal API, and SAP user secrets" "Environment variables" "Secret Injection"
        runtimeSecrets -> apiSf "Injects database, internal API, Salesforce user, and optional vector secrets" "Environment variables" "Secret Injection"
        runtimeSecrets -> asmApi "Injects the internal ASM API key" "Environment variables" "Secret Injection"
        runtimeSecrets -> frontAsm "Injects the Auth client key" "Environment variable" "Secret Injection"

        frontAuth -> cloudOperations "Writes web-server logs" "stdout/stderr" "Telemetry"
        frontAsm -> cloudOperations "Writes web-server logs" "stdout/stderr" "Telemetry"
        viewer -> cloudOperations "Writes web-server logs" "stdout/stderr" "Telemetry"
        authApi -> cloudOperations "Writes structured/application logs" "stdout/stderr" "Telemetry"
        apiPlus -> cloudOperations "Writes application logs" "stdout/stderr" "Telemetry"
        apiSap -> cloudOperations "Writes trace-aware integration logs" "stdout/stderr" "Telemetry"
        apiSf -> cloudOperations "Writes structured integration logs" "stdout/stderr" "Telemetry"
        asmApi -> cloudOperations "Writes storage request and health logs" "stdout/stderr" "Telemetry"

        gkeHealth -> frontAuth "Checks /health" "HTTP" "Health Check"
        gkeHealth -> frontAsm "Checks /health" "HTTP" "Health Check"
        gkeHealth -> viewer "Checks /health" "HTTP" "Health Check"
        gkeHealth -> authApi "Checks /health and /health/db" "HTTP" "Health Check"
        gkeHealth -> apiPlus "Checks /health/live and /health/ready" "HTTP" "Health Check"
        gkeHealth -> apiSap "Checks /health" "HTTP" "Health Check"
        gkeHealth -> apiSf "Checks /health" "HTTP" "Health Check"
        gkeHealth -> asmApi "Checks /health and /ready" "HTTP" "Health Check"

        faRuntime -> runtimeConfig "Reads startup configuration"
        faApp -> faAuthContext "Uses"
        faApp -> faApiClient "Uses"
        faAuthContext -> faApiClient "Authenticates through"
        faApiClient -> authApi "Calls" "HTTPS/JSON"

        fpRuntime -> runtimeConfig "Reads startup configuration"
        fpApp -> fpAuth "Uses"
        fpApp -> fpDocuments "Hosts"
        fpDocuments -> fpApiClient "Uses"
        fpDocuments -> fpViewerLink "Uses"
        fpAuth -> authApi "Authenticates and checks access" "HTTPS/JSON"
        fpApiClient -> apiPlus "Calls" "HTTPS/JSON and binary"
        fpViewerLink -> viewer "Launches" "HTTPS"

        vwRuntime -> runtimeConfig "Reads startup configuration"
        vwShell -> vwDocumentApi "Uses"
        vwShell -> vwNative "Selects for supported content"
        vwShell -> vwOnlyOffice "Selects when configured"
        vwDocumentApi -> apiPlus "Reads ASM+ documents" "HTTPS/JSON and range"
        vwDocumentApi -> apiSap "Reads SAP documents" "HTTPS/ArchiveLink"

        auHttp -> auAuth "Delegates authentication"
        auHttp -> auAccess "Delegates administration and access"
        auHttp -> auSso "Delegates SSO operations"
        auAuth -> auDb "Reads users and writes login state"
        auAccess -> auDb "Reads and writes access data"
        auSso -> auDb "Reads and writes SSO configuration"
        auSso -> enterpriseIdp "Exchanges assertions when configured" "SAML/Microsoft"
        auDb -> cloudSql "Queries" "PostgreSQL"

        apHttp -> apAuth "Applies authentication and authorization"
        apHttp -> apLicense "Applies license checks"
        apHttp -> apDomain "Delegates document and access operations"
        apHttp -> apReporting "Delegates search and reports"
        apAuth -> apDb "Loads authorization context"
        apDomain -> apDb "Reads and writes metadata"
        apDomain -> apAsmClient "Reads and writes binary objects"
        apReporting -> apDb "Queries and writes durable summaries"
        apReporting -> apAsmClient "Reads source objects when required"
        apLicense -> apAsmClient "Checks the shared ASM license"
        apAsmClient -> asmApi "Calls" "HTTP, X-Api-Key"
        apDb -> cloudSql "Queries" "PostgreSQL"

        sapHttp -> sapAuth "Authenticates requests"
        sapHttp -> sapPersistence "Persists successful operations"
        sapHttp -> sapViewer "Creates browser redirects when applicable"
        sapHttp -> sapAsmClient "Delegates document operations"
        sapPersistence -> cloudSql "Queries" "PostgreSQL"
        sapAsmClient -> asmApi "Calls" "HTTP, X-Api-Key"
        sapViewer -> viewer "Redirects" "HTTPS"
        sapAdmin -> sapAsmClient "Stores managed objects"

        sfHttp -> sfToken "Validates access tokens"
        sfHttp -> sfPersistence "Persists successful operations"
        sfHttp -> sfAsmClient "Delegates document operations"
        sfToken -> sfUsers "Validates managed users and keys"
        sfUsers -> sfAsmClient "Stores or reads the managed-user registry"
        sfPersistence -> cloudSql "Queries" "PostgreSQL"
        sfAsmClient -> asmApi "Calls" "HTTP, X-Api-Key"
        sfAdmin -> sfUsers "Manages"

        asHttp -> asKeyGuard "Authenticates storage requests"
        asKeyGuard -> asLicense "Requires a valid license for writes"
        asKeyGuard -> asDocument "Authorizes document operations"
        asHttp -> asCertificate "Delegates certificate administration"
        asLicense -> asStoragePort "Stores and reads the license"
        asCertificate -> asStoragePort "Stores and reads certificates"
        asDocument -> asStoragePort "Stores and reads document objects and manifests"
        asStoragePort -> asGcs "Selects when BTP_HYPERSCALER=GCP"
        asGcs -> gcs "Uses Application Default Credentials" "GCS API over HTTPS"

        live = deploymentEnvironment "Live GCP" {
            dnsNode = deploymentNode "Auritas DNS Provider" "External DNS authority for auritas.com." "Corporate DNS" {
                tags "External Network"
                dnsInstance = softwareSystemInstance corporateDns
            }

            gcpProject = deploymentNode "GCP Project: sap-ecosystem-asmplus" "Live ASM+ Google Cloud project." "Google Cloud" {
                tags "Cloud Boundary"

                defaultVpc = deploymentNode "VPC: default" "Regional default subnet in us-east1; VPC-native Pod IP aliases." "Google Cloud VPC" {
                    tags "Network,GCP Network"
                    managedCert = infrastructureNode "Managed Certificate" "Active certificate asmplus-demo-certificate-v2 for all seven hostnames." "GKE ManagedCertificate" {
                        tags "Certificate,GCP Certificate"
                    }
                    loadBalancer = infrastructureNode "Global External Application Load Balancer" "Static IPv4 34.36.209.159; HTTP redirects permanently to HTTPS." "GCE Ingress, FrontendConfig" {
                        tags "Load Balancer,GCP Load Balancing"
                    }

                    gkeCluster = deploymentNode "GKE: asmplus-demo-gke" "Zonal Standard cluster in us-east1-b; release channel Regular; Workload Identity enabled." "GKE 1.35.6" {
                        tags "Kubernetes Cluster,GCP GKE"
                        nodePool = deploymentNode "Node pool: default-pool" "Three observed e2-medium nodes with autoscaling configured at the node-pool level." "COS_CONTAINERD" {
                            tags "Compute,GCP GKE"
                            kubelet = infrastructureNode "Kubelet and containerd" "Pulls images, runs containers, reports logs and metrics." "GKE node runtime" {
                                tags "Kubernetes"
                            }
                            namespaceNode = deploymentNode "Namespace: asm-plus-demo" "Helm release asm-plus-demo." "Kubernetes namespace" {
                                tags "Namespace,Helm Official"
                                helmRelease = infrastructureNode "Helm Release: asm-plus-demo" "Renders and manages the ASM+ Kubernetes resources from the ecosystem chart and GCP values files." "Helm" {
                                    tags "Helm Official"
                                }
                                configInstance = containerInstance runtimeConfig
                                secretsInstance = containerInstance runtimeSecrets

                                frontAuthPod = deploymentNode "front-auth Pod" "One replica; ClusterIP service port 80; NEG-backed public hostname." "Kubernetes Pod" {
                                    tags "Kubernetes"
                                    frontAuthInstance = containerInstance frontAuth
                                }
                                frontAsmPod = deploymentNode "front-asm-plus Pod" "One replica; ClusterIP service port 8080; NEG-backed public hostname." "Kubernetes Pod" {
                                    tags "Kubernetes"
                                    frontAsmInstance = containerInstance frontAsm
                                }
                                viewerPod = deploymentNode "front-viewer Pod" "One replica; ClusterIP service port 8080; NEG-backed public hostname." "Kubernetes Pod" {
                                    tags "Kubernetes"
                                    viewerInstance = containerInstance viewer
                                }
                                authApiPod = deploymentNode "api-auth Pod" "One application container plus one Cloud SQL Auth Proxy sidecar." "Kubernetes Pod" {
                                    tags "Kubernetes"
                                    authApiInstance = containerInstance authApi
                                    authProxy = infrastructureNode "Cloud SQL Auth Proxy" "Uses private IP and cloudsql-client Workload Identity." "cloud-sql-proxy 2.14.1" {
                                        tags "GCP Cloud SQL"
                                    }
                                }
                                apiPlusPod = deploymentNode "api-asm-plus Pod" "One application container plus one Cloud SQL Auth Proxy sidecar." "Kubernetes Pod" {
                                    tags "Kubernetes"
                                    apiPlusInstance = containerInstance apiPlus
                                    plusProxy = infrastructureNode "Cloud SQL Auth Proxy" "Uses private IP and cloudsql-client Workload Identity." "cloud-sql-proxy 2.14.1" {
                                        tags "GCP Cloud SQL"
                                    }
                                }
                                apiSapPod = deploymentNode "api-sap Pod" "One application container plus one Cloud SQL Auth Proxy sidecar." "Kubernetes Pod" {
                                    tags "Kubernetes"
                                    apiSapInstance = containerInstance apiSap
                                    sapProxy = infrastructureNode "Cloud SQL Auth Proxy" "Uses private IP and cloudsql-client Workload Identity." "cloud-sql-proxy 2.14.1" {
                                        tags "GCP Cloud SQL"
                                    }
                                }
                                apiSfPod = deploymentNode "api-sf Pod" "One application container plus one Cloud SQL Auth Proxy sidecar." "Kubernetes Pod" {
                                    tags "Kubernetes"
                                    apiSfInstance = containerInstance apiSf
                                    sfProxy = infrastructureNode "Cloud SQL Auth Proxy" "Uses private IP and cloudsql-client Workload Identity." "cloud-sql-proxy 2.14.1" {
                                        tags "GCP Cloud SQL"
                                    }
                                }
                                asmApiPod = deploymentNode "asm-api Pod" "One replica using KSA asm-api mapped to GSA asm-api-demo." "Kubernetes Pod" {
                                    tags "Kubernetes"
                                    asmApiInstance = containerInstance asmApi
                                    asmIdentity = infrastructureNode "Workload Identity / GKE metadata server" "Provides short-lived Application Default Credentials; no JSON key is mounted." "GKE Workload Identity Federation" {
                                        tags "GCP Workload Identity"
                                    }
                                }
                            }
                        }
                    }

                    sqlNode = deploymentNode "Cloud SQL: asmplus-demo-postgres" "Private address 10.61.176.3; zonal db-g1-small; PostgreSQL 18; backups and 7-day PITR enabled." "Cloud SQL" {
                        tags "Managed Data,GCP Cloud SQL"
                        sqlInstance = softwareSystemInstance cloudSql
                    }
                }

                storageNode = deploymentNode "Cloud Storage: sap-ecosystem-asmplus-asm-binaries" "Regional private bucket with uniform access and public access prevention." "Google Cloud Storage" {
                    tags "Managed Data,GCP Cloud Storage"
                    gcsInstance = softwareSystemInstance gcs
                }
                secretsNode = deploymentNode "Secret Manager" "Five observed core secret objects; Kubernetes secret also contains SAP/SF managed-user JSON." "Google Secret Manager" {
                    tags "Managed Security,GCP Secret Manager"
                    secretManagerInstance = softwareSystemInstance secretManager
                }
                artifactsNode = deploymentNode "Artifact Registry: asm-plus" "Eight actively deployed image repositories/tags." "Artifact Registry" {
                    tags "Managed Delivery,GCP Artifact Registry"
                    artifactInstance = softwareSystemInstance artifactRegistry
                }
                operationsNode = deploymentNode "Cloud Operations" "GKE workload/system logging, platform metrics, and Managed Service for Prometheus enabled." "Cloud Logging and Monitoring" {
                    tags "Managed Operations,GCP Cloud Monitoring"
                    operationsInstance = softwareSystemInstance cloudOperations
                    healthInstance = softwareSystemInstance gkeHealth
                }
            }

            dnsInstance -> loadBalancer "Resolves all public hostnames" "DNS A records"
            managedCert -> loadBalancer "Provides TLS certificate" "Google-managed TLS"
            loadBalancer -> frontAuthInstance "Routes auth.asmplus-demo.auritas.com" "HTTPS to NEG port 80"
            loadBalancer -> authApiInstance "Routes api-auth.asmplus-demo.auritas.com" "HTTPS to NEG port 3000"
            loadBalancer -> frontAsmInstance "Routes app.asmplus-demo.auritas.com" "HTTPS to NEG port 8080"
            loadBalancer -> apiPlusInstance "Routes api-asm-plus.asmplus-demo.auritas.com" "HTTPS to NEG port 3000"
            loadBalancer -> viewerInstance "Routes viewer.asmplus-demo.auritas.com" "HTTPS to NEG port 8080"
            loadBalancer -> apiSapInstance "Routes api-sap.asmplus-demo.auritas.com" "HTTPS to NEG port 3020"
            loadBalancer -> apiSfInstance "Routes api-sf.asmplus-demo.auritas.com" "HTTPS to NEG port 3030"

            authApiInstance -> authProxy "Connects to localhost:5432" "PostgreSQL"
            apiPlusInstance -> plusProxy "Connects to localhost:5432" "PostgreSQL"
            apiSapInstance -> sapProxy "Connects to localhost:5432" "PostgreSQL"
            apiSfInstance -> sfProxy "Connects to localhost:5432" "PostgreSQL"
            authProxy -> sqlInstance "Creates a private encrypted connector channel" "Cloud SQL Connector"
            plusProxy -> sqlInstance "Creates a private encrypted connector channel" "Cloud SQL Connector"
            sapProxy -> sqlInstance "Creates a private encrypted connector channel" "Cloud SQL Connector"
            sfProxy -> sqlInstance "Creates a private encrypted connector channel" "Cloud SQL Connector"
            asmApiInstance -> asmIdentity "Obtains short-lived credentials" "GKE metadata server"
            asmIdentity -> gcsInstance "Authorizes object administration" "Workload Identity, roles/storage.objectAdmin"
            kubelet -> artifactInstance "Pulls OCI images" "HTTPS"
        }
    }

    views {
        systemContext asmPlus "01-system-context" "ASM+ users, integrations, and managed service dependencies." {
            title "1. System Context"
            include businessUser platformAdmin asmPlus sapSystem salesforce enterpriseIdp corporateDns cloudSql gcs cloudOperations
            autoLayout lr 300 220
        }

        container asmPlus "02-container-microservices" "The eight deployed workloads and their principal runtime dependencies." {
            title "2. Container and Microservices Architecture"
            include businessUser sapSystem salesforce frontAuth frontAsm viewer authApi apiPlus apiSap apiSf asmApi runtimeConfig runtimeSecrets cloudSql gcs
            autoLayout lr 300 220
        }

        component asmApi "03a-component-asm-api" "Internal structure of asm-api and its GCS adapter." {
            title "3A. Component Architecture - ASM Storage API"
            include *
            autoLayout lr 260 180
        }
        component apiPlus "03b-component-api-asm-plus" "Internal structure of the ASM+ orchestration API." {
            title "3B. Component Architecture - ASM+ API"
            include *
            autoLayout lr 260 180
        }
        component authApi "03c-component-api-auth" "Internal structure of the Auth API." {
            title "3C. Component Architecture - Auth API"
            include *
            autoLayout lr 260 180
        }
        component apiSap "03d-component-api-sap" "Internal structure of the SAP ArchiveLink integration." {
            title "3D. Component Architecture - SAP API"
            include *
            autoLayout lr 260 180
        }
        component apiSf "03e-component-api-sf" "Internal structure of the Salesforce integration." {
            title "3E. Component Architecture - Salesforce API"
            include *
            autoLayout lr 260 180
        }
        component frontAsm "03f-component-front-asm-plus" "Internal structure of the main ASM+ web application." {
            title "3F. Component Architecture - ASM+ Web Application"
            include *
            autoLayout lr 260 180
        }
        component frontAuth "03g-component-front-auth" "Internal structure of the Auth Portal." {
            title "3G. Component Architecture - Auth Portal"
            include *
            autoLayout lr 260 180
        }
        component viewer "03h-component-front-viewer" "Internal structure of the Document Viewer." {
            title "3H. Component Architecture - Document Viewer"
            include *
            autoLayout lr 260 180
        }

        container asmPlus "04-api-integration" "Public APIs, internal service calls, protocols, and external integrations." {
            title "4. API and Integration Architecture"
            include businessUser sapSystem salesforce enterpriseIdp frontAuth frontAsm viewer authApi apiPlus apiSap apiSf asmApi
            autoLayout lr 320 220
        }

        container asmPlus "05-data-architecture" "Metadata persistence and binary object flows." {
            title "5. Data Architecture"
            include authApi apiPlus apiSap apiSf asmApi cloudSql gcs
            autoLayout lr 320 240
        }

        deployment * live "06-deployment-architecture" "Physical deployment of ASM+ in the live Google Cloud project." {
            title "6. Deployment Architecture"
            include *
            autoLayout lr 320 240
        }

        deployment * live "07-network-architecture" "Public ingress, VPC, GKE services, sidecars, and private managed-service paths." {
            title "7. Network Architecture"
            include dnsInstance managedCert loadBalancer frontAuthInstance frontAsmInstance viewerInstance authApiInstance authProxy apiPlusInstance plusProxy apiSapInstance sapProxy apiSfInstance sfProxy asmApiInstance sqlInstance gcsInstance
            autoLayout lr 380 280
        }

        container asmPlus "08-security-architecture" "Authentication, secret injection, Workload Identity, TLS, and protected data paths." {
            title "8. Security Architecture"
            include businessUser platformAdmin enterpriseIdp frontAuth frontAsm viewer authApi apiPlus apiSap apiSf asmApi runtimeSecrets secretManager cloudSql gcs
            autoLayout lr 340 240
        }

        dynamic asmPlus "09a-runtime-sso" "Interactive SSO login and callback flow." {
            title "9A. Runtime Sequence - SSO Login"
            businessUser -> frontAsm "Opens the application"
            frontAsm -> frontAuth "Redirects to /sso with callback URL"
            businessUser -> frontAuth "Submits credentials or starts configured federation"
            frontAuth -> authApi "Authenticates and requests an application token"
            authApi -> cloudSql "Validates user and application access"
            businessUser -> frontAsm "Returns to /sso/callback with the token"
            frontAsm -> authApi "Loads identity and access context"
            autoLayout lr 280 180
        }

        dynamic asmPlus "09b-runtime-upload" "Folder creation and document upload flow." {
            title "9B. Runtime Sequence - Upload a Document"
            businessUser -> frontAsm "Selects a folder and uploads a file"
            frontAsm -> apiPlus "Creates metadata and sends file content"
            apiPlus -> cloudSql "Checks folder access and records metadata/audit data"
            apiPlus -> asmApi "Writes the document component and manifest"
            asmApi -> gcs "Stores the binary and manifest using ADC"
            apiPlus -> cloudSql "Finalizes file status and workflow data"
            autoLayout lr 280 180
        }

        dynamic asmPlus "09c-runtime-view" "Open and render a document flow." {
            title "9C. Runtime Sequence - View a Document"
            businessUser -> frontAsm "Chooses a document"
            frontAsm -> viewer "Launches the Viewer with document context"
            viewer -> authApi "Validates the user/application session"
            viewer -> apiPlus "Requests metadata and binary content"
            apiPlus -> asmApi "Requests the stored component"
            asmApi -> gcs "Streams the object, including HTTP range support"
            autoLayout lr 280 180
        }

        dynamic asmPlus "09d-runtime-sap" "SAP ArchiveLink document write flow." {
            title "9D. Runtime Sequence - SAP ArchiveLink Write"
            sapSystem -> apiSap "Sends PUT or multipart POST /api/sap"
            apiSap -> asmApi "Writes the component with the trusted internal key"
            asmApi -> gcs "Stores the binary and manifest"
            apiSap -> cloudSql "Persists the SAP system/repository/document hierarchy"
            autoLayout lr 280 180
        }

        dynamic asmPlus "09e-runtime-salesforce" "Salesforce token and document write flow." {
            title "9E. Runtime Sequence - Salesforce Write"
            salesforce -> apiSf "Requests a token and submits a document operation"
            apiSf -> asmApi "Writes the document or managed-user registry object"
            asmApi -> gcs "Stores the binary and manifest"
            apiSf -> cloudSql "Persists repository, folder, document, and version metadata"
            autoLayout lr 280 180
        }

        container asmPlus "10-observability-architecture" "Health probes, workload logs, platform metrics, and the current monitoring boundary." {
            title "10. Observability Architecture"
            include platformAdmin gkeHealth frontAuth frontAsm viewer authApi apiPlus apiSap apiSf asmApi cloudOperations
            autoLayout lr 340 220
        }

        styles {
            element "Element" {
                color #172033
                background #FFFFFF
                stroke #64748B
                strokeWidth 2
                fontSize 24
            }
            element "User" {
                shape Person
                icon "assets/icons/user.svg"
                background #2563EB
                color #FFFFFF
                stroke #1D4ED8
            }
            element "Administrator" {
                shape Person
                icon "assets/icons/user.svg"
                background #334155
                color #FFFFFF
                stroke #1E293B
            }
            element "Core System" {
                shape RoundedBox
                icon "assets/icons/system.svg"
                background #B91C1C
                color #FFFFFF
                stroke #991B1B
            }
            element "Frontend" {
                shape WebBrowser
                icon "assets/icons/frontend.svg"
                background #2563EB
                color #FFFFFF
                stroke #1D4ED8
            }
            element "API" {
                shape Hexagon
                icon "assets/icons/api.svg"
                background #0F766E
                color #FFFFFF
                stroke #115E59
            }
            element "Integration API" {
                shape Hexagon
                icon "assets/icons/api.svg"
                background #B45309
                color #FFFFFF
                stroke #92400E
            }
            element "Internal API" {
                shape Hexagon
                icon "assets/icons/api.svg"
                background #7C3AED
                color #FFFFFF
                stroke #6D28D9
            }
            element "Data Store" {
                shape Cylinder
                icon "assets/icons/database.svg"
                background #166534
                color #FFFFFF
                stroke #14532D
            }
            element "Object Store" {
                shape Cylinder
                icon "assets/icons/object-storage.svg"
                background #047857
                color #FFFFFF
                stroke #065F46
            }
            element "Secret Store" {
                shape Cylinder
                icon "assets/icons/security.svg"
                background #9F1239
                color #FFFFFF
                stroke #881337
            }
            element "Configuration" {
                shape Folder
                icon "assets/icons/configuration.svg"
                background #E2E8F0
                color #172033
                stroke #64748B
            }
            element "Artifact Store" {
                shape Box
                icon "assets/icons/package.svg"
                background #475569
                color #FFFFFF
                stroke #334155
            }
            element "Observability" {
                shape Pipe
                icon "assets/icons/observability.svg"
                background #0369A1
                color #FFFFFF
                stroke #075985
            }
            element "Platform Service" {
                shape Box
                icon "assets/icons/observability.svg"
                background #0E7490
                color #FFFFFF
                stroke #155E75
            }
            element "External System" {
                shape Box
                icon "assets/icons/network.svg"
                background #F59E0B
                color #172033
                stroke #B45309
            }
            element "Optional System" {
                shape Box
                icon "assets/icons/network.svg"
                background #F8FAFC
                color #475569
                stroke #94A3B8
                opacity 70
            }
            element "External Service" {
                shape Box
                icon "assets/icons/network.svg"
                background #E2E8F0
                color #172033
                stroke #64748B
            }
            element "Component" {
                shape Component
                icon "assets/icons/component.svg"
                background #F8FAFC
                color #172033
                stroke #64748B
            }
            element "Frontend Component" {
                icon "assets/icons/frontend.svg"
            }
            element "API Surface" {
                icon "assets/icons/api.svg"
            }
            element "API Client" {
                icon "assets/icons/api.svg"
            }
            element "Data Adapter" {
                icon "assets/icons/database.svg"
            }
            element "Storage Adapter" {
                icon "assets/icons/object-storage.svg"
            }
            element "Security Component" {
                icon "assets/icons/security.svg"
            }
            element "Deployment Node" {
                background #F8FAFC
                color #172033
                stroke #64748B
            }
            element "Infrastructure Node" {
                shape Box
                background #E2E8F0
                color #172033
                stroke #475569
            }
            element "Load Balancer" {
                shape Hexagon
                icon "assets/icons/network.svg"
                background #2563EB
                color #FFFFFF
                stroke #1D4ED8
            }
            element "Certificate" {
                shape Box
                icon "assets/icons/security.svg"
                background #9F1239
                color #FFFFFF
                stroke #881337
            }
            element "SAP Official" {
                icon "assets/icons/vendors/sap.svg"
                background #FFFFFF
                color #172033
                stroke #0070B1
            }
            element "Kubernetes" {
                icon "assets/icons/vendors/kubernetes.svg"
                background #FFFFFF
                color #172033
                stroke #326CE5
            }
            element "Helm Official" {
                icon "assets/icons/vendors/helm.svg"
                background #FFFFFF
                color #172033
                stroke #0F1689
            }
            element "GCP Cloud Storage" {
                icon "assets/icons/vendors/gcp-cloud-storage.svg"
                background #FFFFFF
                color #172033
                stroke #4285F4
            }
            element "GCP Cloud SQL" {
                icon "assets/icons/vendors/gcp-cloud-sql.svg"
                background #FFFFFF
                color #172033
                stroke #4285F4
            }
            element "GCP GKE" {
                icon "assets/icons/vendors/gcp-gke.svg"
                background #FFFFFF
                color #172033
                stroke #4285F4
            }
            element "GCP Artifact Registry" {
                icon "assets/icons/vendors/gcp-artifact-registry.svg"
                background #FFFFFF
                color #172033
                stroke #4285F4
            }
            element "GCP Secret Manager" {
                icon "assets/icons/vendors/gcp-secret-manager.svg"
                background #FFFFFF
                color #172033
                stroke #4285F4
            }
            element "GCP Load Balancing" {
                icon "assets/icons/vendors/gcp-cloud-load-balancing.svg"
                background #FFFFFF
                color #172033
                stroke #4285F4
            }
            element "GCP Cloud Monitoring" {
                icon "assets/icons/vendors/gcp-cloud-monitoring.svg"
                background #FFFFFF
                color #172033
                stroke #4285F4
            }
            element "GCP Workload Identity" {
                icon "assets/icons/vendors/gcp-workload-identity.svg"
                background #FFFFFF
                color #172033
                stroke #4285F4
            }
            element "GCP Network" {
                icon "assets/icons/vendors/gcp-cloud-network.svg"
                background #FFFFFF
                color #172033
                stroke #4285F4
            }
            element "GCP Certificate" {
                icon "assets/icons/vendors/gcp-certificate-manager.svg"
                background #FFFFFF
                color #172033
                stroke #4285F4
            }
            relationship "Relationship" {
                color #64748B
                thickness 2
                fontSize 18
                routing Orthogonal
            }
            relationship "Public HTTPS" {
                color #2563EB
                thickness 3
            }
            relationship "Internal HTTP" {
                color #7C3AED
                thickness 3
            }
            relationship "Database" {
                color #166534
                thickness 3
            }
            relationship "Object Storage" {
                color #047857
                thickness 3
            }
            relationship "Authentication" {
                color #B91C1C
                thickness 3
            }
            relationship "Secret Injection" {
                color #9F1239
                style Dashed
            }
            relationship "Configuration" {
                color #64748B
                style Dashed
            }
            relationship "Telemetry" {
                color #0369A1
                style Dashed
            }
            relationship "Health Check" {
                color #0E7490
                style Dashed
            }
            relationship "Optional" {
                color #94A3B8
                style Dashed
            }
        }

        properties {
            "mermaid.title" "true"
            "mermaid.sequenceDiagram" "true"
        }
    }

    configuration {
        scope softwaresystem
        visibility private
    }
}

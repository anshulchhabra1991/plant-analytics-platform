# 🏭 Plant Analytics Platform

A production-ready, scalable data analytics platform for EPA eGRID (Emissions & Generation Resource Integrated Database) power plant data. Built with microservices architecture, automated data processing, and comprehensive monitoring.

> **⚡ One-Command Setup**: Get the entire system running with just `make up` - no complex configuration needed!

## 📋 Project Agenda

### **Primary Objectives**
- **Data Processing**: Automated ingestion and processing of EPA eGRID CSV datasets using Airflow
- **Analytics API**: RESTful APIs for power plant analytics and reporting
- **Authentication**: Secure JWT-based authentication  
- **Real-time Processing**: Queue-based data processing with Redis caching
- **Monitoring**: Production-ready observability with Prometheus and health checks

### **Key Features**
- ✅ **Infrastructure as Code (IaC)**: Helm charts for Kubernetes deployment
- ✅ **Microservices Architecture**: Independent scaling and health checks
- ✅ **NestJS Framework**: API Gateway and Auth Service converted to NestJS
- ✅ **Airflow ETL Pipeline**: Automated CSV data processing with hourly scheduling
- ✅ **JWT Authentication**: Secure token-based authentication service
- ✅ **Redis Caching**: Improved performance with intelligent caching
- ✅ **RabbitMQ Messaging**: Reliable asynchronous message processing
- ✅ **MinIO Object Storage**: Scalable file management system
- ✅ **Prometheus Monitoring**: Production-ready observability
- ✅ **Docker Containerization**: Smart dependency management
- ✅ **Secure Backend API**: Only accessible via API Gateway
- ✅ **Large-scale Data Support**: NUMERIC(20,2) for billions+ values
- ✅ **Production-ready**: Rate limiting, error handling, health checks

## 🚀 Setup Instructions

### **Prerequisites**
- Docker and Docker Compose
- Helm 3.0+ (for Kubernetes deployment)
- kubectl (for Kubernetes deployment)
- 3GB+ RAM, 5GB+ storage
- Make (available on macOS/Linux by default)

### **🐳 Docker Compose Setup (Recommended for Development)**
```bash
# 1. Clone and navigate
git clone https://github.com/anshulchhabra1991/plant-analytics-platform.git
cd plant-analytics-platform

# 2. Start everything with one command
make up

# That's it! 🎉 The system will:
# ✅ Start all services in the correct order
# ✅ Wait for databases to be ready with health checks
# ✅ Handle large-scale data (NUMERIC(20,2) for billions+ values)
# ✅ Secure backend API (only accessible via gateway)

### **☸️ Kubernetes Setup with Helm (Production Ready)**
```bash
# 1. Clone and navigate
git clone https://github.com/anshulchhabra1991/plant-analytics-platform.git
cd plant-analytics-platform

# 2. Install with Helm (Infrastructure as Code)
./helm/install.sh

# 3. Port-forward to access services
kubectl port-forward -n plant-analytics svc/plant-analytics-frontend 4000:4000
kubectl port-forward -n plant-analytics svc/plant-analytics-api-gateway 8000:8000

# 4. To uninstall
./helm/uninstall.sh
# ✅ Seed sample data automatically
# ✅ Show you what URLs to visit
```

### **Development Workflow**
```bash
# Daily development (fastest)
make start              # Quick restart with Docker Compose

# Troubleshooting
make clean && make up   # Clean restart with full cleanup

# Get help anytime
make                    # Shows all available commands
```

### **First Time Access**
After running `make up`, visit these URLs:

1. **🌐 Frontend Dashboard**: http://localhost:4000
   - Email: `admin@plantanalytics.com` 
   - Password: `password123`

2. **💨 Airflow (Data Processing)**: http://localhost:8080
   - Username: `admin` / Password: `admin`
   - Trigger the `process_csv_data_pipeline` DAG to load sample data

3. **📁 MinIO Console (File Storage)**: http://localhost:9001  
   - Username: `egriduser` / Password: `egridpass123`

## ❓ Troubleshooting

### **Common Issues**

#### **Services Won't Start**
```bash
make clean && make up       # Full cleanup and restart
make status                 # Check what's running
make logs                   # Check for errors
```

#### **Port Already in Use**
```bash
# Check what's using the port (example for port 4000)
lsof -i :4000
# Kill the process or change the port in docker-compose.yml
```

#### **Data Not Loading**
```bash
make airflow                # Open Airflow UI
# Manually trigger 'process_csv_data_pipeline'
make logs-airflow          # Check processing logs
# Database now supports large values (billions+ MWh) with NUMERIC(20,2)
```

#### **API Not Responding**
```bash
make health                # Check API health (via gateway)
make logs-gateway          # Check gateway logs
make logs-backend          # Check backend logs
# Note: Backend API (port 3000) only accessible through gateway (port 8000)
# Direct access to localhost:3000 is blocked for security
```

### **Getting Help**
- Run `make` to see all available commands
- Check service logs with `make logs-[service]`  
- Use `make status` to see which services are running
- All services have health checks - look for "healthy" status

### **Service Access**
| Service | URL | Credentials | Notes |
|---------|-----|-------------|--------|
| 🌐 Frontend | http://localhost:4000 | admin@plantanalytics.com / password123 | Main dashboard |
| 🚪 API Gateway | http://localhost:8000 | JWT required | All API requests |
| 🔐 Auth Service | http://localhost:5001 | - | Login endpoints |
| 💨 Airflow | http://localhost:8080 | admin / admin | Data processing |
| 📁 MinIO Console | http://localhost:9001 | egriduser / egridpass123 | File storage |
| 📊 Prometheus | http://localhost:9090 | - | Metrics monitoring |
| 🐰 RabbitMQ | http://localhost:15672 | guest / guest | Message queue |
| 🗄️ PostgreSQL | localhost:5432 | plantuser / plantpassword123 | Database (NUMERIC(20,2) precision) |
| 🔥 Redis | localhost:6379 | - | Cache |

> **Security**: Backend API (port 3000) is only accessible through the API Gateway - no direct external access.  
> **Data Scale**: Database supports large values (billions+ MWh) with NUMERIC(20,2) precision for power generation data.


## 🛠️ Development Commands

### **Essential Commands**
```bash
# Get help (shows all commands)
make                    # Display help menu

# System Management
make up                 # Complete system startup
make start              # Quick Docker Compose start
make stop               # Stop all services

# Cleanup
make clean              # Complete cleanup (containers, volumes, images)
```

### **Monitoring & Debugging**
```bash
# View logs
make logs               # All service logs
make logs-backend       # Backend API logs only
make logs-gateway       # API Gateway logs only
make logs-frontend      # Frontend logs only
make logs-airflow       # Airflow logs only

# System health
make status             # Service status summary
make health             # Check API health endpoints
make test-api           # Test API endpoints
make test-system        # Full system health check
```

### **Quick Access (macOS)**
```bash
# Open services in browser
make frontend           # Opens http://localhost:4000
make airflow            # Opens http://localhost:8080
make minio              # Opens http://localhost:9001
```

### **Docker Operations**
```bash
# Building
make build              # Build all Docker images
make rebuild            # Rebuild with --no-cache

# Manual Docker Compose
docker compose up -d    # Start services
docker compose down     # Stop services
docker compose ps       # Service status
docker compose logs -f  # Follow logs

## 🎯 Why This Platform?

### **🚀 Developer Experience First**
- **One-Command Setup**: `make up` starts everything
- **Smart Dependencies**: Services wait for each other automatically
- **Helpful Commands**: `make` shows all available options
- **Quick Access**: `make frontend` opens the dashboard instantly

### **🏗️ Production-Ready Architecture**
- **Security**: Backend API only accessible through API Gateway (no direct port exposure)
- **Scalability**: All services independently scalable with health checks
- **Data Handling**: Supports large-scale data (NUMERIC(20,2) for billions+ values)
- **Monitoring**: Built-in health checks, metrics, and dependency management
- **Reliability**: Automatic restarts and smart startup orchestration

### **📊 Real Data Processing**
- **Sample Data Included**: Ready-to-use EPA eGRID dataset
- **Visual Workflows**: Airflow DAGs for data processing
- **Interactive Dashboard**: Filter and explore power plant data
- **APIs Ready**: RESTful endpoints for integration

```

## 🏗️ Architecture Overview

### **Logical Architecture**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React         │    │   API Gateway    │    │   Backend API   │
│   Frontend      │───▶│   (Express.js)   │───▶│   (NestJS)      │
│   (Port 4000)   │    │   (Port 8000)    │    │   (Port 3000)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                       ┌──────────────────┐             │
                       │   Auth Service   │             │
                       │   (Express.js)   │             │
                       │   (Port 5001)    │             │
                       └──────────────────┘             │
                                                        │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Airflow       │    │   RabbitMQ       │    │   PostgreSQL    │
│   ETL Pipeline  │───▶│   Message Queue  │───▶│   Database      │
│   (Port 8080)   │    │   (Port 5672)    │    │   (Port 5432)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                              │
         │              ┌──────────────────┐           │
         └─────────────▶│   MinIO          │           │
                        │   Object Storage │           │
                        │   (Port 9000)    │           │
                        └──────────────────┘           │
                                                       │
                        ┌──────────────────┐           │
                        │   Redis Cache    │◀──────────┘
                        │   (Port 6379)    │
                        └──────────────────┘
                                │
                        ┌──────────────────┐
                        │   Prometheus     │
                        │   Monitoring     │
                        │   (Port 9090)    │
                        └──────────────────┘
```

### **Deployment Architecture**
```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer                            │
│                       (nginx/ALB)                               │
└─────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                     Application Tier                           │
├──────────────┬──────────────┬──────────────┬─────────────────────┤
│  Frontend    │  Gateway     │  Auth        │  Backend API        │
│  Cluster     │  Cluster     │  Cluster     │  Cluster            │
│  (2+ pods)   │  (2+ pods)   │  (2+ pods)   │  (2+ pods)          │
└──────────────┴──────────────┴──────────────┴─────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                      Data Tier                                 │
├──────────────┬──────────────┬──────────────┬─────────────────────┤
│  PostgreSQL  │  Redis       │  RabbitMQ    │  MinIO              │
│  Primary +   │  Cluster     │  Cluster     │  Cluster            │
│  Replica     │  (3+ nodes)  │  (3+ nodes)  │  (4+ nodes)         │
└──────────────┴──────────────┴──────────────┴─────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                    Processing Tier                             │
├──────────────┬──────────────┬──────────────┬─────────────────────┤
│  Airflow     │  Workers     │  Scheduler   │  Monitoring         │
│  Webserver   │  (Auto-scale)│  (HA)        │  (Prometheus)       │
└──────────────┴──────────────┴──────────────┴─────────────────────┘
```

### **Infrastructure Architecture**
```
┌─────────────────────────────────────────────────────────────────┐
│                     Kubernetes Cluster                         │
├─────────────────────────────────────────────────────────────────┤
│  Namespace: frontend                                            │
│  ├── Frontend Deployment (2 replicas)                          │
│  ├── Frontend Service (ClusterIP)                              │
│  └── Frontend Ingress (nginx)                                  │
├─────────────────────────────────────────────────────────────────┤
│  Namespace: api                                                 │
│  ├── Gateway Deployment (2 replicas)                           │
│  ├── Auth Service Deployment (2 replicas)                      │
│  ├── Backend API Deployment (2 replicas)                       │
│  └── API Services (ClusterIP)                                  │
├─────────────────────────────────────────────────────────────────┤
│  Namespace: data                                                │
│  ├── PostgreSQL StatefulSet (Primary + Replica)                │
│  ├── Redis StatefulSet (3 node cluster)                        │
│  ├── RabbitMQ StatefulSet (3 node cluster)                     │
│  └── MinIO StatefulSet (4 node cluster)                        │
├─────────────────────────────────────────────────────────────────┤
│  Namespace: processing                                          │
│  ├── Airflow Webserver Deployment                              │
│  ├── Airflow Scheduler Deployment                              │
│  └── Airflow Workers Deployment (Auto-scaling)                 │
├─────────────────────────────────────────────────────────────────┤
│  Namespace: monitoring                                          │
│  ├── Prometheus StatefulSet                                    │
│  ├── Grafana Deployment                                        │
│  └── AlertManager Deployment                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Handling Non-Functional Requirements

### **Scalability**
- **Horizontal Scaling**: All services are stateless and scale independently
- **Database Scaling**: PostgreSQL with read replicas and connection pooling
- **Cache Strategy**: Redis cluster with data partitioning
- **Load Balancing**: Kubernetes services with stateless routing

### **Performance**
- **Response Time**: < 200ms for cached queries, < 1s for database queries
- **Throughput**: 1000+ requests/second per service instance
- **Data Processing**: Parallel chunk processing for large CSV files
- **Optimization**: Database indexing, query optimization, connection pooling

### **Reliability**
- **High Availability**: 99.9% uptime with redundant instances
- **Fault Tolerance**: Health checks, circuit breakers, retry mechanisms
- **Data Backup**: Automated daily backups with point-in-time recovery
- **Disaster Recovery**: Multi-region deployment support

### **Security**
- **Authentication**: JWT tokens with 1-hour expiry
- **Authorization**: JWT token-based access control
- **Data Protection**: Encryption at rest and in transit
- **Network Security**: Service mesh with mTLS

### **Maintainability**
- **Clean Architecture**: Domain-driven design with clear separation
- **Documentation**: Comprehensive API docs and architecture diagrams
- **Testing**: Unit, integration, and E2E testing
- **CI/CD**: Automated pipelines with quality gates

## 📊 Monitoring & Observability

### **Prometheus Metrics**
The platform collects comprehensive metrics:

```yaml
# Application Metrics
- http_requests_total (counter)
- http_request_duration_seconds (histogram)
- database_connections_active (gauge)
- cache_hit_ratio (gauge)
- queue_messages_pending (gauge)

# Infrastructure Metrics  
- cpu_usage_percent (gauge)
- memory_usage_bytes (gauge)
- disk_usage_percent (gauge)
- network_bytes_total (counter)

# Business Metrics
- csv_files_processed_total (counter)
- data_records_ingested_total (counter)
- api_calls_by_endpoint (counter)
```

### **Monitoring Stack**
```
Applications ──▶ Prometheus ──▶ Grafana
     │              │              │
     │              │              └─▶ Dashboards
     │              │
     │              └─▶ AlertManager ──▶ Notifications
     │
     └─▶ Logs ──▶ ELK Stack ──▶ Kibana
```

### **Health Checks**
- **Service Health**: HTTP health endpoints on all services
- **Database Health**: Connection and query performance monitoring
- **Queue Health**: Message processing rates and queue depth
- **File System Health**: Disk usage and I/O performance

### **Alerting Rules**
- Service down for > 5 minutes
- Response time > 2 seconds for > 10 requests
- Error rate > 5% for > 5 minutes
- Database connections > 80% of pool
- Queue depth > 1000 messages

## 🛠️ Technology Choices & Rationale

### **Frontend: React + TypeScript**
**Why?** Mature ecosystem, strong typing, component reusability, good developer experience

### **API Gateway: Express.js**
**Why?** Lightweight, minimal overhead, extensive middleware ecosystem, easy to configure

### **Authentication: Dedicated Service**
**Why?** Centralized auth logic, independent scaling, easier security auditing, reusable across services

### **Backend API: NestJS + TypeScript**
**Why?** Built-in dependency injection, decorator-based architecture, excellent TypeScript support, enterprise patterns

### **Data Processing: Apache Airflow**
**Why?** Visual workflow management, robust scheduling, extensive monitoring, Python ecosystem

### **Database: PostgreSQL**
**Why?** ACID compliance, advanced indexing, JSON support, proven reliability for analytics workloads  
**Scale:** NUMERIC(20,2) precision for handling large-scale power generation data (billions+ MWh)  
**Performance:** Optimized for analytics workloads with proper indexing and caching

### **Caching: Redis**
**Why?** In-memory performance, rich data structures, pub/sub capabilities, clustering support

### **Message Queue: RabbitMQ**
**Why?** Message durability, flexible routing, management interface, AMQP standard compliance

### **Object Storage: MinIO**
**Why?** S3-compatible API, self-hosted option, high performance, no vendor lock-in

### **Containerization: Docker**
**Why?** Environment consistency, easy deployment, resource isolation, extensive tooling

### **Orchestration: Kubernetes**
**Why?** Auto-scaling, service discovery, rolling updates, declarative configuration

### **Monitoring: Prometheus + Grafana**
**Why?** Time-series optimized, powerful query language, rich visualization, alerting capabilities

## 📚 Documentation

Complete documentation is available in the `docs/` directory:

```
docs/
├── api/                    # API Documentation
│   ├── sequence-diagrams/  # Request flow diagrams
│   └── endpoints/          # Endpoint specifications
├── architecture/           # Architecture Documentation  
│   ├── overview/           # System overview
│   ├── security/           # Security implementation
│   └── schemas/            # Database schemas
└── deployment/             # Deployment Documentation
    ├── docker/             # Docker configurations
    └── kubernetes/         # K8s manifests
```

## 🎯 Quick Reference

### **Common Workflows**

#### **🚀 First Time Setup**
```bash
git clone <repository>
cd plant-analytics-platform
make up                 # Start everything (handles dependencies automatically)
make frontend           # Open dashboard
# System now supports large-scale data and secure API access
```

#### **☀️ Daily Development**
```bash
make start              # Quick start
make logs-backend       # Debug specific service
make clean && make up   # Clean restart if issues
```

#### **🐛 Troubleshooting**
```bash
make status             # What's running?
make health             # Are APIs responding?
make logs               # Check all logs
make clean && make up   # Full cleanup and restart
```

#### **🔍 Data Processing**
```bash
make airflow            # Open Airflow UI
# Trigger 'process_csv_data_pipeline' DAG
make logs-airflow       # Check processing logs
```

## 📁 Project Structure

```
plant-analytics-platform/
├── apps/                           # Application services
│   ├── api-gateway/               # API Gateway (NestJS)
│   │   ├── src/
│   │   │   ├── controllers/       # NestJS controllers
│   │   │   ├── services/          # Business logic
│   │   │   └── modules/           # Feature modules
│   │   └── package.json
│   ├── auth-service/              # Authentication service (NestJS)
│   │   ├── src/
│   │   │   ├── controllers/       # Auth endpoints
│   │   │   ├── services/          # JWT & user management
│   │   │   └── types/             # TypeScript interfaces
│   │   └── package.json
│   ├── backend-api/               # Main backend (NestJS)
│   │   ├── src/
│   │   │   ├── modules/           # Feature modules (analytics, ingestion)
│   │   │   ├── infrastructure/    # External services (cache, database)
│   │   │   └── shared/            # Common utilities
│   │   └── package.json
│   ├── data-processing/           # Airflow DAGs & processors
│   │   ├── dags/
│   │   │   ├── application/       # CSV processors
│   │   │   ├── config/            # ETL configuration (hourly scheduling)
│   │   │   ├── domain/            # Data models
│   │   │   └── infrastructure/    # DB & MinIO clients
│   │   └── airflow.cfg
│   └── frontend/                  # React frontend
│       ├── src/                   # React components
│       └── package.json
├── helm/                          # Infrastructure as Code (IaC)
│   ├── plant-analytics-platform/  # Main Helm chart
│   │   ├── templates/             # Kubernetes templates
│   │   │   ├── frontend-deployment.yaml
│   │   │   ├── api-gateway-deployment.yaml
│   │   │   ├── auth-service-deployment.yaml
│   │   │   ├── ingress.yaml
│   │   │   └── ...
│   │   ├── Chart.yaml             # Chart metadata & dependencies
│   │   └── values.yaml            # Configuration values
│   ├── install.sh                 # Automated installation
│   └── uninstall.sh               # Clean uninstallation
├── docker-compose.yml             # Multi-service orchestration
├── docs/                          # Documentation
│   ├── api/                       # API documentation
│   ├── architecture/              # System design
│   └── deployment/                # Deployment guides
├── infra/                         # Infrastructure configuration
│   ├── db/                        # Database setup & migrations
│   │   ├── init/                  # SQL initialization scripts
│   │   └── sample-data/           # CSV datasets
│   ├── prometheus/                # Monitoring config
│   └── rabbitmq/                  # Message queue config
├── scripts/                       # Utility scripts
│   ├── seed/                      # Data seeding
│   ├── tests/                     # Test scripts
│   └── run-system.sh              # System startup
└── Makefile                       # Build automation
```

### **Essential URLs**
| Purpose | URL | Quick Access |
|---------|-----|--------------|
| 🎯 **Main Dashboard** | http://localhost:4000 | `make frontend` |
| 💨 **Data Processing** | http://localhost:8080 | `make airflow` |
| 📁 **File Storage** | http://localhost:9001 | `make minio` |
| 🚪 **API Gateway** | http://localhost:8000 | Direct curl/Postman |

### **Service Ports**
- 🌐 Frontend: 4000 (external)
- 🚪 Gateway: 8000 (external)  
- 🔐 Auth: 5001 (external)
- ⚙️ Backend: 3000 (internal only)
- 💨 Airflow: 8080 (external)
- 📊 Prometheus: 9090 (external)
- 🗄️ PostgreSQL: 5432 (external)
- 🔥 Redis: 6379 (external)
- 🐰 RabbitMQ: 5672 (external)
- 📁 MinIO: 9000/9001 (external)

### **Alternative Commands**
```bash
# Direct Docker Compose usage (if make is not available)
docker compose up -d --build       # Complete startup with health checks
docker compose down -v             # Basic cleanup
docker compose ps                  # Check service status
docker compose logs -f             # Follow all service logs
```

For detailed setup and configuration, see individual service documentation in the `docs/` directory.

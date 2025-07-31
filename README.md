# eGRID Analytics Platform

A scalable data analytics platform for EPA eGRID (Emissions & Generation Resource Integrated Database) power plant data. Built with microservices architecture, automated data processing, and comprehensive monitoring.

## 📋 Project Agenda

### **Primary Objectives**
- **Data Processing**: Automated ingestion and processing of EPA eGRID CSV datasets using Airflow
- **Analytics API**: RESTful APIs for power plant analytics and reporting
- **Authentication**: Secure JWT-based authentication with role-based access control  
- **Real-time Processing**: Queue-based data processing with Redis caching
- **Monitoring**: Production-ready observability with Prometheus and health checks

### **Key Features**
- ✅ Microservices architecture with independent scaling
- ✅ Airflow-based ETL pipeline for CSV data processing
- ✅ JWT authentication service with user management
- ✅ Redis caching for improved performance
- ✅ RabbitMQ for reliable message processing
- ✅ MinIO object storage for file management
- ✅ Prometheus monitoring with custom metrics
- ✅ Docker containerization with health checks

## 🚀 Setup Instructions

### **Prerequisites**
- Node.js 18+
- Docker and Docker Compose
- 4GB+ RAM, 10GB+ storage

### **Quick Start**
   ```bash
# 1. Clone and navigate
git clone https://github.com/anshulchhabra1991/plant-analytics-platform.git
   cd plant-analytics-platform

# 2. Start the project
make run-project

# 3. When all services are up
Login at airflow " http://localhost:8080 , user - admin , pass - admin "
start the Dag

# 3. When all services are up
Login at Frontend " http://localhost:4000 , user - admin@plantanalytics.com , pass - password123 "
```

### **Service Access**
| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:4000 | admin@plantanalytics.com / password123 |
| API Gateway | http://localhost:8000 | - |
| Backend API | http://localhost:3000 | - |
| Auth Service | http://localhost:5001 | - |
| Swagger Docs | http://localhost:3000/api/docs | - |
| Airflow | http://localhost:8080 | admin / admin |
| RabbitMQ | http://localhost:15672 | guest / guest |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin |
| Prometheus | http://localhost:9090 | - |




### **Development Commands**
```bash
# Development
make start-dev          # Start in development mode
make start-backend      # Start only backend
make start-gateway      # Start only gateway

# Building
make build              # Build all services
make build-backend      # Build backend only

# Testing
make test               # Run all tests
make test-e2e          # Run end-to-end tests

# Maintenance  
make logs              # View all logs
make clean             # Clean build artifacts
make stop              # Stop all services
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
- **Load Balancing**: Kubernetes services with session affinity

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
- **Authentication**: JWT tokens with refresh mechanism
- **Authorization**: Role-based access control (RBAC)
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

### **Common Tasks**
```bash
# Start everything
make start

# Check service health
make health

# View logs
make logs

# Run tests
make test

# Build for production
make build

# Stop services
make stop
```

### **Service Ports**
- Frontend: 4000
- Gateway: 8000  
- Backend: 3000
- Auth: 5001
- Airflow: 8080
- Prometheus: 9090
- PostgreSQL: 5432
- Redis: 6379
- RabbitMQ: 5672
- MinIO: 9000/9001

For detailed setup and configuration, see individual service documentation in the `docs/` directory.

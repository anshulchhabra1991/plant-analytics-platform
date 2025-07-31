# Architecture Overview

## 1. Introduction

The eGRID Analytics Platform is a microservices-based data analytics system designed to process EPA eGRID (Emissions & Generation Resource Integrated Database) power plant data. The platform follows clean architecture principles with clear separation of concerns, domain-driven design, and production-ready infrastructure.

## 2. Abbreviations and Definitions

| Term | Definition |
|------|------------|
| API | Application Programming Interface |
| eGRID | Emissions & Generation Resource Integrated Database |
| ETL | Extract, Transform, Load |
| JWT | JSON Web Token |
| JWT | JSON Web Token Authentication |
| SLA | Service Level Agreement |
| HA | High Availability |
| DR | Disaster Recovery |

## 3. Product Requirements

### 3.1 Functional Requirements
- **FR-001**: Process EPA eGRID CSV data files automatically
- **FR-002**: Provide RESTful APIs for power plant analytics
- **FR-003**: Support user authentication and authorization
- **FR-004**: Cache frequently accessed data for performance
- **FR-005**: Generate analytics reports and dashboards
- **FR-006**: Handle file uploads and storage
- **FR-007**: Provide real-time monitoring and health checks

### 3.2 Non-Functional Requirements
- **NFR-001**: System availability ≥ 99.9%
- **NFR-002**: API response time ≤ 200ms for cached data
- **NFR-003**: Support 1000+ concurrent users
- **NFR-004**: Process CSV files up to 100MB
- **NFR-005**: Data consistency and integrity
- **NFR-006**: Horizontal scalability
- **NFR-007**: Security compliance (JWT, HTTPS)

## 4. Technical Requirements

### 4.1 Performance Requirements
- **Response Time**: < 200ms for cached queries, < 1s for database queries
- **Throughput**: 1000+ requests/second per service instance
- **Scalability**: Auto-scaling based on CPU/memory metrics
- **Data Processing**: Handle CSV files up to 100MB with parallel processing

### 4.2 Security Requirements
- **Authentication**: JWT-based with 1-hour token expiry
- **Authorization**: JWT token-based access control
- **Data Encryption**: TLS 1.3 for data in transit
- **Network Security**: VPC isolation, security groups
- **Audit Logging**: All user actions logged

### 4.3 Reliability Requirements
- **Availability**: 99.9% uptime SLA
- **Fault Tolerance**: Circuit breakers, retries, graceful degradation
- **Data Backup**: Daily automated backups with point-in-time recovery
- **Disaster Recovery**: RTO < 4 hours, RPO < 1 hour

## 5. High-Level Design (HLD)

### 5.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     eGRID Analytics Platform                    │
├─────────────────────────────────────────────────────────────────┤
│                        Client Layer                            │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │  Web Browser    │    │  Mobile App     │                    │
│  │  (React)        │    │  (React Native) │                    │
│  └─────────────────┘    └─────────────────┘                    │
├─────────────────────────────────────────────────────────────────┤
│                      Gateway Layer                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                  API Gateway                                │ │
│  │               (Express.js)                                  │ │
│  │  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │ │
│  │  │   Routing   │    Auth     │    Rate     │   Logging   │ │ │
│  │  │             │  Middleware │  Limiting   │             │ │ │
│  │  └─────────────┴─────────────┴─────────────┴─────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                     Service Layer                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │     Auth     │ │   Backend    │ │      Data Processing     │ │
│  │   Service    │ │     API      │ │       (Airflow)          │ │
│  │  (Express)   │ │  (NestJS)    │ │                          │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                   Infrastructure Layer                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │ PostgreSQL   │ │    Redis     │ │   RabbitMQ   │             │
│  │  Database    │ │    Cache     │ │  Message Q   │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
│  ┌──────────────┐ ┌─────────────────────────────────────────┐  │
│  │    MinIO     │ │           Monitoring                    │  │
│  │   Storage    │ │      (Prometheus + Grafana)             │  │
│  └──────────────┘ └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Data Flow Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   CSV File  │───▶│   MinIO     │───▶│   Airflow   │
│   Upload    │    │   Storage   │    │   Pipeline  │
└─────────────┘    └─────────────┘    └─────────────┘
                                             │
                   ┌─────────────┐           │
                   │  RabbitMQ   │◀──────────┘
                   │  Message Q  │
                   └─────────────┘
                          │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Frontend   │───▶│  Backend    │───▶│ PostgreSQL  │
│   Client    │    │    API      │    │  Database   │
└─────────────┘    └─────────────┘    └─────────────┘
                          │
                   ┌─────────────┐
                   │   Redis     │
                   │   Cache     │
                   └─────────────┘
```

## 6. Service Communication

### 6.1 Synchronous Communication
- **Frontend ↔ API Gateway**: HTTP/REST
- **API Gateway ↔ Auth Service**: HTTP/REST
- **API Gateway ↔ Backend API**: HTTP/REST
- **Services ↔ Database**: TCP (PostgreSQL protocol)
- **Services ↔ Cache**: TCP (Redis protocol)

### 6.2 Asynchronous Communication
- **Airflow → RabbitMQ**: Message publishing
- **Backend API ↔ RabbitMQ**: Message consumption
- **Services → Monitoring**: Metrics publishing

## 7. Security Architecture

### 7.1 Authentication Flow
1. User submits credentials to Auth Service
2. Auth Service validates against database
3. JWT tokens generated and returned
4. Subsequent requests include JWT in Authorization header
5. API Gateway validates JWT with Auth Service

### 7.2 Authorization Model
- **Authentication**: JWT tokens with 1-hour expiry
- **Authorization**: Token-based access control
- **Resource Access**: Fine-grained per endpoint

### 7.3 Data Protection
- **Encryption at Rest**: Database and file storage encryption
- **Encryption in Transit**: TLS 1.3 for all communications
- **Network Security**: VPC, security groups, firewalls

## 8. Scalability Design

### 8.1 Horizontal Scaling
- **Stateless Services**: All application services are stateless
- **Load Balancing**: Kubernetes services with stateless routing
- **Auto-scaling**: HPA based on CPU/memory metrics

### 8.2 Database Scaling
- **Read Replicas**: PostgreSQL streaming replication
- **Connection Pooling**: PgBouncer for connection management
- **Caching**: Redis for frequently accessed data

### 8.3 Data Processing Scaling
- **Parallel Processing**: Airflow workers scale based on queue depth
- **Chunk Processing**: Large files divided into smaller chunks
- **Queue Scaling**: RabbitMQ cluster with automatic failover 
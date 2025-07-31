# eGRID Analytics Platform Documentation

## 📚 Documentation Overview

This directory contains comprehensive documentation for the eGRID Analytics Platform, covering all aspects of the system from API usage to deployment strategies.

## 🗂️ Documentation Structure

### 📡 API Documentation
- **[Sequence Diagrams](api/sequence-diagrams.md)** - Visual flow of all major API operations
- **[Endpoints](api/endpoints.md)** - Detailed API endpoint specifications with examples

### 🏗️ Architecture Documentation
- **[Overview](architecture/overview.md)** - Complete system architecture with HLD, requirements, and design principles
- **[Security](architecture/security.md)** - Comprehensive security implementation including JWT, RBAC, and network security
- **[Database Schemas](architecture/schemas.md)** - Complete database design with ERD, table definitions, and optimization
- **[Error Codes](architecture/error-codes.md)** - Standardized error handling with detailed error codes and responses

### 🚀 Deployment Documentation
- **[Deployment Guide](deployment/deployment-guide.md)** - Complete deployment strategies for Docker Compose and Kubernetes

## 🎯 Quick Navigation

### **For Developers**
Start with:
1. [README.md](../README.md) - Project overview and setup
2. [API Endpoints](api/endpoints.md) - API specifications
3. [Sequence Diagrams](api/sequence-diagrams.md) - Request flows

### **For DevOps Engineers**
Start with:
1. [Deployment Guide](deployment/deployment-guide.md) - Infrastructure setup
2. [Architecture Overview](architecture/overview.md) - System design
3. [Security Architecture](architecture/security.md) - Security implementation

### **For Database Administrators**
Start with:
1. [Database Schemas](architecture/schemas.md) - Complete schema design
2. [Architecture Overview](architecture/overview.md) - System requirements
3. [Deployment Guide](deployment/deployment-guide.md) - Database deployment

### **For Security Engineers**
Start with:
1. [Security Architecture](architecture/security.md) - Security implementation
2. [Error Codes](architecture/error-codes.md) - Security error handling
3. [Architecture Overview](architecture/overview.md) - Security requirements

### **For QA Engineers**
Start with:
1. [API Endpoints](api/endpoints.md) - Testing specifications
2. [Error Codes](architecture/error-codes.md) - Error scenarios
3. [Sequence Diagrams](api/sequence-diagrams.md) - Flow testing

## 📋 Key Features Documented

### ✅ **Authentication & Authorization**
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Session management and security policies

### ✅ **Data Processing**
- Airflow-based ETL pipeline
- CSV file processing and validation
- Queue-based data ingestion

### ✅ **API Architecture**
- RESTful API design
- Rate limiting and caching
- Error handling and validation

### ✅ **Infrastructure**
- Docker containerization
- Kubernetes deployment
- Monitoring with Prometheus

### ✅ **Security**
- Network security configuration
- Data encryption (at rest and in transit)
- Audit logging and monitoring

### ✅ **Database**
- PostgreSQL schema design
- Performance optimization
- Backup and recovery procedures

## 🔍 Document Cross-References

| Topic | Primary Document | Related Documents |
|-------|------------------|-------------------|
| API Usage | [Endpoints](api/endpoints.md) | [Sequence Diagrams](api/sequence-diagrams.md), [Error Codes](architecture/error-codes.md) |
| Authentication | [Security](architecture/security.md) | [Endpoints](api/endpoints.md), [Error Codes](architecture/error-codes.md) |
| Database | [Schemas](architecture/schemas.md) | [Overview](architecture/overview.md), [Deployment](deployment/deployment-guide.md) |
| Deployment | [Deployment Guide](deployment/deployment-guide.md) | [Overview](architecture/overview.md), [Security](architecture/security.md) |
| Monitoring | [Deployment Guide](deployment/deployment-guide.md) | [Overview](architecture/overview.md) |

## 🆘 Troubleshooting Guide

### **Common Issues**

**Authentication Problems**
- Check [Security Architecture](architecture/security.md) for JWT configuration
- Refer to [Error Codes](architecture/error-codes.md) for AUTH_* errors

**Deployment Issues**
- Follow [Deployment Guide](deployment/deployment-guide.md) step-by-step
- Verify environment configuration

**Database Connection Issues**
- Check [Database Schemas](architecture/schemas.md) for connection settings
- Review [Deployment Guide](deployment/deployment-guide.md) for database setup

**API Errors**
- Consult [Error Codes](architecture/error-codes.md) for specific error handling
- Check [API Endpoints](api/endpoints.md) for correct usage

## 📝 Contributing to Documentation

When updating documentation:
1. Keep it simple and focused
2. Include diagrams for complex concepts
3. Provide practical examples
4. Cross-reference related sections
5. Update this index when adding new documents

---

For the main project setup and quick start, see the [main README](../README.md). 
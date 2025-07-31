# Deployment Guide

## 1. Overview

The eGRID Analytics Platform supports multiple deployment strategies from local development to production Kubernetes clusters. This guide covers Docker Compose for local development and Kubernetes for production deployments.

## 2. Local Development Deployment

### 2.1 Docker Compose Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Host Machine                              │
├─────────────────────────────────────────────────────────────────┤
│                   Docker Network: plant-analytics              │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Frontend   │  │  API Gateway │  │    Auth Service      │  │
│  │  (Port 4000) │  │  (Port 8000) │  │    (Port 5001)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Backend API  │  │   Airflow    │  │    Prometheus        │  │
│  │ (Port 3000)  │  │ (Port 8080)  │  │    (Port 9090)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ PostgreSQL   │  │    Redis     │  │      RabbitMQ        │  │
│  │ (Port 5432)  │  │ (Port 6379)  │  │    (Port 5672)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                 │
│  ┌──────────────┐                                              │
│  │    MinIO     │                                              │
│  │(Port 9000/01)│                                              │
│  └──────────────┘                                              │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Deployment Commands
```bash
# Clone repository
git clone <repository-url>
cd plant-analytics-platform

# Start all services
make start

# Check service health
make health

# View logs
make logs

# Stop services
make stop
```

### 2.3 Service Dependencies
```yaml
# Docker Compose dependency order
services:
  postgres:
    # No dependencies - starts first
  
  redis:
    # No dependencies - starts first
    
  rabbitmq:
    # No dependencies - starts first
    
  minio:
    # No dependencies - starts first
    
  auth-service:
    depends_on:
      postgres:
        condition: service_healthy
        
  backend-api:
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
        
  api-gateway:
    depends_on:
      - backend-api
      - auth-service
      
  frontend:
    depends_on:
      - api-gateway
      
  airflow-webserver:
    depends_on:
      postgres:
        condition: service_healthy
        
  airflow-scheduler:
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      airflow-webserver:
        condition: service_healthy
```

## 3. Production Kubernetes Deployment

### 3.1 Kubernetes Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Kubernetes Cluster                         │
├─────────────────────────────────────────────────────────────────┤
│  Namespace: ingress-system                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                Ingress Controller                          │ │
│  │                   (nginx)                                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Namespace: frontend                                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Frontend Deployment (2 replicas)                          │ │
│  │  Frontend Service (ClusterIP)                              │ │
│  │  Frontend Ingress                                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Namespace: api                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Gateway Deployment (2 replicas)                           │ │
│  │  Auth Service Deployment (2 replicas)                      │ │
│  │  Backend API Deployment (2 replicas)                       │ │
│  │  Services (ClusterIP)                                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Namespace: data                                                │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL StatefulSet (Primary + Replica)                │ │
│  │  Redis StatefulSet (3 node cluster)                        │ │
│  │  RabbitMQ StatefulSet (3 node cluster)                     │ │
│  │  MinIO StatefulSet (4 node cluster)                        │ │
│  │  Persistent Volumes                                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Namespace: processing                                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Airflow Webserver Deployment                              │ │
│  │  Airflow Scheduler Deployment                              │ │
│  │  Airflow Workers Deployment (Auto-scaling)                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Namespace: monitoring                                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Prometheus StatefulSet                                     │ │
│  │  Grafana Deployment                                         │ │
│  │  AlertManager Deployment                                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Kubernetes Manifests

#### 3.2.1 Namespace Configuration
```yaml
# namespaces.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: frontend
  labels:
    app.kubernetes.io/name: egrid-analytics
    tier: frontend
---
apiVersion: v1
kind: Namespace
metadata:
  name: api
  labels:
    app.kubernetes.io/name: egrid-analytics
    tier: api
---
apiVersion: v1
kind: Namespace
metadata:
  name: data
  labels:
    app.kubernetes.io/name: egrid-analytics
    tier: data
---
apiVersion: v1
kind: Namespace
metadata:
  name: processing
  labels:
    app.kubernetes.io/name: egrid-analytics
    tier: processing
---
apiVersion: v1
kind: Namespace
metadata:
  name: monitoring
  labels:
    app.kubernetes.io/name: egrid-analytics
    tier: monitoring
```

#### 3.2.2 Backend API Deployment
```yaml
# backend-api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-api
  namespace: api
  labels:
    app: backend-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend-api
  template:
    metadata:
      labels:
        app: backend-api
    spec:
      containers:
      - name: backend-api
        image: egrid-analytics/backend-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: POSTGRES_HOST
          value: "postgres.data.svc.cluster.local"
        - name: POSTGRES_PORT
          value: "5432"
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: password
        - name: REDIS_HOST
          value: "redis.data.svc.cluster.local"
        - name: REDIS_PORT
          value: "6379"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: backend-api
  namespace: api
spec:
  selector:
    app: backend-api
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP
```

#### 3.2.3 PostgreSQL StatefulSet
```yaml
# postgres-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: data
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: egrid_analytics
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: password
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        - name: postgres-init
          mountPath: /docker-entrypoint-initdb.d
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
      volumes:
      - name: postgres-init
        configMap:
          name: postgres-init-scripts
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 20Gi
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: data
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
  type: ClusterIP
```

#### 3.2.4 Horizontal Pod Autoscaler
```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-api-hpa
  namespace: api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 2
  maxReplicas: 8
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 3.3 Deployment Commands
```bash
# Deploy to Kubernetes
make run-k8s

# Or deploy manually
kubectl apply -f k8s/namespaces.yaml
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/persistent-volumes/
kubectl apply -f k8s/data/
kubectl apply -f k8s/api/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/processing/
kubectl apply -f k8s/monitoring/

# Check deployment status
kubectl get pods --all-namespaces
kubectl get services --all-namespaces

# Scale services
kubectl scale deployment backend-api --replicas=3 -n api
```

## 4. Environment Configuration

### 4.1 Development Environment
```env
# .env.development
NODE_ENV=development
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=plantuser
POSTGRES_PASSWORD=plantpassword123
POSTGRES_DB=plant_analytics
REDIS_HOST=redis
REDIS_PORT=6379
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
JWT_SECRET=dev-secret-key
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4.2 Production Environment
```env
# .env.production
NODE_ENV=production
POSTGRES_HOST=postgres.data.svc.cluster.local
POSTGRES_PORT=5432
POSTGRES_USER=${POSTGRES_USER_SECRET}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD_SECRET}
POSTGRES_DB=egrid_analytics
REDIS_HOST=redis.data.svc.cluster.local
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD_SECRET}
RABBITMQ_HOST=rabbitmq.data.svc.cluster.local
RABBITMQ_PORT=5672
RABBITMQ_USER=${RABBITMQ_USER_SECRET}
RABBITMQ_PASSWORD=${RABBITMQ_PASSWORD_SECRET}
MINIO_ROOT_USER=${MINIO_ROOT_USER_SECRET}
MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD_SECRET}
JWT_SECRET=${JWT_SECRET}
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
```

## 5. Monitoring and Logging

### 5.1 Prometheus Configuration
```yaml
# prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    scrape_configs:
    - job_name: 'backend-api'
      static_configs:
      - targets: ['backend-api.api.svc.cluster.local:3000']
      metrics_path: /metrics
      
    - job_name: 'api-gateway'
      static_configs:
      - targets: ['api-gateway.api.svc.cluster.local:8000']
      metrics_path: /metrics
      
    - job_name: 'auth-service'
      static_configs:
      - targets: ['auth-service.api.svc.cluster.local:5001']
      metrics_path: /metrics
      
    - job_name: 'postgres'
      static_configs:
      - targets: ['postgres-exporter.data.svc.cluster.local:9187']
      
    - job_name: 'redis'
      static_configs:
      - targets: ['redis-exporter.data.svc.cluster.local:9121']
```

### 5.2 Grafana Dashboards
```json
{
  "dashboard": {
    "title": "eGRID Analytics Platform",
    "panels": [
      {
        "title": "API Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{service}} - {{method}} {{status}}"
          }
        ]
      },
      {
        "title": "Database Connections",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends",
            "legendFormat": "Active Connections"
          }
        ]
      },
      {
        "title": "Cache Hit Ratio",
        "targets": [
          {
            "expr": "redis_keyspace_hits_total / (redis_keyspace_hits_total + redis_keyspace_misses_total)",
            "legendFormat": "Hit Ratio"
          }
        ]
      }
    ]
  }
}
```

## 6. Backup and Disaster Recovery

### 6.1 Database Backup
```yaml
# postgres-backup-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: data
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: postgres-backup
            image: postgres:15-alpine
            command:
            - /bin/bash
            - -c
            - |
              pg_dump -h postgres.data.svc.cluster.local \
                      -U $POSTGRES_USER \
                      -d egrid_analytics \
                      --no-password \
                      --format=custom \
                      --file=/backup/egrid_analytics_$(date +%Y%m%d_%H%M%S).dump
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: password
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: username
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-storage-pvc
          restartPolicy: OnFailure
```

### 6.2 Disaster Recovery Plan
```
┌─────────────────────────────────────────────────────────────────┐
│                    Disaster Recovery Plan                      │
├─────────────────────────────────────────────────────────────────┤
│  RTO (Recovery Time Objective): 4 hours                        │
│  RPO (Recovery Point Objective): 1 hour                        │
├─────────────────────────────────────────────────────────────────┤
│  1. Database Recovery                                           │
│     ├── Restore from latest backup                             │
│     ├── Apply transaction logs                                 │
│     └── Verify data integrity                                  │
├─────────────────────────────────────────────────────────────────┤
│  2. Application Recovery                                        │
│     ├── Deploy to backup cluster                               │
│     ├── Update DNS records                                     │
│     └── Verify service health                                  │
├─────────────────────────────────────────────────────────────────┤
│  3. Data Verification                                           │
│     ├── Run data validation scripts                            │
│     ├── Verify API functionality                               │
│     └── Check monitoring systems                               │
└─────────────────────────────────────────────────────────────────┘
```

## 7. Deployment Checklist

### 7.1 Pre-Deployment
- [ ] Review all configuration changes
- [ ] Run security scans
- [ ] Execute test suite
- [ ] Backup current database
- [ ] Verify resource requirements
- [ ] Check service dependencies

### 7.2 Deployment
- [ ] Deploy infrastructure components
- [ ] Deploy application services
- [ ] Run database migrations
- [ ] Verify service health
- [ ] Update monitoring configurations
- [ ] Test critical user flows

### 7.3 Post-Deployment
- [ ] Monitor error rates
- [ ] Verify performance metrics
- [ ] Check log outputs
- [ ] Test backup procedures
- [ ] Update documentation
- [ ] Notify stakeholders 
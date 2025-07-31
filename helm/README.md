# 🏗️ Helm Charts - Infrastructure as Code

This directory contains Helm charts for deploying the Plant Analytics Platform on Kubernetes using Infrastructure as Code (IaC) principles.

## 📁 Structure

```
helm/
├── plant-analytics-platform/          # Main Helm chart
│   ├── Chart.yaml                     # Chart metadata and dependencies
│   ├── values.yaml                    # Default configuration values
│   ├── templates/                     # Kubernetes resource templates
│   │   ├── _helpers.tpl              # Template helpers
│   │   ├── NOTES.txt                 # Post-installation notes
│   │   ├── frontend-deployment.yaml  # Frontend service
│   │   ├── frontend-service.yaml
│   │   ├── api-gateway-deployment.yaml # API Gateway service
│   │   ├── api-gateway-service.yaml
│   │   ├── auth-service-deployment.yaml # Auth service
│   │   ├── auth-service-service.yaml
│   │   └── ingress.yaml              # External access
├── install.sh                        # Automated installation script
└── uninstall.sh                      # Clean removal script
```

## 🚀 Quick Start

### Prerequisites
- Kubernetes cluster (local or cloud)
- Helm 3.0+
- kubectl configured

### Installation

```bash
# Install the platform
./helm/install.sh

# Check status
kubectl get pods -n plant-analytics

# Access services
kubectl port-forward -n plant-analytics svc/plant-analytics-frontend 4000:4000
kubectl port-forward -n plant-analytics svc/plant-analytics-api-gateway 8000:8000
```

### Uninstallation

```bash
# Remove the platform
./helm/uninstall.sh
```

## ⚙️ Configuration

### Key Configuration Areas

1. **Application Images** (`values.yaml`)
```yaml
services:
  frontend:
    image:
      repository: plant-analytics-platform-frontend
      tag: "latest"
```

2. **Resources** (`values.yaml`)
```yaml
services:
  frontend:
    resources:
      limits:
        cpu: 500m
        memory: 512Mi
```

3. **Database Configuration**
```yaml
postgresql:
  enabled: true
  auth:
    database: plant_analytics
    username: plantuser
```

### Environment-Specific Values

Create custom values files for different environments:

```bash
# Development
helm install plant-analytics ./helm/plant-analytics-platform \
  -f ./helm/plant-analytics-platform/values.yaml \
  -f ./helm/values-dev.yaml

# Production
helm install plant-analytics ./helm/plant-analytics-platform \
  -f ./helm/plant-analytics-platform/values.yaml \
  -f ./helm/values-prod.yaml
```

## 🔧 Customization

### Custom Values Example

```yaml
# values-prod.yaml
services:
  frontend:
    replicaCount: 3
    ingress:
      enabled: true
      hosts:
        - host: plant-analytics.company.com
          paths:
            - path: /
              pathType: Prefix

postgresql:
  primary:
    persistence:
      size: 100Gi
    resources:
      limits:
        cpu: 2000m
        memory: 4Gi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
```

## 📊 Monitoring

The chart includes Prometheus monitoring by default:

```bash
# Access Prometheus
kubectl port-forward -n plant-analytics svc/plant-analytics-prometheus 9090:9090
```

## 🔒 Security

Default security features:
- Non-root containers
- Read-only root filesystems where possible
- Resource limits
- Network policies (optional)
- Pod security contexts

## 🛠️ Development

### Testing Changes

```bash
# Lint the chart
helm lint ./helm/plant-analytics-platform

# Dry run
helm install plant-analytics ./helm/plant-analytics-platform --dry-run

# Template output
helm template plant-analytics ./helm/plant-analytics-platform
```

### Dependencies

Update chart dependencies:

```bash
cd helm/plant-analytics-platform
helm dependency update
```

## 📝 Notes

- **External Dependencies**: PostgreSQL, Redis, RabbitMQ, and MinIO are included as Bitnami chart dependencies
- **Persistent Storage**: Data persists across pod restarts via PersistentVolumeClaims
- **Scalability**: Services can be horizontally scaled via replica counts
- **High Availability**: Multiple replicas for critical services
#!/bin/bash

# Plant Analytics Platform - Helm Installation Script
# This script installs the Plant Analytics Platform using Helm

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CHART_NAME="plant-analytics-platform"
RELEASE_NAME="plant-analytics"
NAMESPACE="plant-analytics"
CHART_PATH="./helm/plant-analytics-platform"

echo -e "${BLUE}🚀 Plant Analytics Platform - Helm Installation${NC}"
echo "=================================================="

# Check if Helm is installed
if ! command -v helm &> /dev/null; then
    echo -e "${RED}❌ Helm is not installed. Please install Helm first.${NC}"
    echo "Visit: https://helm.sh/docs/intro/install/"
    exit 1
fi

echo -e "${GREEN}✅ Helm found: $(helm version --short)${NC}"

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed. Please install kubectl first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ kubectl found${NC}"

# Create namespace if it doesn't exist
echo -e "${YELLOW}📦 Creating namespace: ${NAMESPACE}${NC}"
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

# Add Bitnami repository for dependencies
echo -e "${YELLOW}📚 Adding Bitnami Helm repository...${NC}"
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Install/Upgrade the chart
echo -e "${YELLOW}🛠️  Installing/Upgrading ${CHART_NAME}...${NC}"
helm upgrade --install ${RELEASE_NAME} ${CHART_PATH} \
    --namespace ${NAMESPACE} \
    --create-namespace \
    --wait \
    --timeout 10m \
    --values ${CHART_PATH}/values.yaml

# Check deployment status
echo -e "${YELLOW}🔍 Checking deployment status...${NC}"
kubectl get pods -n ${NAMESPACE}
kubectl get services -n ${NAMESPACE}

echo ""
echo -e "${GREEN}🎉 Installation completed successfully!${NC}"
echo ""
echo -e "${BLUE}📝 Next steps:${NC}"
echo "1. Check deployment status:"
echo "   kubectl get pods -n ${NAMESPACE}"
echo ""
echo "2. Access services (port-forward):"
echo "   kubectl port-forward -n ${NAMESPACE} svc/${RELEASE_NAME}-frontend 4000:4000"
echo "   kubectl port-forward -n ${NAMESPACE} svc/${RELEASE_NAME}-api-gateway 8000:8000"
echo ""
echo "3. Get service URLs:"
echo "   helm get notes ${RELEASE_NAME} -n ${NAMESPACE}"
echo ""
echo "4. View logs:"
echo "   kubectl logs -f deployment/${RELEASE_NAME}-frontend -n ${NAMESPACE}"
echo ""
echo -e "${GREEN}🌐 Frontend will be available at: http://localhost:4000${NC}"
echo -e "${GREEN}🚪 API Gateway will be available at: http://localhost:8000${NC}"
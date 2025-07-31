#!/bin/bash

# Plant Analytics Platform - Helm Uninstallation Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RELEASE_NAME="plant-analytics"
NAMESPACE="plant-analytics"

echo -e "${BLUE}🗑️  Plant Analytics Platform - Helm Uninstallation${NC}"
echo "======================================================"

# Check if Helm is installed
if ! command -v helm &> /dev/null; then
    echo -e "${RED}❌ Helm is not installed.${NC}"
    exit 1
fi

# Check if release exists
if ! helm list -n ${NAMESPACE} | grep -q ${RELEASE_NAME}; then
    echo -e "${YELLOW}⚠️  Release ${RELEASE_NAME} not found in namespace ${NAMESPACE}${NC}"
    exit 0
fi

echo -e "${YELLOW}🔍 Found release: ${RELEASE_NAME}${NC}"

# Uninstall the release
echo -e "${YELLOW}🗑️  Uninstalling ${RELEASE_NAME}...${NC}"
helm uninstall ${RELEASE_NAME} -n ${NAMESPACE}

# Ask if user wants to delete the namespace
read -p "Do you want to delete the namespace '${NAMESPACE}'? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🗑️  Deleting namespace: ${NAMESPACE}${NC}"
    kubectl delete namespace ${NAMESPACE} --ignore-not-found=true
fi

# Ask if user wants to delete PVCs (data)
read -p "Do you want to delete all Persistent Volume Claims (this will delete all data)? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🗑️  Deleting PVCs...${NC}"
    kubectl delete pvc --all -n ${NAMESPACE} --ignore-not-found=true
fi

echo ""
echo -e "${GREEN}✅ Uninstallation completed!${NC}"
echo ""
echo -e "${BLUE}📝 If you want to reinstall:${NC}"
echo "   ./helm/install.sh"
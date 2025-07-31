#!/bin/bash

set -euo pipefail

PROJECT_NAME="aiq"
COMPOSE_FILE="docker-compose.yml"
K8S_OUTPUT_DIR="k8s"
SELECTED_DEPLOYMENTS=("backend-api" "api-gateway" "frontend" "airflow-webserver" "airflow-scheduler")

brew install yq

echo "🚀 Starting Minikube with 4 CPUs and 4GB RAM..."
minikube start --cpus=4 --memory=4096

echo "✅ Enabling Minikube addons..."
minikube addons enable ingress
minikube addons enable dashboard
minikube addons enable default-storageclass
minikube addons enable storage-provisioner

echo "🔁 Setting up Docker env for Minikube..."
eval "$(minikube docker-env)"

echo "🐳 Building local Docker images..."
docker build -t backend-api ./apps/backend-api
docker build -t api-gateway ./apps/api-gateway
docker build -t frontend ./apps/frontend
docker build -t docker-airflow-webserver ./apps/data-processing
docker build -t docker-airflow-scheduler ./apps/data-processing

echo "🔄 Converting docker-compose to Kubernetes YAML with Kompose..."
rm -rf "$K8S_OUTPUT_DIR"
mkdir -p "$K8S_OUTPUT_DIR"
kompose convert -f "$COMPOSE_FILE" -o "$K8S_OUTPUT_DIR/"

echo "🛠️  Patching imagePullPolicy: Never in selected deployments..."
for name in "${SELECTED_DEPLOYMENTS[@]}"; do
  file="$K8S_OUTPUT_DIR/${name}-deployment.yaml"
  if [[ -f "$file" ]]; then
    echo "📁 Patching: $file"
    yq e '(.spec.template.spec.containers[] | select(.image)).imagePullPolicy = "Never"' -i "$file"
  else
    echo "⚠️  Deployment file not found: $file"
  fi
done

yq eval '
  (.spec.template.spec.containers[] | select(.name == "postgres") | .livenessProbe) = {
    "exec": {
      "command": ["pg_isready", "-U", "plantuser", "-d", "plant_analytics"]
    },
    "initialDelaySeconds": 10,
    "periodSeconds": 10,
    "timeoutSeconds": 5,
    "failureThreshold": 5
  }
' -i k8s/postgres-deployment.yaml

echo "📦 Applying Kubernetes manifests..."
kubectl apply -f "$K8S_OUTPUT_DIR/"

echo "⏳ Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l io.kompose.service=backend-api --timeout=180s || true
kubectl wait --for=condition=ready pod -l io.kompose.service=frontend --timeout=180s || true
kubectl wait --for=condition=ready pod -l io.kompose.service=api-gateway --timeout=180s || true

echo "📡 Exposing backend, frontend, and gateway services..."
minikube service list | grep "${PROJECT_NAME}-"

echo "📊 Launching Minikube dashboard (in background)..."
minikube dashboard &>/dev/null &

echo "✅ Deployment complete!"
echo "🌐 Access URLs:"
minikube service backend-api --url
minikube service frontend --url
minikube service api-gateway --url

#!/bin/bash
set -euo pipefail

# Azure staging deploy script for J3 demo.
# Fill these values before running the script.
AZURE_RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-rg-hrflow}"
AZURE_LOCATION="${AZURE_LOCATION:-francecentral}"
ACR_NAME="${ACR_NAME:-<your-acr-name>}"
GATEWAY_APP_NAME="${GATEWAY_APP_NAME:-hrflow-api-gateway-staging}"
FRONTEND_APP_NAME="${FRONTEND_APP_NAME:-hrflow-frontend-staging}"
CONTAINER_ENV_NAME="${CONTAINER_ENV_NAME:-hrflow-staging-env}"
GATEWAY_IMAGE="${ACR_NAME}.azurecr.io/hrflow-api-gateway:staging"
FRONTEND_IMAGE="${ACR_NAME}.azurecr.io/hrflow-frontend:staging"

if [[ "$ACR_NAME" == "<your-acr-name>" ]]; then
  echo "Set ACR_NAME before running this script."
  exit 1
fi

echo "Logging in to Azure..."
az login

echo "Logging in to ACR..."
az acr login --name "$ACR_NAME"

echo "Building and pushing gateway image..."
docker build -t "$GATEWAY_IMAGE" -f services/api-gateway/Dockerfile services/api-gateway
docker push "$GATEWAY_IMAGE"

echo "Building and pushing frontend image..."
docker build -t "$FRONTEND_IMAGE" -f frontend/Dockerfile frontend
docker push "$FRONTEND_IMAGE"

echo "Deploying API gateway to Azure Container Apps..."
az containerapp up \
  --name "$GATEWAY_APP_NAME" \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --location "$AZURE_LOCATION" \
  --image "$GATEWAY_IMAGE" \
  --target-port 3000 \
  --ingress external \
  --environment "$CONTAINER_ENV_NAME"

echo "Deploying frontend to Azure Container Apps..."
az containerapp up \
  --name "$FRONTEND_APP_NAME" \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --location "$AZURE_LOCATION" \
  --image "$FRONTEND_IMAGE" \
  --target-port 80 \
  --ingress external \
  --environment "$CONTAINER_ENV_NAME"

echo "✅ Staging deployment command completed."

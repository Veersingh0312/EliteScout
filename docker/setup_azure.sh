#!/bin/bash
# Azure Infrastructure Deployment Script
# This script provisions an Azure Web App for Containers running the Football MLOps Platform.

# Define variables
RESOURCE_GROUP="rg-football-mlops"
LOCATION="eastus"
APP_SERVICE_PLAN="asp-football-mlops"
WEB_APP_NAME="football-mlops-app"

# 1. Create a Resource Group
echo "Creating Resource Group: $RESOURCE_GROUP in $LOCATION..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# 2. Create an App Service Plan (B1 tier is cost-effective for portfolio projects)
echo "Creating App Service Plan: $APP_SERVICE_PLAN..."
az appservice plan create \
    --name $APP_SERVICE_PLAN \
    --resource-group $RESOURCE_GROUP \
    --sku B1 \
    --is-linux

# 3. Create the Web App for Containers
# Pulls the image from the DockerHub registry setup in the CI pipeline
echo "Creating Web App: $WEB_APP_NAME..."
az webapp create \
    --resource-group $RESOURCE_GROUP \
    --plan $APP_SERVICE_PLAN \
    --name $WEB_APP_NAME \
    --deployment-container-image-name "elitescout/football-mlops:latest"

# 4. Configure Web App Settings (expose port 8000 for FastAPI)
echo "Configuring PORT to 8000..."
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $WEB_APP_NAME \
    --settings WEBSITES_PORT=8000

echo "Deployment configuration script complete!"
echo "Your app will be available at: https://$WEB_APP_NAME.azurewebsites.net"

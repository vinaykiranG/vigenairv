#!/bin/bash

# ViGenAiR Personalization Service Deployment Script
# This script deploys the personalization FastAPI service to Google Cloud Run

set -e

# Configuration
PROJECT_ID=${GCP_PROJECT_ID:-"demos-dev-467317"}
SERVICE_NAME="vigenair-personalization"
REGION=${REGION:-"us-central1"}
BUCKET_NAME=${LOGO_GCS_BUCKET_NAME:-"vigenair-client-logos"}

echo "🚀 Deploying ViGenAiR Personalization Service..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Set the project
echo "📝 Setting project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Create GCS bucket for logos if it doesn't exist
echo "🪣 Creating GCS bucket for logos: $BUCKET_NAME"
gsutil mb gs://$BUCKET_NAME 2>/dev/null || echo "Bucket already exists or you don't have permission to create it"

# Make bucket publicly readable (for logo URLs)
echo "🔓 Setting bucket permissions..."
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME 2>/dev/null || echo "Permission already set or insufficient privileges"

# Build and deploy to Cloud Run
echo "🏗️  Building and deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID,LOGO_GCS_BUCKET_NAME=$BUCKET_NAME" \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=10 \
    --port=8000

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo "✅ Deployment complete!"
echo "🌐 Service URL: $SERVICE_URL"
echo ""
echo "📋 Next steps:"
echo "1. Update your Angular environment files with the service URL"
echo "2. Test the API endpoints:"
echo "   - GET  $SERVICE_URL/api/settings"
echo "   - POST $SERVICE_URL/api/settings"
echo "   - DELETE $SERVICE_URL/api/settings"
echo ""
echo "🔧 Environment variables set:"
echo "   - GCP_PROJECT_ID: $PROJECT_ID"
echo "   - LOGO_GCS_BUCKET_NAME: $BUCKET_NAME"
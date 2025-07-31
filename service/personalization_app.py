import os
import uuid
import logging
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from google.cloud import storage, firestore

# --- Configuration ---
# It's highly recommended to set these as environment variables for production
# For local development, you can set them in your shell:
# export GCP_PROJECT_ID="your-project-id"
# export LOGO_GCS_BUCKET_NAME="your-client-logos-bucket-name"
# export FIRESTORE_COLLECTION_NAME="appSettings"
# export FIRESTORE_DATABASE_ID="test-db" # Explicitly specify database if not (default)

GCP_PROJECT_ID = os.environ.get('GCP_PROJECT_ID', 'demos-dev-467317')
LOGO_GCS_BUCKET_NAME = os.environ.get('LOGO_GCS_BUCKET_NAME', 'vigenair-client-logos')
FIRESTORE_COLLECTION_NAME = os.environ.get('FIRESTORE_COLLECTION_NAME', 'appSettings')
FIRESTORE_DATABASE_ID = os.environ.get('FIRESTORE_DATABASE_ID', 'test-db')

app = FastAPI(
    title="ViGenAiR Personalization API",
    description="API for managing UI personalization settings.",
    version="1.0.0",
)

# --- IMPORTANT: CORS Configuration ---
# In production, restrict origins to your Angular app's domain(s)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development.
                          # Change to ["http://localhost:4200", "https://your-angular-app.com"] in production.
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers (e.g., Authorization)
)

# --- Initialize Google Cloud Clients ---
storage_client = storage.Client(project=GCP_PROJECT_ID)
firestore_client = firestore.Client(project=GCP_PROJECT_ID, database=FIRESTORE_DATABASE_ID)

logging.basicConfig(level=logging.INFO)

# Helper function to upload to GCS
async def upload_gcs_file(
    file: UploadFile,
    destination_blob_name: str,
    bucket_name: str,
) -> str:
    """Uploads a file to the given GCS bucket and returns its public URL."""
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)

    # Upload file content
    file_content = await file.read()
    blob.upload_from_string(file_content, content_type=file.content_type)

    # Make the blob publicly accessible (read-only) for direct image display
    # WARNING: Only do this for public assets. For private assets, use signed URLs.
    blob.make_public()

    public_url = blob.public_url
    logging.info('UPLOAD - Uploaded "%s" to "%s". Public URL: %s', file.filename, destination_blob_name, public_url)
    return public_url

# --- API Endpoints ---

@app.post("/api/settings", summary="Save or update user personalization settings")
async def save_settings(
    # FastAPI automatically parses FormData fields
    brand_name: str = Form(...),
    primary_color: str = Form(...),
    # Optional fields
    logo_file: Optional[UploadFile] = File(None),
    # In a real app, userId would come from an auth token (dependency injection)
    # For testing, we allow it via query param or default
    user_id: str = Form("test_user_123")
):
    # --- 1. Validate Input (FastAPI handles basic required fields with ...)
    if not brand_name or not primary_color:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Brand name and primary color are required."
        )

    logo_url = ""
    if logo_file:
        try:
            # Generate a unique destination name in GCS
            # Ensure the bucket exists in GCS
            unique_filename = f"client_logos/{user_id}/{uuid.uuid4()}_{logo_file.filename}"
            
            # Upload to GCS
            logo_url = await upload_gcs_file(
                logo_file,
                unique_filename,
                LOGO_GCS_BUCKET_NAME,
            )
        except Exception as e:
            logging.error(f"Error uploading logo to GCS: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload logo: {str(e)}"
            )

    # --- 2. Store Settings in Firestore ---
    settings_data = {
        'brandName': brand_name,
        'primaryColor': primary_color,
        'logoUrl': logo_url,  # Will be empty string if no logo uploaded
        'updatedAt': firestore.SERVER_TIMESTAMP
    }

    try:
        doc_ref = firestore_client.collection(FIRESTORE_COLLECTION_NAME).document(user_id)
        doc_ref.set(settings_data, merge=True)  # Use merge=True to update fields without overwriting the whole document
        logging.info(f"Settings saved for user {user_id}: {settings_data}")
        return JSONResponse(content=settings_data, status_code=status.HTTP_200_OK)
    except Exception as e:
        logging.error(f"Error saving settings to Firestore: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save settings: {str(e)}"
        )

@app.get("/api/settings", summary="Retrieve user personalization settings")
async def get_settings(
    # In a real app, userId would come from an auth token (dependency injection)
    user_id: str = "test_user_123"
):
    try:
        doc_ref = firestore_client.collection(FIRESTORE_COLLECTION_NAME).document(user_id)
        doc = doc_ref.get()

        if doc.exists:
            settings = doc.to_dict()
            logging.info(f"Settings retrieved for user {user_id}: {settings}")
            return JSONResponse(content=settings, status_code=status.HTTP_200_OK)
        else:
            # Return default settings if no custom settings found
            default_settings = {
                'brandName': 'ViGenAiR',
                'primaryColor': '#1976D2',  # Default blue
                'logoUrl': 'https://services.google.com/fh/files/misc/vigenair_logo.png',
            }
            logging.info(f"No custom settings found for user {user_id}. Returning defaults.")
            return JSONResponse(content=default_settings, status_code=status.HTTP_200_OK)
    except Exception as e:
        logging.error(f"Error retrieving settings from Firestore: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve settings: {str(e)}"
        )

@app.delete("/api/settings", summary="Reset user personalization settings to defaults")
async def reset_settings(
    user_id: str = "test_user_123"
):
    try:
        doc_ref = firestore_client.collection(FIRESTORE_COLLECTION_NAME).document(user_id)
        doc_ref.delete()
        logging.info(f"Settings reset for user {user_id}")
        
        # Return default settings
        default_settings = {
            'brandName': 'ViGenAiR',
            'primaryColor': '#1976D2',
            'logoUrl': 'https://services.google.com/fh/files/misc/vigenair_logo.png',
        }
        return JSONResponse(content=default_settings, status_code=status.HTTP_200_OK)
    except Exception as e:
        logging.error(f"Error resetting settings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset settings: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
# ViGenAiR UI Personalization

This feature allows users to customize the ViGenAiR application with their own branding, including:

- **Custom Logo**: Upload and display company/brand logos
- **Brand Name**: Customize the application title and branding
- **Theme Colors**: Change the primary color scheme of the application

## Architecture Overview

```
┌─────────────────┐    HTTP/FormData    ┌──────────────────┐    
│   Angular UI    │ ──────────────────> │   FastAPI        │
│                 │                     │   Service        │
│ - Settings UI   │ <────────────────── │                  │
│ - Dynamic Theme │    JSON Response    │ - File Upload    │
│ - Logo Display  │                     │ - Settings CRUD  │
└─────────────────┘                     └──────────────────┘
                                                │
                                                ▼
                        ┌─────────────────────────────────────┐
                        │        Google Cloud Platform       │
                        │                                     │
                        │  ┌─────────────┐ ┌──────────────┐  │
                        │  │     GCS     │ │  Firestore   │  │
                        │  │             │ │              │  │
                        │  │ Logo Files  │ │   Settings   │  │
                        │  │             │ │   Metadata   │  │
                        │  └─────────────┘ └──────────────┘  │
                        └─────────────────────────────────────┘
```

## Components

### 1. FastAPI Backend Service (`service/personalization_app.py`)

**Features:**
- RESTful API for settings management
- File upload handling for logos
- Google Cloud Storage integration
- Firestore database integration
- CORS support for Angular frontend

**Endpoints:**
- `POST /api/settings` - Save/update personalization settings
- `GET /api/settings` - Retrieve current settings
- `DELETE /api/settings` - Reset settings to defaults

**Environment Variables:**
- `GCP_PROJECT_ID` - Google Cloud Project ID
- `LOGO_GCS_BUCKET_NAME` - GCS bucket for logo storage
- `FIRESTORE_COLLECTION_NAME` - Firestore collection name
- `FIRESTORE_DATABASE_ID` - Firestore database ID

### 2. Angular Frontend Service (`ui/src/ui/src/app/personalization/personalization.service.ts`)

**Features:**
- HTTP client for API communication
- Reactive state management with RxJS
- Real-time DOM updates for theming
- Settings caching and synchronization

**Key Methods:**
- `saveSettings()` - Save personalization settings
- `getSettings()` - Fetch current settings
- `resetSettings()` - Reset to defaults
- `applySettings()` - Apply theme changes to DOM

### 3. Angular UI Components

**Settings Sidenav:**
- Logo upload with preview
- Brand name input field
- Color picker for theme selection
- Save/Reset action buttons
- Status feedback messages

**Dynamic Updates:**
- Real-time logo updates in toolbar
- Brand name changes in title and header
- CSS custom properties for theme colors

## Setup Instructions

### 1. Backend Setup

1. **Install dependencies:**
   ```bash
   cd service
   pip install -r requirements_personalization.txt
   ```

2. **Set environment variables:**
   ```bash
   export GCP_PROJECT_ID="your-project-id"
   export LOGO_GCS_BUCKET_NAME="your-logos-bucket"
   export FIRESTORE_COLLECTION_NAME="appSettings"
   export FIRESTORE_DATABASE_ID="test-db"
   ```

3. **Run locally:**
   ```bash
   python personalization_app.py
   ```

4. **Deploy to Cloud Run:**
   ```bash
   ./deploy_personalization.sh
   ```

### 2. Frontend Setup

1. **Install Angular dependencies:**
   ```bash
   cd ui
   npm install
   ```

2. **Update environment configuration:**
   ```typescript
   // src/environments/environment.ts
   export const environment = {
     production: false,
     personalizationApiUrl: 'http://localhost:8000/api'
   };
   ```

3. **Import HttpClientModule in app.module.ts** (if not using standalone components)

### 3. Google Cloud Setup

1. **Create GCS bucket:**
   ```bash
   gsutil mb gs://your-logos-bucket
   gsutil iam ch allUsers:objectViewer gs://your-logos-bucket
   ```

2. **Enable Firestore:**
   ```bash
   gcloud firestore databases create --region=us-central1
   ```

3. **Set up authentication:**
   - Service account with Storage Admin and Firestore User roles
   - Application Default Credentials for local development

## Usage

### For End Users

1. **Access Settings:**
   - Click the settings icon in the top toolbar
   - Settings panel opens from the left side

2. **Upload Logo:**
   - Click "Upload Logo" button
   - Select image file (PNG, JPG, etc.)
   - Preview appears immediately

3. **Set Brand Name:**
   - Enter company/brand name in text field
   - Updates application title and header

4. **Choose Theme Color:**
   - Use color picker to select primary color
   - Preview shows selected color value

5. **Save Changes:**
   - Click "Save" to persist settings
   - Success message confirms save
   - Settings panel closes automatically

6. **Reset to Defaults:**
   - Click "Reset" to restore original settings
   - Confirmation message appears

### For Developers

**Accessing Current Settings:**
```typescript
// In any component
constructor(private personalizationService: PersonalizationService) {}

ngOnInit() {
  this.personalizationService.settings$.subscribe(settings => {
    console.log('Current settings:', settings);
  });
}
```

**Manual Settings Update:**
```typescript
// Programmatically update settings
this.personalizationService.saveSettings(
  'My Company',
  '#FF5722',
  logoFile
).subscribe(result => {
  console.log('Settings saved:', result);
});
```

**Listen for Settings Changes:**
```typescript
// Listen for real-time updates
window.addEventListener('settingsUpdated', (event: any) => {
  const settings = event.detail;
  // React to settings changes
});
```

## API Reference

### POST /api/settings

Save or update personalization settings.

**Request:**
```
Content-Type: multipart/form-data

brand_name: string (required)
primary_color: string (required, hex format)
logo_file: File (optional)
user_id: string (optional, defaults to "test_user_123")
```

**Response:**
```json
{
  "brandName": "My Company",
  "primaryColor": "#1976D2",
  "logoUrl": "https://storage.googleapis.com/bucket/path/to/logo.png",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### GET /api/settings

Retrieve current personalization settings.

**Parameters:**
- `user_id` (optional): User identifier

**Response:**
```json
{
  "brandName": "ViGenAiR",
  "primaryColor": "#1976D2",
  "logoUrl": "https://services.google.com/fh/files/misc/vigenair_logo.png"
}
```

### DELETE /api/settings

Reset settings to defaults.

**Parameters:**
- `user_id` (optional): User identifier

**Response:**
```json
{
  "brandName": "ViGenAiR",
  "primaryColor": "#1976D2",
  "logoUrl": "https://services.google.com/fh/files/misc/vigenair_logo.png"
}
```

## Security Considerations

1. **File Upload Security:**
   - File type validation (images only)
   - File size limits
   - Virus scanning (recommended for production)

2. **Authentication:**
   - Implement proper user authentication
   - Replace hardcoded user IDs with auth tokens

3. **CORS Configuration:**
   - Restrict origins in production
   - Use specific domains instead of wildcard

4. **Storage Security:**
   - Consider private buckets with signed URLs
   - Implement access controls for sensitive branding

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Check CORS configuration in FastAPI
   - Verify allowed origins match your domain

2. **File Upload Failures:**
   - Check GCS bucket permissions
   - Verify service account credentials

3. **Settings Not Persisting:**
   - Check Firestore permissions
   - Verify database configuration

4. **Theme Not Updating:**
   - Check CSS custom properties
   - Verify service is applying styles correctly

### Debug Mode

Enable debug logging:
```python
# In personalization_app.py
logging.basicConfig(level=logging.DEBUG)
```

```typescript
// In Angular service
console.log('Settings updated:', settings);
```

## Future Enhancements

- [ ] Multiple theme presets
- [ ] Advanced color customization (secondary, accent colors)
- [ ] Font family selection
- [ ] Layout customization options
- [ ] Bulk settings import/export
- [ ] Multi-tenant support
- [ ] Settings versioning and rollback
- [ ] A/B testing for different themes

## Contributing

1. Follow existing code style and patterns
2. Add tests for new functionality
3. Update documentation for API changes
4. Test across different browsers and devices
5. Consider accessibility in UI changes

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details.
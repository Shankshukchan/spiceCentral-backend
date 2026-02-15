Environment variables for the backend

Files:

- `.env.example` — example env file (copy to `.env` and edit)
- `.env` — local development env (gitignored; provided here for convenience)

Variables:

- PORT: Port the Express server listens on (default: 8080)
- MONGODB_URI: MongoDB connection string (default: mongodb://localhost:27017/spiceCentral)
- UPLOADS_DIR: Directory name (relative to backend/) used to store uploaded files and served at `/<UPLOADS_DIR>` (default: uploads)

Cloudinary (optional, recommended for durable uploads):

- To use Cloudinary for uploads, set one of the following environment variables:
  - `CLOUDINARY_URL` (preferred) or set all three below:
    - `CLOUDINARY_CLOUD_NAME`
    - `CLOUDINARY_API_KEY`
    - `CLOUDINARY_API_SECRET`
- Optional: `CLOUDINARY_FOLDER` — folder name in Cloudinary to place uploaded images (default: `spicecentral`).

When Cloudinary is configured the backend will upload images to Cloudinary and store the returned secure URL in the database instead of writing files to the server filesystem.

Notes:

- After creating `.env`, restart the backend server to pick up changes.
- The frontend expects uploads to be served under the path specified by `VITE_UPLOADS_PATH` (see frontend README_ENV.md).

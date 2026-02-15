Environment variables for the backend

Files:

- `.env.example` — example env file (copy to `.env` and edit)
- `.env` — local development env (gitignored; provided here for convenience)

Variables:

- PORT: Port the Express server listens on (default: 8080)
- MONGODB_URI: MongoDB connection string (default: mongodb://localhost:27017/spiceCentral)
- UPLOADS_DIR: Directory name (relative to backend/) used to store uploaded files and served at `/<UPLOADS_DIR>` (default: uploads)

Notes:

- After creating `.env`, restart the backend server to pick up changes.
- The frontend expects uploads to be served under the path specified by `VITE_UPLOADS_PATH` (see frontend README_ENV.md).

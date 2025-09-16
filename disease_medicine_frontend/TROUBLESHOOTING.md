# Troubleshooting: 404 on /static/js/bundle.js and blank page

## Summary
If you visit a backend port (e.g., 3001) expecting to see the React app, you may get `404` for `/static/js/bundle.js`. The backend is not configured in this project to serve React static files. Run the React dev server on its own port (default 3000) or configure the backend to host the built frontend.

## Architecture
- Frontend (this repo): React app served by Create React App (CRA) dev server.
  - Default dev port: 3000
  - Optional dev port: `npm run start:3001`
- Backend (separate service): Python API serving endpoints under `/api/...`.
  - Not part of this repository.
  - Not expected to serve React assets unless you build and deploy the frontend into the backend.

## Common scenarios

### A) Local dev on separate ports (recommended)
1. Start frontend (from `disease_medicine_frontend`):
   - `npm install`
   - `npm start`  # serves at http://localhost:3000
2. Start backend separately (e.g., http://localhost:8000).
3. If backend is on a different origin, create `.env` in `disease_medicine_frontend`:
   ```
   REACT_APP_API_BASE_URL=http://localhost:8000
   ```
   Restart `npm start` after adding or changing env vars.

### B) Serve frontend on port 3001 (still frontend)
- `npm run start:3001`
- Open http://localhost:3001
- Note: This is still the frontend CRA dev server. The backend remains a separate service.

### C) Single-origin deployment (backend hosts the frontend build)
1. Build the frontend:
   - `npm run build`
2. Configure your backend (Flask/FastAPI/etc.) to serve `build/` as static files and route `index.html` for SPA routes.
3. Visit the backend origin for both static assets and APIs.

## Why do I see 404 for /static/js/bundle.js on port 3001?
- Because the process on port 3001 is not the CRA dev server, or is a backend server that doesn’t host the React build.
- Start CRA on that port with `npm run start:3001`, or open the frontend on port 3000 (`npm start`).

## Blank page notes
- The app includes an ErrorBoundary and a visible “Frontend OK” banner to avoid a blank page.
- If you still see a blank page:
  - Ensure you are opening the frontend dev server URL (port 3000 or the port where CRA runs).
  - Check browser console for errors.
  - Verify Node 16+ and npm 8+ for CRA 5 compatibility.

## Proxy/subpath deployments
- The app uses `"homepage": "."` and detects proxy base paths like `/proxy/<port>/` to keep same-origin calls under that path.
- If your backend is at a different origin, set `REACT_APP_API_BASE_URL` accordingly.


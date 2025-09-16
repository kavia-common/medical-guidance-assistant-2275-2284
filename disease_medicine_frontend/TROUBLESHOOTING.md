# Troubleshooting: 404 on /static/js/* and blank page

## Summary
If you visit a port where the React dev server (CRA) is not actually running, you will see `404` for `/static/js/*` and get a blank page. Ensure CRA is serving on that port and open the root URL it prints in the terminal.

## Architecture
- Frontend (this repo): React app served by Create React App (CRA) dev server.
  - Default dev port: 3000
  - Optional dev ports via scripts: `npm run start:3001`, `PORT=3002 npm run start:port`
- Backend (separate service): FastAPI serving endpoints under `/api/...`.
  - Not expected to serve React assets in dev unless you build and deploy the frontend.

## Common scenarios

### A) Local dev on separate ports (recommended)
1. Start frontend (from `disease_medicine_frontend`):
   - `npm install`
   - `npm start`  # http://localhost:3000
2. Start backend separately (e.g., http://localhost:8000).
3. If backend is on a different origin, create `.env` in `disease_medicine_frontend`:
   ```
   REACT_APP_API_BASE_URL=http://localhost:8000
   ```
   Restart `npm start` after adding or changing env vars.

### B) CRA on a specific port (e.g., 3001 or 3002)
- `npm run start:3001` => http://localhost:3001
- `PORT=3002 npm run start:port` => http://localhost:3002

Note: Using `PORT=3002 npm start` may not work on Windows without `cross-env`. Use the scripts above.

### C) Single-origin deployment (backend hosts frontend build)
1. `npm run build`
2. Serve `build/` via your backend and route `index.html` for SPA paths.
3. Visit your backend origin for both assets and APIs.

## Why do I see 404 for /static/js/* on an alternate port (e.g., 3002)?
- The process on that port is not the CRA dev server (it could be a backend or reverse proxy).
- CRA isn’t actually listening on that port (the port variable didn’t take effect, or the port was occupied).
- You navigated to `/index.html` instead of the root `/` (always use `/` in dev).

## Diagnostics checklist
1. Start CRA on your desired port:
   - macOS/Linux: `PORT=3002 npm run start:port`
   - Windows: `npx cross-env PORT=3002 react-scripts start`
2. Verify terminal output shows:
   ```
   Local:   http://localhost:3002
   ```
3. Open exactly the URL printed (root `/`, not `/index.html`).
4. Confirm which process owns the port:
   - macOS/Linux: `lsof -i :3002`
   - Windows: `netstat -ano | findstr :3002`
   - If it isn’t node/react-scripts, stop it or choose a different port.
5. Check the browser devtools Network tab:
   - If `/static/js/main.*.js` or `/static/js/bundle.js` are 404 => a different server is serving that port.
6. Clear browser cache and hard-reload if needed.

## Blank page notes
- This app shows a visible “Frontend OK” banner when React is mounted. If it isn’t visible, your bundle likely didn’t load (see diagnostics above).
- Node 16+ and npm 8+ are recommended for react-scripts 5.

## Proxy/subpath deployments
- `"homepage": "."` ensures relative asset paths (works behind `/proxy/<port>/`).
- The app detects `/proxy/<port>/` in the URL and preserves it for same-origin API calls.
- If the backend is on a different origin, set `REACT_APP_API_BASE_URL`.

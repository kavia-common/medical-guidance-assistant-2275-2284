# Disease Medicine Frontend (React)

A minimal React frontend for selecting a disease, viewing recommended medicines and quantities, and requesting additional explanations from a backend using OpenAI + LangChain.

## Features
- Disease dropdown loaded from backend
- Medicine list with recommended quantities
- Explanation chat box that preserves conversation context per disease
- Minimal, clean UI with light/dark theme toggle
- Configurable backend base URL via environment variable

## Quick Start

Install and run:
```bash
npm install
npm start
```

Open http://localhost:3000 in your browser.

If you want to run on an alternate port (e.g., 3002), use:
- PORT=3002 npm run start:port
Then open http://localhost:3002

If you see a message like “Something is already running on port 3000…”, it means another process is using that port. You can either stop the existing process, or run this app on an alternate port:

- To run on a specific port without interactive prompts:
  ```bash
  npm run start:3001   # serves at http://localhost:3001
  ```
  or set PORT yourself:
  ```bash
  PORT=3002 npm run start:port
  ```

To stop a process on port 3000 (examples):
- macOS/Linux:
  ```bash
  lsof -i :3000
  kill -9 <PID>
  ```
- Windows (PowerShell):
  ```powershell
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  ```

## Connect to the Backend API (Local Dev)

The FastAPI backend for this project is intended to run on port 3001.

1) Create a `.env` in this folder (disease_medicine_frontend):
```
REACT_APP_API_BASE_URL=http://localhost:3001
```

2) Restart the dev server if it was already running:
```
npm start
```

- With the variable set, the app will call:
  - GET http://localhost:3001/api/diseases
  - GET http://localhost:3001/api/medicines?disease_id=<id>
  - POST http://localhost:3001/api/explain

- Without the variable set, the app falls back to same-origin requests and will also automatically preserve a proxy base path like `/proxy/3001` when present (useful under certain dev proxy environments).

## Environment Variables
- Preferred (when backend is on a different origin/port):
  ```
  REACT_APP_API_BASE_URL=http://localhost:3001
  ```
- If omitted, the frontend will call the same origin (e.g., when the site is hosted by the backend or behind a proxy).
- When hosted under a proxy subpath like `/proxy/3001/`, the app preserves that base path for same-origin calls (so API requests default to `/proxy/3001/api/...`).

## Troubleshooting a blank page
- If the page is blank, open the browser console. The app includes an ErrorBoundary which will render a visible error if a render-time exception occurs.
- If you see “Root element with id='root' not found”, ensure your `public/index.html` contains `<div id="root"></div>`. The app now also shows this message inline to avoid a blank page.
- If API requests fail, the UI should still render and show a banner “Frontend OK” at the top. Configure `REACT_APP_API_BASE_URL` when calling a backend on another origin.
- Verify Node 16+ and npm 8+ for react-scripts 5 compatibility.

## Deployment under a subpath or proxy
- This app sets `"homepage": "."` in `package.json` so that assets are referenced using relative paths during build and dev, which is necessary when the site is served at a subpath (e.g., `/proxy/3001/`).
- No Router basename is required because this app does not use a router.

## Expected Backend API

The frontend expects these endpoints:

- GET `${REACT_APP_API_BASE_URL}/api/diseases`
  - Response:
    ```json
    { "diseases": [ { "id": "flu", "name": "Influenza" }, { "id": "cold", "name": "Common Cold" } ] }
    ```
- GET `${REACT_APP_API_BASE_URL}/api/medicines?disease_id=<id>`
  - Response:
    ```json
    { "disease_id": "flu", "medicines": [ { "name": "Oseltamivir", "quantity": "75 mg, 2x daily" } ] }
    ```
- POST `${REACT_APP_API_BASE_URL}/api/explain`
  - Request body:
    ```json
    {
      "disease_id": "flu",
      "message": "Why this dosage?",
      "history": [ { "role": "user", "content": "previous question" }, { "role": "assistant", "content": "answer" } ]
    }
    ```
  - Response:
    ```json
    { "answer": "Because ...", "disease_id": "flu" }
    ```

## Notes
- The conversation resets when the selected disease changes but a system note remains for context.
- The UI is intentionally minimal for rapid prototyping.

## Scripts
- `npm start` - start dev server (defaults to port 3000; will prompt if occupied)
- `npm run start:3001` - start dev server on port 3001 (no prompt)
- `PORT=3002 npm run start:port` - start dev server on any port (no prompt)
- `npm run build` - production build
- `npm test` - tests

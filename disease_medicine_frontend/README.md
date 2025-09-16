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

## Environment Variables
Create a `.env` file at the project root if you are not using same-origin:
```
REACT_APP_API_BASE_URL=http://localhost:8000
```
If omitted, the frontend will call the same origin (e.g., when served by the backend).

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

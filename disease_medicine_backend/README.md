# Disease Medicine Backend (FastAPI)

A minimal Python FastAPI backend exposing endpoints required by the Disease Medicine Assistant frontend.

## Endpoints

- GET `/api/diseases`
  - Returns:
    ```json
    { "diseases": [ { "id": "flu", "name": "Influenza" }, { "id": "cold", "name": "Common Cold" }, { "id": "covid19", "name": "COVID-19" } ] }
    ```

- GET `/api/medicines?disease_id=<id>`
  - Example:
    ```
    /api/medicines?disease_id=flu
    ```
  - Returns:
    ```json
    {
      "disease_id": "flu",
      "medicines": [
        { "name": "Oseltamivir", "quantity": "75 mg, twice daily for 5 days" },
        { "name": "Acetaminophen", "quantity": "500 mg, every 6–8 hours as needed" }
      ]
    }
    ```

- POST `/api/explain`
  - Calls OpenAI's Chat Completions API to generate an explanation.
  - Request:
    ```json
    {
      "disease_id": "flu",
      "message": "Why this dosage?",
      "history": [
        { "role": "user", "content": "previous question" },
        { "role": "assistant", "content": "answer" }
      ]
    }
    ```
  - Response:
    ```json
    { "answer": "Because ...", "disease_id": "flu" }
    ```
  - Errors:
    - `500` if `OPENAI_API_KEY` is missing or the OpenAI call fails.

## OpenAI configuration

This backend uses the official `openai` Python package.

Environment variables:
- `OPENAI_API_KEY` (required): Your OpenAI API key.
- `OPENAI_MODEL_ID` (optional): Defaults to `gpt-4o-mini`. You can set another supported chat model id.

Create a `.env` for your process manager or export the variables in your shell before running:

```bash
export OPENAI_API_KEY="sk-..."         # do NOT commit this value
export OPENAI_MODEL_ID="gpt-4o-mini"   # optional
```

## CORS

CORS is enabled permissively for local development so that the React frontend can fetch these APIs from another origin (e.g., localhost:3000). Tighten CORS settings for production.

## Run locally

1. Create and activate a virtual environment (recommended):

   ```bash
   cd medical-guidance-assistant-2275-2284/disease_medicine_backend
   python3 -m venv .venv
   source .venv/bin/activate   # Windows: .venv\\Scripts\\activate
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Set environment variables (at minimum the API key):

   ```bash
   export OPENAI_API_KEY="your-api-key"
   # optionally:
   # export OPENAI_MODEL_ID="gpt-4o-mini"
   ```

4. Start the server (default port 8000):

   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

5. Open the docs:
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## Frontend configuration

From the React frontend (`disease_medicine_frontend`), set:

```
REACT_APP_API_BASE_URL=http://localhost:8000
```

Restart `npm start` after changing environment variables.

## Project layout

```
disease_medicine_backend/
  └── app/
      └── main.py           # FastAPI app
  └── requirements.txt      # Python deps
  └── README.md             # This file
```

## Notes

- Data is hardcoded/mocked for diseases and medicines.
- No database is used.
- API key must be provided via environment variable and must not be hardcoded.
- The `/api/explain` endpoint now uses OpenAI to produce explanations.

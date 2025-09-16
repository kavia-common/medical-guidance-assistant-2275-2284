from typing import List, Literal, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# FastAPI app initialization with metadata and tags for OpenAPI/Swagger
app = FastAPI(
    title="Disease Medicine Backend",
    description=(
        "Minimal backend for Disease Medicine Assistant.\n\n"
        "Provides mocked endpoints:\n"
        "- GET /api/diseases\n"
        "- GET /api/medicines?disease_id=\n"
        "- POST /api/explain (stubbed for future OpenAI integration)\n"
    ),
    version="0.1.0",
    openapi_tags=[
        {"name": "diseases", "description": "Endpoints related to diseases"},
        {"name": "medicines", "description": "Endpoints for medicines for a disease"},
        {"name": "explanations", "description": "Explain answers (LLM stub)"},
        {"name": "realtime", "description": "WebSocket usage notes (not implemented)"},
    ],
)

# Enable permissive CORS for local development
# Note: For production, restrict allowed origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In dev we allow all; tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Mocked data store (in-memory) ----
MOCK_DISEASES = [
    {"id": "flu", "name": "Influenza"},
    {"id": "cold", "name": "Common Cold"},
    {"id": "covid19", "name": "COVID-19"},
]
MOCK_MEDICINES = {
    "flu": [
        {"name": "Oseltamivir", "quantity": "75 mg, twice daily for 5 days"},
        {"name": "Acetaminophen", "quantity": "500 mg, every 6–8 hours as needed"},
    ],
    "cold": [
        {"name": "Pseudoephedrine", "quantity": "60 mg, every 4–6 hours"},
        {"name": "Dextromethorphan", "quantity": "10–20 mg, every 4 hours"},
    ],
    "covid19": [
        {"name": "Nirmatrelvir/Ritonavir (Paxlovid)", "quantity": "300/100 mg, twice daily for 5 days"},
        {"name": "Ibuprofen", "quantity": "200–400 mg, every 6–8 hours as needed"},
    ],
}


# ---- Pydantic models for API schema ----
class Disease(BaseModel):
    id: str = Field(..., description="Unique identifier for the disease, e.g., 'flu'")
    name: str = Field(..., description="Human readable disease name, e.g., 'Influenza'")


class DiseasesResponse(BaseModel):
    diseases: List[Disease] = Field(..., description="List of supported diseases")


class Medicine(BaseModel):
    name: str = Field(..., description="Medicine name")
    quantity: str | int = Field(..., description="Recommended quantity/dosage information")


class MedicinesResponse(BaseModel):
    disease_id: str = Field(..., description="Disease id for which medicines are returned")
    medicines: List[Medicine] = Field(..., description="List of medicines for the disease")


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"] = Field(..., description="Role of the message author")
    content: str = Field(..., description="Message text")


class ExplainRequest(BaseModel):
    disease_id: str = Field(..., description="Disease id providing context for the question")
    message: str = Field(..., description="User's question or prompt")
    history: Optional[List[ChatMessage]] = Field(
        default=None,
        description="Optional conversation history for context",
    )


class ExplainResponse(BaseModel):
    disease_id: str = Field(..., description="Echo of the disease id used for the explanation")
    answer: str = Field(..., description="Assistant's answer (mocked)")


# PUBLIC_INTERFACE
@app.get(
    "/api/diseases",
    response_model=DiseasesResponse,
    tags=["diseases"],
    summary="Get list of diseases",
    description="Returns a mocked list of available diseases for selection.",
    responses={
        200: {"description": "A list of supported diseases"},
    },
)
def get_diseases() -> DiseasesResponse:
    """Return a hardcoded list of diseases.

    Returns:
        DiseasesResponse: Object containing the list of diseases.
    """
    return DiseasesResponse(diseases=[Disease(**d) for d in MOCK_DISEASES])


# PUBLIC_INTERFACE
@app.get(
    "/api/medicines",
    response_model=MedicinesResponse,
    tags=["medicines"],
    summary="Get medicines for a disease",
    description="Given a disease_id, returns mocked medicines with recommended quantities.",
    responses={
        200: {"description": "Medicines for the provided disease id"},
        400: {"description": "Missing disease_id"},
        404: {"description": "Unknown disease_id"},
    },
)
def get_medicines(disease_id: str = Query(..., description="Disease id, e.g., 'flu'")) -> MedicinesResponse:
    """Return medicines for a given disease.

    Args:
        disease_id (str): The disease identifier.

    Raises:
        HTTPException: 400 if missing disease_id, 404 if not found.

    Returns:
        MedicinesResponse: Object containing medicines for the disease.
    """
    if not disease_id:
        raise HTTPException(status_code=400, detail="disease_id is required")

    if disease_id not in {d["id"] for d in MOCK_DISEASES}:
        raise HTTPException(status_code=404, detail=f"disease_id '{disease_id}' not found")

    meds = MOCK_MEDICINES.get(disease_id, [])
    return MedicinesResponse(disease_id=disease_id, medicines=[Medicine(**m) for m in meds])


# PUBLIC_INTERFACE
@app.post(
    "/api/explain",
    response_model=ExplainResponse,
    tags=["explanations"],
    summary="Explain answer (stubbed)",
    description=(
        "Accepts a disease_id, a message, and optional history. Returns a mocked explanation.\n\n"
        "TODO: Integrate with OpenAI via LangChain or direct API calls. Use environment variables"
        " for API key configuration when implementing."
    ),
    responses={
        200: {"description": "Mocked explanation returned"},
        400: {"description": "Validation error"},
    },
)
def explain(request: ExplainRequest) -> ExplainResponse:
    """Return a mocked explanation.

    Args:
        request (ExplainRequest): Payload with disease context and user's message.

    Returns:
        ExplainResponse: Mocked assistant message.
    """
    disease_name = next((d["name"] for d in MOCK_DISEASES if d["id"] == request.disease_id), request.disease_id)

    # Stubbed logic: Construct a helpful but fake explanation.
    # TODO: Replace with actual OpenAI/LangChain pipeline using env var (e.g., OPENAI_API_KEY).
    history_note = ""
    if request.history:
        # include limited history context
        last_user = next((m.content for m in reversed(request.history) if m.role == "user"), None)
        if last_user:
            history_note = f" I see you previously asked: '{last_user}'."

    answer = (
        f"For {disease_name}, the recommended medicines and dosages are based on common clinical guidance and symptom "
        f"severity.{history_note} Your question: '{request.message}'. "
        f"Always consult a licensed clinician for personal medical advice."
    )

    return ExplainResponse(disease_id=request.disease_id, answer=answer)


# PUBLIC_INTERFACE
@app.get(
    "/api/websocket-usage",
    tags=["realtime"],
    summary="WebSocket usage notes",
    description=(
        "This project does not currently implement WebSocket endpoints. If in the future streaming explanations are "
        "required, a WebSocket endpoint (e.g., /ws/explain) can be added and documented here."
    ),
)
def websocket_usage_note() -> dict:
    """Provide notes on potential WebSocket usage for API docs visibility.

    Returns:
        dict: Informational message.
    """
    return {
        "message": "No WebSocket routes implemented yet. Future versions may provide a /ws/explain endpoint for streaming."
    }


# Health check endpoint (optional, useful during dev)
@app.get(
    "/api/health",
    tags=["diseases", "medicines", "explanations"],
    summary="Health check",
    description="Simple health check endpoint.",
)
def health() -> dict:
    """Return a basic health check payload."""
    return {"status": "ok", "service": "disease_medicine_backend"}

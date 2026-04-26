"""
care/rag.py
-----------
RAG (Retrieval-Augmented Generation) medical insight layer.

Architecture:
  • Vector DB:   ChromaDB (persistent, local)
  • Embeddings:  sentence-transformers/all-MiniLM-L6-v2 (via ChromaDB built-in)
  • LLM:         Hugging Face Inference API (same model as the rest of the pipeline)

Flow:
  User question → retrieve top-K relevant medical guidelines →
  build grounded prompt → call HF model → return answer + disclaimer
"""

import logging
import os

import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from huggingface_hub import InferenceClient

logger = logging.getLogger(__name__)

HF_TOKEN = os.environ.get("HF_TOKEN", "")
HF_MODEL = os.environ.get("HF_MODEL", "mistralai/Mistral-7B-Instruct-v0.3")

# Persist the vector DB alongside this file
CHROMA_DB_PATH = os.path.join(os.path.dirname(__file__), 'chroma_db')

# ---------------------------------------------------------------------------
# Seeded medical knowledge (clinical guidelines + care coordination facts)
# ---------------------------------------------------------------------------

_MEDICAL_KNOWLEDGE: list[str] = [
    """Diabetes Management Guidelines:
- HbA1c target: <7% for most non-pregnant adults; individualise based on age and comorbidities.
- Annual screenings: retinal eye exam, comprehensive foot exam, urine albumin-to-creatinine ratio, eGFR.
- Blood pressure target: <130/80 mmHg.
- Statin therapy indicated for patients aged 40-75 with diabetes.
- Self-monitoring of blood glucose: frequency based on therapy type.
- Lifestyle modifications: Mediterranean or DASH diet, 150 min/week moderate-intensity exercise, weight management.
- Sick-day rules: continue metformin unless vomiting; hold SGLT2 inhibitors during acute illness.""",

    """Heart Failure Care Coordination Protocol:
- Daily weight monitoring; report weight gain >2 lb overnight or >5 lb in a week.
- Fluid restriction: typically 1.5–2 L/day for NYHA Class III–IV.
- Sodium restriction: <2 g/day.
- Core medications: ACE inhibitors/ARBs/ARNI, beta-blockers, mineralocorticoid antagonists, SGLT2 inhibitors.
- Follow-up schedule: within 7–14 days of discharge; then every 1–3 months depending on stability.
- Cardiology referral for EF assessment and device therapy evaluation if EF ≤35%.
- Palliative care discussion for end-stage HF patients.""",

    """Hypertension Follow-Up Protocol:
- Target BP: <130/80 mmHg for most adults; <140/90 for age >80 or significant CKD.
- Lifestyle: DASH diet, sodium <2.3 g/day, 150 min/week aerobic exercise, limit alcohol, smoking cessation.
- Medication adherence review at every visit; pill-burden simplification strategies.
- Screen for end-organ damage: eGFR, urine albumin, retinal exam, ECG.
- In resistant hypertension (BP uncontrolled on 3+ agents including a diuretic), evaluate for secondary causes.""",

    """Post-Acute Discharge & Transitions of Care:
- High-risk patients (LACE score ≥10): follow-up within 48–72 hours of discharge.
- Standard patients: follow-up within 7 days.
- Mandatory medication reconciliation at every care transition.
- Teach-back patient education on: medication names/doses, warning signs, when to call vs. go to ED.
- Home health evaluation for patients with ADL limitations or complex wound care.
- Readmission risk tools: LACE Index, HOSPITAL Score, BOOST tool.""",

    """Care Coordination Best Practices:
- Schedule next appointment before the patient leaves the current encounter.
- Use shared care plans accessible to all members of the care team.
- Identify care coordinator/case manager for patients with 3+ chronic conditions.
- Social determinants of health (SDOH) screening: food insecurity, housing, transportation, social isolation.
- Warm handoffs between providers reduce information loss.
- Integrate behavioral health for patients with comorbid depression/anxiety.""",

    """High-Risk Patient Identification Criteria:
- ≥3 chronic conditions (multi-morbidity).
- Hospitalisation or ED visit in the past 30 days.
- ≥5 medications (polypharmacy).
- Limited health literacy or language barriers.
- Known non-adherence history.
- Frailty score ≥4 (Clinical Frailty Scale).
- Lack of primary care provider or care fragmentation.
- Cognitive impairment affecting self-management.""",

    """COPD Management & Care Coordination:
- Maintenance inhalers: LABA/LAMA combination for GOLD Group B/E.
- Pulmonary rehabilitation recommended for patients with MRC dyspnoea grade ≥2.
- Annual influenza vaccine; pneumococcal vaccine per schedule.
- Exacerbation action plan: rescue inhaler, oral corticosteroids, antibiotics supply.
- Smoking cessation as highest-priority intervention.
- Oxygen therapy if resting SpO2 ≤88% on two occasions.
- Follow-up within 4 weeks after an exacerbation.""",

    """Chronic Kidney Disease (CKD) Monitoring:
- Monitor eGFR and urine ACR every 3–12 months based on CKD stage and risk.
- BP target: <130/80; first-line agents ACE inhibitor or ARB.
- Avoid NSAIDs and nephrotoxic agents.
- Dietary: protein restriction 0.6–0.8 g/kg/day in advanced CKD; potassium and phosphorus restriction as needed.
- Refer to nephrology when eGFR <30 (Stage 4).
- Anaemia management: target haemoglobin 10–11.5 g/dL with ESA therapy.
- Plan for renal replacement therapy (dialysis or transplant) discussion when eGFR <20.""",
]

# ---------------------------------------------------------------------------
# ChromaDB singleton
# ---------------------------------------------------------------------------

_collection = None


def _get_collection():
    """Lazily initialise and return the ChromaDB collection."""
    global _collection
    if _collection is not None:
        return _collection

    ef = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    _collection = client.get_or_create_collection(
        name="medical_knowledge",
        embedding_function=ef,
        metadata={"hnsw:space": "cosine"},
    )

    if _collection.count() == 0:
        _populate(_collection)
        logger.info("RAG: medical knowledge base initialised (%d chunks).", _collection.count())

    return _collection


def _populate(collection) -> None:
    """Chunk and insert the seeded medical knowledge into ChromaDB."""
    documents: list[str] = []
    ids: list[str] = []

    for doc_idx, text in enumerate(_MEDICAL_KNOWLEDGE):
        # Simple overlapping chunking (500-char chunks, 100-char overlap)
        chunk_size = 500
        overlap = 100
        start = 0
        chunk_idx = 0
        while start < len(text):
            chunk = text[start:start + chunk_size]
            documents.append(chunk)
            ids.append(f"doc{doc_idx}_chunk{chunk_idx}")
            chunk_idx += 1
            start += chunk_size - overlap

    collection.add(documents=documents, ids=ids)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def query_rag(
    patient_summary: str,
    question: str,
    care_plan: str = "",
    coordination_context: str = "",
) -> str:
    """
    Answer a clinical coordination question using RAG.

    1. Embed the question and retrieve top-3 relevant guideline chunks.
    2. Build a grounded prompt combining retrieved context + patient data.
    3. Call the HF model for a response.
    4. Append a mandatory disclaimer.

    Args:
        patient_summary:  Free-text patient summary (may be empty string)
        question:         The clinical question to answer
        care_plan:        Optional care plan excerpt for additional context
        coordination_context:
                          Current task, risk, alert, and timeline state

    Returns:
        Grounded answer string with disclaimer appended.
    """
    collection = _get_collection()

    # Retrieve relevant chunks
    results = collection.query(
        query_texts=[question],
        n_results=3,
    )
    retrieved_chunks: list[str] = results['documents'][0] if results.get('documents') else []
    context = "\n\n---\n\n".join(retrieved_chunks)

    # Build grounded prompt
    patient_section = f"PATIENT CONTEXT:\n{patient_summary}" if patient_summary else ""
    plan_section = f"\nCARE PLAN EXCERPT:\n{care_plan[:1200]}" if care_plan else ""
    coordination_section = (
        f"\nCURRENT CARE COORDINATION STATE:\n{coordination_context[:2200]}"
        if coordination_context
        else ""
    )

    prompt = f"""You are a medical care coordination assistant helping a care team.
Use the retrieved medical guidelines for clinical coordination guidance and the current care coordination state for patient-specific task, risk, alert, and timeline status.
Do not invent patient facts, task statuses, deadlines, or clinical claims that are not present in the supplied context.

RETRIEVED MEDICAL GUIDELINES:
{context}

{patient_section}{plan_section}{coordination_section}

QUESTION: {question}

Provide a specific, actionable answer based on the guidelines above.
If the question is about current tasks or blockers, answer from the current care coordination state.
If the supplied context does not cover the question, say so clearly.
Keep your answer concise (3-5 sentences) and mention relevant guideline points."""

    try:
        client = InferenceClient(token=HF_TOKEN if HF_TOKEN else None)
        response = client.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            model=HF_MODEL,
            max_tokens=600,
            temperature=0.2,
        )
        answer = response.choices[0].message.content.strip()
    except Exception as exc:
        logger.error("RAG LLM call failed: %s", exc)
        # Graceful degradation — return the retrieved context as the answer
        answer = (
            "Unable to generate a full AI response. "
            "Here are the most relevant guideline excerpts and current coordination context:\n\n"
            + context
            + ("\n\nCURRENT CARE COORDINATION STATE:\n" + coordination_context if coordination_context else "")
        )

    disclaimer = (
        "\n\n⚠️ DISCLAIMER: This is AI-generated information for care coordination "
        "support only. It does NOT constitute medical advice or diagnosis. "
        "All clinical decisions must be made by qualified healthcare professionals."
    )
    return answer + disclaimer

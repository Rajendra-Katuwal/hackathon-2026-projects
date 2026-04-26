# Responsible AI Document - CareSync AI

This document summarizes how CareSync AI addresses responsible AI requirements for the hackathon.

## 1. Intended Use and Scope

CareSync AI is an AI-assisted care coordination application. It is intended to help care teams:
- Generate care coordination plans
- Create and track follow-up tasks
- Surface risk context for prioritization
- Ask guideline-grounded coordination questions via RAG

CareSync AI is not intended to diagnose, prescribe, or replace clinician judgment.

## 2. Data Sources 

CareSync AI uses the following data sources:

1. User-provided patient context
- Patient name
- Free-text patient summary entered in the intake flow

2. System-generated care state
- Care plans
- Tasks (owner, priority, status, deadline)
- Risk score and reasoning
- Timeline events

3. Retrieval knowledge for RAG
- Seeded clinical and care-coordination guideline text embedded in the backend knowledge base
- Retrieved via ChromaDB vector search during question answering

4. Export/interoperability data
- FHIR R4 resources generated from internal records (Patient, CarePlan, Task, RiskAssessment, AuditEvent)

Data handling note: patient summaries and prompts may be sent to Hugging Face inference endpoints during AI calls.

## 3. Model Choices 

Primary AI stack:
- LLM provider: Hugging Face Inference API
- Currently configured model: Qwen/Qwen2.5-7B-Instruct (via HF_MODEL)
- Code default fallback model: mistralai/Mistral-7B-Instruct-v0.3
- Embedding model for retrieval: all-MiniLM-L6-v2
- Vector database: ChromaDB (persistent local store)

Pipeline usage:
- Care plan generation: LLM prompt with coordination-only instructions
- Task extraction: LLM forced into strict JSON schema output
- Risk scoring: LLM JSON output with bounded parsing; rules-based fallback available
- RAG Q&A: retrieve top relevant chunks + patient coordination context + LLM answer

## 4. Bias Considerations 

Potential bias risks:
- Foundation model bias from pretraining data
- Knowledge coverage bias from limited seeded medical content
- Representation bias from mostly free-text inputs with limited structured social context
- Rule-based fallback bias from keyword scoring (risk of over/under-estimation)

Current mitigations:
- Scope restriction: coordination support only, not diagnosis
- Human-in-the-loop operation: care team reviews and acts
- Prompt constraints to reduce unsupported claims
- Structured output validation and bounded enums for risk/task fields
- Visible disclaimers in UI and RAG responses

## 5. Failure Cases 

Known failure scenarios:
- Hallucinated or incomplete LLM output
- Invalid JSON from task/risk calls
- Retrieval mismatch for highly specific questions
- API/network/model availability failures
- Risk misclassification for nuanced patient narratives

Implemented fallback behavior:
- Care plan failure: deterministic fallback care plan template
- Task extraction failure: deterministic default task set
- Risk scoring failure: rules-based scoring fallback
- RAG failure: degrade gracefully with retrieved context/service warning

## 6. Safety and Human Oversight

Safety controls in product behavior:
- Prompts explicitly prohibit diagnosis/prescription role
- Risk score clamped to 0-100 and level constrained to LOW/MEDIUM/HIGH
- Task status/owner/priority constrained to allowed values
- Clinical disclaimer appended in RAG output
- UI labels AI output as support, not clinical authority

Human oversight:
- Final decisions remain with qualified healthcare professionals
- Users can manually review and update generated task workflow

## 7. Current Limitations

- Prototype stage; not production-hardened for healthcare deployment
- API is currently open by default (no RBAC/auth hardening yet)
- Limited automated test coverage in backend
- No built-in PHI de-identification workflow in this version
- Seeded guideline corpus requires periodic clinical review and updates

## 8. Responsible Use Statement

CareSync AI must be used as a care coordination assistant only. All diagnosis, treatment, and medical decisions must be made by licensed clinicians using full clinical context, current standards of care, and institutional policy.

---
Last updated: April 26, 2026

# CareSync AI

CareSync AI is an AI-powered care coordination platform built for the **AI Healthcare Innovation Hackathon 2026** under **Track 4: AI-Powered Care Coordination**.

CareSync AI helps healthcare providers organize patient care by generating care plans, creating follow-up tasks, and tracking care progress across different members of a care team.

---

## Team Members

| Name | GitHub |
|---|---|
| Rajendra Katuwal | [@Rajendra-Katuwal](https://github.com/Rajendra-Katuwal) |
| Prince Shrestha | [@prince01234](https://github.com/prince01234) |
| Samman Khanal | [@samman-khanal](https://github.com/samman-khanal) |

---

## Problem Statement

Healthcare coordination is often fragmented. Patients may need support from doctors, nurses, labs, pharmacies, and care managers, but follow-ups and responsibilities are not always clearly tracked.

This can lead to missed appointments, delayed lab work, unclear responsibilities, and poor communication between care teams.

CareSync AI focuses on making care coordination easier by helping providers understand what needs to happen next, who should do it, and what is still pending.

---

## Solution

CareSync AI provides a simple dashboard where providers can select a patient, view patient context, generate an AI-assisted care plan, and convert that plan into actionable care tasks.

The system helps care teams:

- Generate care plans from patient information
- Create follow-up tasks
- Assign tasks to care team members
- Track task status
- View patient care progress

CareSync AI is designed to support healthcare providers and improve coordination. It does not replace medical professionals or clinical judgment.

---

## User Flow

1. A provider opens the CareSync AI dashboard.
2. The provider selects a patient.
3. The system displays basic patient context.
4. The provider clicks **Generate Care Plan**.
5. AI generates a care coordination plan.
6. The system creates care tasks from the plan.
7. The provider reviews and updates task statuses.
8. The care team can track what is pending, in progress, or completed.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, Tailwind CSS |
| Backend | Django |
| Database | PostgreSQL |
| AI Integration | Hugging Face API |
| API Style | REST API |
| Version Control | Git, GitHub |

---

## Setup Instructions

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- Python
- pip
- PostgreSQL
- Git

---

## Backend Setup

Navigate to the backend folder:

```bash
cd projects/caresync-ai/src/backend
```

Create and activate a virtual environment:

```bash
python -m venv venv
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/caresync_ai
HF_API_KEY=your_huggingface_api_key
```

Run migrations:

```bash
python manage.py migrate
```

Start the backend server:

```bash
python manage.py runserver
```

Backend runs on:

```txt
http://localhost:8000
```

---

## Frontend Setup

Navigate to the frontend folder:

```bash
cd projects/caresync-ai/src/frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the frontend server:

```bash
npm run dev
```

Frontend runs on:

```txt
http://localhost:3000
```

---

## Demo

Demo link or screenshots will be added before final submission.

---

## Project Structure

```txt
projects/
+-- caresync-ai/
    +-- README.md
    +-- responsible-ai.md
    +-- src/
    |   +-- frontend/
    |   +-- backend/
    +-- demo/
```
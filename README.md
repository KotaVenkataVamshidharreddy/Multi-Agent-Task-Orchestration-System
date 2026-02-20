## Multi-Agent Task Orchestration System

This project is a small multi-agent orchestration demo that runs a pipeline of Planner, Researcher, Writer, and Reviewer agents on top of a FastAPI backend with a React (Vite) frontend. A user submits a natural-language request, and the system plans the work, generates research, drafts a Markdown report, runs a review step that may request revisions, and finally presents the approved report in a rich UI.

### Prerequisites

- **Python**: 3.9+
- **Node.js**: 18+

### Backend Setup (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`.

### Frontend Setup (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Architecture Overview

- **Backend**: A FastAPI service exposes endpoints to create and inspect tasks. An in-memory orchestrator coordinates four agents (Planner, Researcher, Writer, Reviewer) in sequence, with an explicit revision loop when the Reviewer requests changes. Each agent appends an `AgentResult` to the task so that the UI can stream and visualize progress in real time. A Server-Sent Events (SSE) endpoint (`/tasks/{task_id}/stream`) pushes incremental task updates to the frontend every 500ms until the task finishes.
- **Frontend**: A Vite-powered React SPA (plain JavaScript) communicates with the backend via `fetch` and `EventSource`. It provides a dark-themed dashboard that shows the pipeline state, an activity log, reviewer feedback, and the final report with copy-to-clipboard support. Tailwind CSS handles all styling, including the pulsing active-state animation in the pipeline view.

### Assumptions

- This is a demo system, so **all task state is stored in memory** on a single FastAPI process; restarting the backend clears all tasks.
- The backend is expected to run on `http://localhost:8000` and the frontend on `http://localhost:5173`, with no reverse proxy or additional auth in front.
- The agents are intentionally deterministic templates (using `random` only in the reviewer for rejection probability) and do **not** call external LLM APIs; all text is generated locally for easier evaluation and offline use.


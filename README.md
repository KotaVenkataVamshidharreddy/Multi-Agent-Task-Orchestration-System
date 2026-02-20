# Real-Time Multi-Agent Research Orchestration System

A real-time pipeline where four specialised AI agents — **Planner → Researcher → Writer → Reviewer** — collaborate to turn any natural-language research request into a polished report, with every step streamed live to the browser.
## What This Assignment Demonstrates

- Multi-agent orchestration
- Async task lifecycle management
- Real-time frontend streaming (SSE)
- Clean separation of concerns
- Extensible agent architecture
---

**Stack:** Python 3.9 · FastAPI · React 18 · Vite · Server-Sent Events

---

## How It Works

```
User submits a request
         │
         ▼
   ┌──────────┐   JSON plan      ┌────────────┐   findings    ┌────────┐
   │ Planner  │ ──────────────▶  │ Researcher │ ───────────▶  │ Writer │
   └──────────┘                  └────────────┘               └───┬────┘
                                                                   │ draft
                                                                   ▼
                                                            ┌──────────┐
                                                            │ Reviewer │
                                                            └────┬─────┘
                                              ┌─────────────────┴─────────────────┐
                                              │                                   │
                                         APPROVED (~70%)              NEEDS_REVISION (~30%)
                                              │                                   │
                                         Final Report       Writer (revision) → Reviewer
                                                                (always approves 2nd pass)
                                                                         │
                                                                    Final Report

Every status change is broadcast to the browser instantly via SSE.
```

---

## Project Structure

```
├── backend/
│   ├── main.py              # FastAPI app — REST routes + SSE endpoint
│   ├── orchestrator.py      # Pipeline coordinator & task lifecycle manager
│   ├── models.py            # Pydantic models: Task, AgentResult, TaskStatus
│   ├── requirements.txt
│   └── agents/
│       ├── base.py          # Abstract Agent base class (async run interface)
│       ├── planner.py       # Turns user request into a JSON subtask plan
│       ├── researcher.py    # Generates structured findings per subtask
│       ├── writer.py        # Drafts Markdown report; handles revision cycle
│       └── reviewer.py      # Approves or requests revision with feedback
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx                     # Root layout, SSE stream lifecycle, state
        ├── index.css                   # Global styles & keyframe animations
        ├── lib/api.js                  # fetch + EventSource helpers
        └── components/
            ├── TaskForm.jsx            # Request input form with example hints
            ├── PipelineVisualizer.jsx  # Animated SVG agent-network graph
            ├── AgentCard.jsx           # Expandable per-agent activity log entry
            ├── ReviewFeedback.jsx      # Reviewer rejection banner
            └── ResultsPanel.jsx        # Live draft preview + final report panel
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.9 + |
| Node.js | 18 + |
| npm | 8 + |

---

## Setup

### 1 — Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Confirm it's up:
```bash
curl http://localhost:8000/
# {"message":"Multi-Agent Orchestrator API","status":"running"}
```

### 2 — Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Visit **http://localhost:5173** in your browser.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/tasks` | Submit a research request. Returns `task_id` immediately; pipeline runs in background. |
| `GET` | `/tasks/{task_id}` | Current task snapshot — status, all agent results, final report. |
| `GET` | `/tasks/{task_id}/stream` | **SSE stream** — emits full Task JSON every 500 ms until `DONE` or `FAILED`. |
| `GET` | `/tasks` | List all in-memory tasks (debug). |

## Quick Test

### macOS / Linux / Git Bash

```bash
# Submit
curl -X POST http://localhost:8000/tasks \
  -H "Content-Type: application/json" \
  -d '{"request": "Research trade-offs between microservices and monoliths"}'

# Watch live
curl -N http://localhost:8000/tasks/<task_id>/stream
```

### Windows PowerShell

```powershell
# Submit
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:8000/tasks" `
  -ContentType "application/json" `
  -Body '{"request":"Research trade-offs between microservices and monoliths"}'

# Watch live
curl.exe -N http://localhost:8000/tasks/<task_id>/stream
```

### Status lifecycle

```
PENDING → PLANNING → RESEARCHING → WRITING → REVIEWING → DONE
                                                  │
                                        (if rejected ~30%)
                                                  ↓
                                            REVISING → REVIEWING → DONE
```

---

## Agent Summary

| Agent | Input | Output | Status emitted |
|-------|-------|--------|----------------|
| **Planner** | Raw user request | JSON `{"subtasks": [...]}` | `PLANNED` |
| **Researcher** | JSON plan | Markdown findings per subtask | `RESEARCHED` |
| **Writer** | Research findings (+ optional reviewer feedback) | Full Markdown report | `DRAFT_CREATED` / `DRAFT_REVISED` |
| **Reviewer** | Draft report | Approval text or structured revision feedback | `APPROVED` / `NEEDS_REVISION` |

All agents share one interface from `agents/base.py`:

```python
async def run(self, input_text: str) -> AgentResult
```

This makes every agent independently testable and trivially swappable — replacing a template with a real LLM call touches only that agent file.

---

## Frontend Highlights

**SSE streaming** — `api.js` opens a native `EventSource` and pipes every update to `setTaskData` in `App.jsx`. A `useRef` cleanup closes the connection on navigation or new task start.

**Pipeline Visualizer** — pure SVG canvas with a fixed `viewBox`. Each agent node has its own accent colour; active nodes pulse with animated glow rings. Edges use quadratic bezier curves with traveling-dot animations via `animateMotion`, guaranteed to stay inside the canvas boundary.

**Activity Log** — `AgentCard` strips all markdown syntax via `stripMarkdown` so log entries read as clean plain text. Clicking a card expands inline input/output panels.

**Report Panel** — `ResultsPanel` renders the final report as proper HTML via a custom `renderMarkdown` converter (headings, lists, bold). While the pipeline runs it shows a live draft preview from the latest Writer output.

---

## Key Design Decisions

**SSE over WebSockets** — tasks are one-shot and unidirectional: submit once, receive updates only. SSE is simpler, HTTP-native, and proxy-friendly with no custom protocol overhead.

**In-memory state** — a shared `Dict[str, Task]` eliminates database setup for the demo. The SSE poller and orchestrator share state by reference within the same process, keeping the code minimal.

**Abstract Agent base class** — the `Orchestrator` calls every agent identically. Adding a new agent or swapping one for a real LLM requires zero orchestrator changes.

**BackgroundTask pipeline** — `POST /tasks` returns a `task_id` immediately while `orchestrator.run_task` runs asynchronously, keeping HTTP responses instant.

**Sequential execution** — each agent's output is the next agent's input, so sequential `await` calls are correct. `asyncio.sleep(1.5)` between steps makes streaming visually clear.

---

## Assumptions

- Runs as a **single FastAPI process** with no clustering.
- State is **ephemeral** — restarting clears all tasks (acceptable for a demo).
- Agents use **deterministic templates** — no external API calls. `random` is used only in the Reviewer for the 30% rejection.
- Backend on `localhost:8000`, frontend on `localhost:5173`. CORS is fully open — development only.
- The Reviewer rejection is probabilistic — run the same request multiple times to see both the approval path and the full revision cycle.

---

## What Would Come Next

- **Real LLM integration** — swap templates for prompt-based calls (OpenAI / Anthropic). The abstract `run` interface makes it a one-file change per agent.
- **Parallel research** — fan out planner subtasks with `asyncio.gather` across multiple `ResearcherAgent` instances for faster results.
- **Persistent storage** — SQLite (dev) or PostgreSQL (prod) for task history and crash resilience.
- **Retry logic** — per-agent retry budgets with exponential backoff, visible in the activity log.
- **Auth + multi-user** — JWT identity, per-user task isolation, history page.
- **Tests** — pytest for orchestrator transitions, React Testing Library for UI components.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + `sse-starlette` + Pydantic v2 |
| Frontend | React 18 + Vite 5 + Tailwind CSS 3 |
| Real-time | Server-Sent Events (`EventSource`) |
| Agent I/O | Plain strings via `AgentResult` Pydantic model |

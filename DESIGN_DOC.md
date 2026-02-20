## Design Document – Multi-Agent Task Orchestration System

### 1. Architecture Overview

The system is split into two services:

- **Backend (`backend/`, FastAPI + Python)**: Exposes HTTP APIs for creating and inspecting tasks and an SSE endpoint for live updates. It owns all task state in an in-memory store and runs the multi-agent pipeline through an `Orchestrator` class. Each task is represented by a `Task` Pydantic model containing metadata (`id`, `request`, `status`, `created_at`), a list of `AgentResult` entries for each step, and the final Markdown report.
- **Frontend (`frontend/`, React + Vite, Tailwind)**: A single-page application that lets users submit a request, then observes the task through an SSE stream. It visualizes pipeline state, agent-by-agent logs, reviewer feedback, and the final report. Communication is unidirectional: the frontend sends a `POST /tasks` once, then reads updates via `GET /tasks/{task_id}/stream`.

The two services communicate over plain HTTP:

- `POST /tasks` — create a new task and start the orchestrator in a FastAPI background task.
- `GET /tasks/{task_id}` — fetch the current task snapshot.
- `GET /tasks/{task_id}/stream` — SSE stream that emits the full task JSON every 500ms until the task is `DONE` or `FAILED`.
- `GET /tasks` — list all in-memory tasks for debugging or inspection.

No proxy or CORS complexity is needed; the backend listens on port `8000` and the frontend on `5173`, with CORS fully open from the backend.

### 2. Agent Design

All agents inherit from a common abstract base class:

- `Agent` (in `agents/base.py`) defines:
  - a `name` field, used for labeling pipeline stages and logs, and
  - an abstract `async run(input_text: str) -> AgentResult` method.

This abstraction ensures:

- **Consistent interface**: The orchestrator can call any agent with the same pattern and always gets an `AgentResult` containing `agent_name`, `status`, `input`, `output`, and `timestamp`.
- **Substitutability and extension**: New agents (e.g., a second researcher or summarizer) can be added without changing orchestrator wiring; they only need to implement `run`.
- **Clear ownership of side effects**: Each agent is responsible for turning an input string into a string output plus status, while the orchestrator owns all task mutation and persistence.

Concrete agents:

- **PlannerAgent**: Consumes the raw user request and returns a JSON plan with 3–4 subtasks that embed the exact request text, ensuring outputs feel specific rather than generic.
- **ResearcherAgent**: Reads the plan JSON, iterates over subtasks, and generates templated but realistic findings sections, each directly referencing the corresponding subtask.
- **WriterAgent**: Turns research findings (and optional reviewer feedback) into a Markdown report with headings, bullet points, and a conclusion. When feedback is present, it adds a dedicated “Incorporated Reviewer Feedback” section.
- **ReviewerAgent**: Examines the draft and:
  - On first pass, randomly rejects ~30% of the time with `NEEDS_REVISION` and structured feedback, or approves with `APPROVED`.
  - After a revision (signaled by a `[REVISION]` marker), always approves the draft.

### 3. Orchestrator Design

The `Orchestrator` (in `orchestrator.py`) coordinates the full pipeline:

1. **Task creation**:
   - Generates a UUID `id`, instantiates a `Task` with `status=PENDING`, and stores it in a shared `Dict[str, Task]`.
2. **Pipeline execution (`run_task`)**:
   - Sequentially calls:
     - Planner → Researcher → Writer (initial draft) → Reviewer (first pass).
   - Between each agent call, it:
     - Mutates `task.status` to the appropriate `TaskStatus` (PLANNING, RESEARCHING, WRITING, REVIEWING, REVISING, DONE, FAILED).
     - Appends the `AgentResult` returned by the agent to `task.agent_results`.
     - Sleeps for 1.5 seconds (`asyncio.sleep(1.5)`) to simulate processing time and make UI streaming behavior visually clear.
3. **Review loop**:
   - If the first Reviewer result has `status=NEEDS_REVISION`, the orchestrator:
     - Sets `task.status=REVISING` so the UI can show a “Revision in Progress” banner.
     - Calls the Writer again with the previous draft **plus** the reviewer feedback and a `[REVISION]` marker, appending the new writer result.
     - Calls the Reviewer once more with the revised draft (marked as a revision). The reviewer is hard-wired to approve on this second pass.
   - The system then treats the latest writer output as the `final_report`.
4. **State passing and failure handling**:
   - Each agent only receives a string input and returns an `AgentResult`; the orchestrator passes outputs along the chain.
   - In case of any exception, the orchestrator records a synthetic `AgentResult` with `agent_name="Orchestrator"` and `status="FAILED"`, marks the task as `FAILED`, and leaves previous agent results intact for debugging.

This design keeps agents simple and stateless while centralizing all orchestration logic and task lifecycle management.

### 4. Key Trade-offs

#### SSE vs WebSockets

- **SSE**:
  - Unidirectional (server → client), which fits this use case because clients only need to receive updates after a single POST.
  - Simpler to wire up in both FastAPI and React using `EventSource`, with no custom protocol or heartbeat logic.
  - Works well with HTTP infrastructure (proxies, load balancers) without extra configuration.
- **WebSockets**:
  - Full duplex and lower-latency bi-directional messaging, but requires more framework plumbing, connection lifecycle handling, and server state management.

Given that tasks are long-running but uni-directional (frontend does not need to push mid-task commands), **SSE is simpler and fully sufficient**.

#### Polling vs Event-driven

- The backend uses an **event-driven** SSE endpoint that internally performs a simple `asyncio.sleep(0.5)` polling loop over the in-memory task store:
  - This avoids the complexity of pushing updates from the orchestrator into a pub/sub system.
  - The SSE generator just reads the latest `Task` snapshot every 500ms and emits it, closing automatically when the task is `DONE` or `FAILED`.
- Pure HTTP polling from the frontend (e.g., `setInterval(fetch)`) would be noisier, less efficient, and require more manual wiring in React.

The hybrid approach (background task + SSE polling) keeps the backend code small and still delivers a near-real-time UX.

#### In-memory State vs Database

- **In-memory store (current)**:
  - Very simple; a global `Dict[str, Task]` suffices for a single-process demo.
  - No migration or schema concerns.
  - Makes it easy for the SSE loop and orchestrator to share state by reference.
- **Database (future)**:
  - Required for multi-process workers, restarts, and multi-user deployments.
  - Would allow historical analytics and queryable task logs.

For this assignment, **in-memory state is acceptable**, but would not scale to production or multi-instance deployments.

#### Sync vs Async Agent Execution

- **Current**: Agents run sequentially in an async function, with simulated delay between steps. This:
  - Mirrors a straightforward pipeline where each step depends on the previous one’s output.
  - Makes the UI’s notion of “current active agent” easy to compute.
- **Future**: Some subtasks (especially research) could run in parallel:
  - The orchestrator could fan out subtasks to multiple `ResearcherAgent` instances with `asyncio.gather` and then join results before writing.
  - This would complicate state updates and visualization but significantly reduce total wall-clock time.

### 5. What I’d Do with More Time

- **Real LLM integration**:
  - Swap templated agent implementations for actual LLM calls (e.g., OpenAI or Anthropic) using structured prompts per agent role.
  - Store the raw prompts and completions alongside `AgentResult` for observability.
- **Parallel researcher subtasks**:
  - Represent planner subtasks as a list and schedule each research subtask via `asyncio.gather`, merging results into a combined findings document.
- **Persistent storage**:
  - Introduce PostgreSQL or SQLite to store tasks, agent results, and final reports.
  - Ensure the orchestrator is idempotent and can resume from partially completed tasks.
- **Retry logic for failed agents**:
  - Add structured error types, retry budgets, and exponential backoff per agent.
  - Surface failures and retries explicitly in the UI activity log.
- **Auth and multi-user support**:
  - Attach a simple user identity to each task (via headers or JWT).
  - Partition task listings and streams per user.

### 6. Assumptions Made

- The system runs as a **single FastAPI process**; no clustering or process-level concurrency is expected.
- SSE clients are short-lived (one tab per user) and can be safely closed on task completion or new task creation.
- The frontend and backend run on `localhost` in a development environment, so relaxed CORS (`allow_origins=["*"]`) is acceptable.
- Task volume is low enough that a 500ms SSE emission interval and 1.5s per-agent delay are sufficient for a responsive demo without performance tuning.


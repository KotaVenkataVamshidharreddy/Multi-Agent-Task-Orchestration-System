from __future__ import annotations

import asyncio
from typing import Dict

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from models import Task, TaskStatus
from orchestrator import Orchestrator

app = FastAPI(title="Multi-Agent Orchestrator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Multi-Agent Orchestrator API", "status": "running"}

# Shared in-memory task store. This is intentionally simple for the demo and not suitable for production use.
TASKS: Dict[str, Task] = {}
orchestrator = Orchestrator(TASKS)


@app.post("/tasks")
def create_task(payload: dict, background_tasks: BackgroundTasks) -> dict:
    request_text = payload.get("request")
    if not request_text or not isinstance(request_text, str):
        raise HTTPException(status_code=400, detail="Field 'request' must be a non-empty string.")

    task = orchestrator.create_task(request_text)
    # BackgroundTasks can handle async callables; FastAPI will await this after sending the response.
    background_tasks.add_task(orchestrator.run_task, task.id)
    return {"task_id": task.id}


@app.get("/tasks")
def list_tasks():
    # Return a simple list so the JSON payload is easy for clients to consume.
    return list(TASKS.values())


@app.get("/tasks/{task_id}")
def get_task(task_id: str) -> Task:
    task = TASKS.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    return task


@app.get("/tasks/{task_id}/stream")
async def stream_task(task_id: str):
    task = TASKS.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    async def event_generator():
        # Non-obvious: we poll the in-memory task state on a fixed interval to simplify concurrency.
        while True:
            current = TASKS.get(task_id)
            if not current:
                break
            # EventSource expects data as a string in the 'data' field
            # Use .json() for Pydantic v1, .model_dump_json() for v2
            try:
                task_json = current.model_dump_json()
            except AttributeError:
                task_json = current.json()
            yield {
                #"event": "update",
                "data": task_json,
            }
            if current.status in {TaskStatus.DONE, TaskStatus.FAILED}:
                break
            await asyncio.sleep(0.5)

    return EventSourceResponse(event_generator())


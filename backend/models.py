from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class TaskStatus(str, Enum):
    PENDING = "PENDING"
    PLANNING = "PLANNING"
    RESEARCHING = "RESEARCHING"
    WRITING = "WRITING"
    REVIEWING = "REVIEWING"
    REVISING = "REVISING"
    DONE = "DONE"
    FAILED = "FAILED"


class AgentResult(BaseModel):
    agent_name: str
    status: str
    input: str
    output: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class Task(BaseModel):
    id: str
    request: str
    status: TaskStatus = TaskStatus.PENDING
    agent_results: List[AgentResult] = Field(default_factory=list)
    final_report: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


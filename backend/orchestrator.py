from __future__ import annotations

import asyncio
import uuid
from typing import Dict

from agents import PlannerAgent, ResearcherAgent, WriterAgent, ReviewerAgent
from models import Task, TaskStatus, AgentResult


class Orchestrator:
    """Runs the multi-agent pipeline and updates shared in-memory task state."""

    def __init__(self, tasks_store: Dict[str, Task]) -> None:
        self.tasks_store = tasks_store
        self.planner = PlannerAgent()
        self.researcher = ResearcherAgent()
        self.writer = WriterAgent()
        self.reviewer = ReviewerAgent()

    def create_task(self, request: str) -> Task:
        task_id = uuid.uuid4().hex
        task = Task(id=task_id, request=request, status=TaskStatus.PENDING)
        self.tasks_store[task_id] = task
        return task

    async def run_task(self, task_id: str) -> None:
        task = self.tasks_store.get(task_id)
        if not task:
            return

        try:
            # Planner
            task.status = TaskStatus.PLANNING
            planner_result = await self.planner.run(task.request)
            self._append_result(task, planner_result)
            await asyncio.sleep(1.5)

            # Researcher
            task.status = TaskStatus.RESEARCHING
            researcher_input = planner_result.output
            researcher_result = await self.researcher.run(researcher_input)
            self._append_result(task, researcher_result)
            await asyncio.sleep(1.5)

            # Writer - initial draft
            task.status = TaskStatus.WRITING
            writer_input = researcher_result.output
            writer_result = await self.writer.run(writer_input)
            self._append_result(task, writer_result)
            await asyncio.sleep(1.5)

            # Reviewer - first pass
            task.status = TaskStatus.REVIEWING
            reviewer_input = writer_result.output
            reviewer_result = await self.reviewer.run(reviewer_input)
            self._append_result(task, reviewer_result)
            await asyncio.sleep(1.5)

            if reviewer_result.status == "NEEDS_REVISION":
                # Revision cycle must be clearly visible in the UI, so we mark the task as REVISING.
                task.status = TaskStatus.REVISING
                revision_input = (
                    f"{writer_result.output}\n\nReviewer feedback: {reviewer_result.output}\n\n[REVISION]"
                )
                revised_writer_result = await self.writer.run(revision_input)
                self._append_result(task, revised_writer_result)
                await asyncio.sleep(1.5)

                task.status = TaskStatus.REVIEWING
                final_reviewer_input = f"{revised_writer_result.output}\n\n[REVISION]"
                final_reviewer_result = await self.reviewer.run(final_reviewer_input)
                self._append_result(task, final_reviewer_result)
                await asyncio.sleep(1.5)

                final_report = revised_writer_result.output
            else:
                final_report = writer_result.output

            task.status = TaskStatus.DONE
            task.final_report = final_report
            self.tasks_store[task_id] = task
        except Exception as exc:
            # Non-obvious: in case of failure we still persist the error as a synthetic AgentResult for easier debugging.
            failure_result = AgentResult(
                agent_name="Orchestrator",
                status="FAILED",
                input=task.request,
                output=f"Pipeline failed: {exc}",
            )
            self._append_result(task, failure_result)
            task.status = TaskStatus.FAILED
            self.tasks_store[task_id] = task

    def _append_result(self, task: Task, result: AgentResult) -> None:
        task.agent_results.append(result)
        self.tasks_store[task.id] = task


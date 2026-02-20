from __future__ import annotations

import json
from textwrap import dedent

from .base import Agent
from models import AgentResult


class PlannerAgent(Agent):
    def __init__(self) -> None:
        super().__init__(name="Planner")

    async def run(self, input_text: str) -> AgentResult:
        # The planner tailors subtasks to the specific user request so plans feel dynamic.
        subtasks = [
            f"Clarify the core goal of the request: {input_text[:120]}",
            f"Break down the main aspects that must be researched for: {input_text[:160]}",
            f"Identify trade-offs, constraints, and edge cases related to: {input_text[:160]}",
            f"Synthesize a final perspective and recommendations grounded in the original request: {input_text[:160]}",
        ]
        plan = {"subtasks": subtasks}
        output = json.dumps(plan, indent=2)

        return AgentResult(
            agent_name=self.name,
            status="PLANNED",
            input=dedent(
                f"""\
                Original request:
                {input_text}

                Planning objective: turn the request into actionable research subtasks.
                """
            ),
            output=output,
        )


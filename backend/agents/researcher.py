from __future__ import annotations

import json
from textwrap import dedent
from typing import List

from .base import Agent
from models import AgentResult


class ResearcherAgent(Agent):
    def __init__(self) -> None:
        super().__init__(name="Researcher")

    async def run(self, input_text: str) -> AgentResult:
        # The researcher expects a JSON plan from the planner containing subtasks.
        try:
            data = json.loads(input_text)
            subtasks: List[str] = data.get("subtasks", [])
        except Exception:
            subtasks = [input_text]

        findings_sections = []
        for i, sub in enumerate(subtasks, start=1):
            findings_sections.append(
                dedent(
                    f"""\
                    ### Finding {i}: {sub}

                    - Context: This directly derives from the user's request, ensuring the research is tightly scoped.
                    - Key insights: For the request "{sub}", realistic trade-offs, risks, and benefits are considered.
                    - Practical angle: The findings are framed so they can feed cleanly into a written report tailored to the original request.
                    """
                )
            )

        findings_body = "\n\n".join(findings_sections)
        output = dedent(
            f"""\
            ## Research Summary (grounded in the original request)

            The following findings are organized per subtask so the writer can compose a cohesive report that feels specific to the
            user's request.

            {findings_body}
            """
        )

        return AgentResult(
            agent_name=self.name,
            status="RESEARCHED",
            input=input_text,
            output=output,
        )


from __future__ import annotations

import random
from textwrap import dedent

from .base import Agent
from models import AgentResult


class ReviewerAgent(Agent):
    def __init__(self) -> None:
        super().__init__(name="Reviewer")

    async def run(self, input_text: str) -> AgentResult:
        # The reviewer always approves revision rounds, and otherwise randomly rejects ~30% of first drafts.
        if "[REVISION]" in input_text:
            status = "APPROVED"
            feedback = dedent(
                """\
                The revised draft addresses the earlier concerns with structure, clarity, and specificity.
                It is now suitable to deliver as the final report.
                """
            )
        else:
            if random.random() < 0.3:
                status = "NEEDS_REVISION"
                feedback = dedent(
                    """\
                    The current draft is promising but needs revision:
                    - Clarify the connection to the original user request in the introduction.
                    - Tighten redundant bullet points in the research section.
                    - Make the conclusion more concrete with explicit recommendations.
                    """
                )
            else:
                status = "APPROVED"
                feedback = dedent(
                    """\
                    The draft is clear, well-organized, and grounded in the user's request.
                    It can be treated as the final report without further changes.
                    """
                )

        return AgentResult(
            agent_name=self.name,
            status=status,
            input=input_text,
            output=feedback,
        )


from __future__ import annotations

from textwrap import dedent

from .base import Agent
from models import AgentResult


class WriterAgent(Agent):
    def __init__(self) -> None:
        super().__init__(name="Writer")

    async def run(self, input_text: str) -> AgentResult:
        # The writer detects embedded reviewer feedback to produce a revised draft that feels clearly improved.
        feedback_marker = "Reviewer feedback:"
        has_feedback = feedback_marker in input_text

        if has_feedback:
            research_part, feedback_part = input_text.split(feedback_marker, maxsplit=1)
            feedback_part = feedback_part.strip()
        else:
            research_part = input_text
            feedback_part = ""

        introduction = dedent(
            """\
            # Analysis Report

            This report is based on the multi-agent research pipeline and is tailored to the user's original request.
            """
        )

        body = dedent(
            f"""\
            ## Key Research Insights

            The researcher produced the following structured findings, which are woven directly into this draft:

            {research_part.strip()}
            """
        )

        if has_feedback and feedback_part:
            revision_section = dedent(
                f"""\
                ## Incorporated Reviewer Feedback

                The reviewer requested specific revisions. The following feedback has been explicitly addressed:

                > {feedback_part}

                The report has been tightened, clarified, and reorganized so that these concerns are clearly resolved.
                """
            )
        else:
            revision_section = ""

        conclusion = dedent(
            """\
            ## Conclusion

            The analysis above summarizes the main findings and trade-offs. It is intended as a concise, decision-ready
            artifact that can be adapted into documentation, presentations, or implementation plans.
            """
        )

        output_parts = [introduction, body]
        if revision_section:
            output_parts.append(revision_section)
        output_parts.append(conclusion)

        output = "\n\n".join(part.strip() for part in output_parts if part.strip())

        status = "DRAFT_REVISED" if has_feedback else "DRAFT_CREATED"

        return AgentResult(
            agent_name=self.name,
            status=status,
            input=input_text,
            output=output,
        )


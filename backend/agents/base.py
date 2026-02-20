from __future__ import annotations

from abc import ABC, abstractmethod

from models import AgentResult


class Agent(ABC):
    """Base class for all agents with a consistent interface."""

    def __init__(self, name: str) -> None:
        self.name = name

    @abstractmethod
    async def run(self, input_text: str) -> AgentResult:  # pragma: no cover - interface definition
        """Execute the agent on the given input and return an AgentResult."""
        raise NotImplementedError


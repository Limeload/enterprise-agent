"""Abstract base class for all connectors."""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class BaseConnector(ABC):
    name: str = ""

    @abstractmethod
    async def search(self, query: str, entities: dict[str, Any], limit: int = 5) -> list[dict]:
        """Full-text / semantic search returning a list of RetrievedDoc dicts."""
        ...

    async def get_item(self, item_id: str) -> dict | None:
        """Fetch a single item by ID. Optional — not all connectors support it."""
        return None

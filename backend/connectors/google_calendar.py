"""Google Calendar connector via Calendar REST API v3."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx

from connectors.base import BaseConnector


class GoogleCalendarConnector(BaseConnector):
    name = "google_calendar"

    def __init__(self, token: str) -> None:
        self._token = token
        self._headers = {"Authorization": f"Bearer {self._token}"}
        self._base = "https://www.googleapis.com/calendar/v3"

    async def search(self, query: str, entities: dict[str, Any], limit: int = 5) -> list[dict]:
        events = await self.list_events(query=query, limit=limit)
        return [self._event_to_doc(e) for e in events]

    async def list_events(
        self,
        calendar_id: str = "primary",
        query: str = "",
        limit: int = 10,
        time_min: str | None = None,
    ) -> list[dict]:
        now = time_min or datetime.now(timezone.utc).isoformat()
        params: dict[str, Any] = {
            "maxResults": limit,
            "orderBy": "startTime",
            "singleEvents": "true",
            "timeMin": now,
        }
        if query:
            params["q"] = query

        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(f"{self._base}/calendars/{calendar_id}/events", params=params)
            if resp.status_code != 200:
                return []
            return resp.json().get("items", [])

    def _event_to_doc(self, event: dict) -> dict:
        start = event.get("start", {})
        start_time = start.get("dateTime") or start.get("date", "")
        return {
            "source": "google_calendar",
            "doc_id": event.get("id", ""),
            "title": event.get("summary", "No title"),
            "content": event.get("description", ""),
            "url": event.get("htmlLink", ""),
            "score": 0.75,
            "metadata": {
                "start": start_time,
                "end": event.get("end", {}).get("dateTime") or event.get("end", {}).get("date", ""),
                "location": event.get("location", ""),
                "attendees": [a.get("email", "") for a in event.get("attendees", [])],
                "organizer": event.get("organizer", {}).get("email", ""),
            },
        }

    async def get_event(self, event_id: str, calendar_id: str = "primary") -> dict | None:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(f"{self._base}/calendars/{calendar_id}/events/{event_id}")
            if resp.status_code != 200:
                return None
            return self._event_to_doc(resp.json())

    async def get_item(self, item_id: str) -> dict | None:
        return await self.get_event(item_id)

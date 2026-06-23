"""Lightweight PII masking before text is sent to LLMs or stored in logs."""
from __future__ import annotations

import re

# Patterns ordered most-specific to least-specific
_PATTERNS: list[tuple[str, re.Pattern]] = [
    ("EMAIL", re.compile(r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b")),
    ("PHONE", re.compile(r"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b")),
    ("SSN", re.compile(r"\b\d{3}-\d{2}-\d{4}\b")),
    ("CREDIT_CARD", re.compile(r"\b(?:4\d{12}(?:\d{3})?|5[1-5]\d{14}|3[47]\d{13}|6(?:011|5\d{2})\d{12})\b")),
    ("IP_ADDRESS", re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")),
    ("AWS_KEY", re.compile(r"\b(AKIA[0-9A-Z]{16})\b")),
    ("GH_TOKEN", re.compile(r"\b(ghp_[A-Za-z0-9]{36})\b")),
    ("API_KEY", re.compile(r"\b(sk-[A-Za-z0-9]{32,})\b")),
]


def mask(text: str) -> str:
    """Replace detected PII patterns with typed placeholders."""
    for label, pattern in _PATTERNS:
        text = pattern.sub(f"[{label}_REDACTED]", text)
    return text


def mask_dict(data: dict) -> dict:
    """Recursively mask string values in a dict."""
    out = {}
    for k, v in data.items():
        if isinstance(v, str):
            out[k] = mask(v)
        elif isinstance(v, dict):
            out[k] = mask_dict(v)
        elif isinstance(v, list):
            out[k] = [mask(i) if isinstance(i, str) else i for i in v]
        else:
            out[k] = v
    return out

"""Symmetric encryption for per-user connector credentials at rest."""
from __future__ import annotations

import base64
import hashlib
from functools import lru_cache

from cryptography.fernet import Fernet

from core.config import settings


@lru_cache
def _fernet() -> Fernet:
    key_material = settings.connection_encryption_key or settings.api_secret_key
    # Derive a valid 32-byte urlsafe-base64 Fernet key from arbitrary key material.
    digest = hashlib.sha256(key_material.encode("utf-8")).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def encrypt_secret(plaintext: str) -> str:
    return _fernet().encrypt(plaintext.encode("utf-8")).decode("utf-8")


def decrypt_secret(ciphertext: str) -> str:
    return _fernet().decrypt(ciphertext.encode("utf-8")).decode("utf-8")

"""AES-256-GCM encryption for connector tokens stored at rest.

Key derivation and wire format match the frontend (src/lib/oauth/encrypt.ts) so
tokens encrypted by Next.js can be decrypted here without any extra round-trip.

Format: base64url(iv):base64url(authTag):base64url(ciphertext)
"""
from __future__ import annotations

import base64
import hashlib
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from core.config import settings


def _derive_key() -> bytes:
    material = settings.connection_encryption_key or settings.api_secret_key
    return hashlib.sha256(material.encode("utf-8")).digest()


def _b64u_encode(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode("ascii")


def _b64u_decode(s: str) -> bytes:
    # Re-add padding
    pad = 4 - len(s) % 4
    if pad != 4:
        s += "=" * pad
    return base64.urlsafe_b64decode(s)


def encrypt_secret(plaintext: str) -> str:
    key = _derive_key()
    iv = os.urandom(12)
    aesgcm = AESGCM(key)
    ct_with_tag = aesgcm.encrypt(iv, plaintext.encode("utf-8"), None)
    ciphertext = ct_with_tag[:-16]
    auth_tag = ct_with_tag[-16:]
    return f"{_b64u_encode(iv)}:{_b64u_encode(auth_tag)}:{_b64u_encode(ciphertext)}"


def decrypt_secret(token: str) -> str:
    parts = token.split(":")
    if len(parts) != 3:
        raise ValueError("Invalid ciphertext format")
    iv = _b64u_decode(parts[0])
    auth_tag = _b64u_decode(parts[1])
    ciphertext = _b64u_decode(parts[2])
    key = _derive_key()
    aesgcm = AESGCM(key)
    plaintext = aesgcm.decrypt(iv, ciphertext + auth_tag, None)
    return plaintext.decode("utf-8")

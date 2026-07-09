-- Migration: composio_oauth
-- Replace self-hosted token storage with Composio connection ID reference.

ALTER TABLE "Connector"
  DROP COLUMN IF EXISTS "encryptedAccessToken",
  DROP COLUMN IF EXISTS "encryptedRefreshToken",
  DROP COLUMN IF EXISTS "tokenExpiresAt",
  ADD COLUMN IF NOT EXISTS "composioConnectionId" TEXT;

DROP TABLE IF EXISTS "OAuthState";

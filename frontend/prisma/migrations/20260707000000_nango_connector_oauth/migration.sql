-- Migration: nango_connector_oauth
-- Replace Composio/encrypted token storage with Nango connection ID references.
-- Nango owns all OAuth credentials; BrainCache stores only the connection ID.

ALTER TABLE "Connector"
  DROP COLUMN IF EXISTS "encryptedAccessToken",
  DROP COLUMN IF EXISTS "encryptedRefreshToken",
  DROP COLUMN IF EXISTS "expiresAt",
  ADD COLUMN "nangoConnectionId"    TEXT,
  ADD COLUMN "providerAccountId"    TEXT,
  ADD COLUMN "providerAccountEmail" TEXT;

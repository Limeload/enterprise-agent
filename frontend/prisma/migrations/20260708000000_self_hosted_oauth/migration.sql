-- Migration: self_hosted_oauth
-- Replace Nango connection ID with encrypted token storage.

ALTER TABLE "Connector"
  DROP COLUMN IF EXISTS "nangoConnectionId",
  ADD COLUMN IF NOT EXISTS "encryptedAccessToken"  TEXT,
  ADD COLUMN IF NOT EXISTS "encryptedRefreshToken" TEXT,
  ADD COLUMN IF NOT EXISTS "tokenExpiresAt"        TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "OAuthState" (
  "id"          TEXT NOT NULL,
  "state"       TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "provider"    "ConnectorProvider" NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "expiresAt"   TIMESTAMP(3) NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OAuthState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OAuthState_state_key" ON "OAuthState"("state");

-- Expire states older than 10 minutes (run periodically or on read)
DELETE FROM "OAuthState" WHERE "expiresAt" < NOW();

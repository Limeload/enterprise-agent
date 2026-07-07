import { PrismaClient } from "@prisma/client"
import { existsSync, readFileSync } from "fs"
import { join } from "path"

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return

  // process.cwd() may be repo root or frontend/ depending on how Next.js was started
  const candidates = [
    join(process.cwd(), ".env.local"),
    join(process.cwd(), "frontend", ".env.local"),
  ]

  for (const envPath of candidates) {
    if (!existsSync(envPath)) continue
    const line = readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .find((l) => l.startsWith("DATABASE_URL="))
    const value = line?.slice("DATABASE_URL=".length).trim()
    if (value) {
      process.env.DATABASE_URL = value
      return
    }
  }
}

loadDatabaseUrl()

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

// Discard any singleton that was created before DATABASE_URL was resolved
if (globalForPrisma.prisma && !process.env.DATABASE_URL) {
  globalForPrisma.prisma = undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["error"] : [] })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

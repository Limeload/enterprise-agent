import { randomBytes, createCipheriv, createDecipheriv } from "crypto"

const ALGO = "aes-256-gcm"

function getKey(): Buffer {
  const raw = process.env.CONNECTOR_ENCRYPTION_KEY
  if (!raw) {
    throw new Error("CONNECTOR_ENCRYPTION_KEY is not set (expected 64 hex chars = 32 bytes)")
  }
  return Buffer.from(raw, "hex")
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString("hex"), tag.toString("hex"), encrypted.toString("hex")].join(":")
}

export function decrypt(ciphertext: string): string {
  const [ivHex, tagHex, dataHex] = ciphertext.split(":")
  const iv = Buffer.from(ivHex, "hex")
  const tag = Buffer.from(tagHex, "hex")
  const data = Buffer.from(dataHex, "hex")
  const decipher = createDecipheriv(ALGO, getKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8")
}

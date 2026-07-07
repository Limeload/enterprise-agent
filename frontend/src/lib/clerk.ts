export function isValidClerkPublishableKey(key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  return Boolean(
    key &&
      !key.includes("...") &&
      !key.includes("replace") &&
      !key.includes("placeholder") &&
      /^pk_(test|live)_[A-Za-z0-9_-]+$/.test(key)
  )
}

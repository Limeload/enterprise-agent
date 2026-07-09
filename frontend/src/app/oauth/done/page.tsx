"use client"

import { useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"

/**
 * OAuth popup landing page.
 *
 * When the OAuth callback completes it redirects here. This page fires a
 * postMessage to the opener window and closes itself. If the window was not
 * opened as a popup (e.g. direct navigation), it redirects to /integrations.
 */
function OAuthDone() {
  const params = useSearchParams()
  const provider = params.get("provider")
  const error = params.get("error")

  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage(
        error
          ? { type: "oauth_error", error }
          : { type: "oauth_success", provider },
        window.location.origin
      )
      window.close()
    } else {
      // Not a popup — navigate to the integrations page with a status query
      const dest = error
        ? `/integrations?error=${encodeURIComponent(error)}`
        : `/integrations?connected=${provider}`
      window.location.replace(dest)
    }
  }, [provider, error])

  return null
}

export default function OAuthDonePage() {
  return (
    <Suspense>
      <OAuthDone />
    </Suspense>
  )
}

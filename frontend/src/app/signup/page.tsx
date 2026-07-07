import { SignUp } from "@clerk/nextjs"
import BrainCacheLogo from "@/components/BrainCacheLogo"
import { isValidClerkPublishableKey } from "@/lib/clerk"

export default function SignUpPage() {
  const clerkReady = isValidClerkPublishableKey()

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-base px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-bc-accent/8 blur-[120px]" />
      </div>

      <div className="relative flex flex-col items-center gap-6 animate-fade-in">
        <BrainCacheLogo size={36} />
        {clerkReady ? (
          <SignUp
            routing="hash"
            signInUrl="/login"
            forceRedirectUrl="/api/workspace/bootstrap-redirect"
            fallbackRedirectUrl="/api/workspace/bootstrap-redirect"
          />
        ) : (
          <div className="w-full max-w-sm rounded-lg border border-surface-border bg-surface-raised p-6 text-center shadow-card">
            <h1 className="text-[18px] font-semibold text-copy-primary">Authentication setup needed</h1>
            <p className="mt-2 text-[13px] leading-relaxed text-copy-muted">
              Add valid Clerk keys to <code className="font-mono">frontend/.env.local</code>, then restart the dev server.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

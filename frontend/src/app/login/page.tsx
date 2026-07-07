import { SignIn } from "@clerk/nextjs"
import BrainCacheLogo from "@/components/BrainCacheLogo"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-base px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-bc-accent/8 blur-[120px]" />
      </div>

      <div className="relative flex flex-col items-center gap-6 animate-fade-in">
        <BrainCacheLogo size={36} />
        <SignIn routing="hash" />
      </div>
    </div>
  )
}

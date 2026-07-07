"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { MessageSquare, Plug2, BarChart3, CreditCard, Settings, LogOut } from "lucide-react"
import BrainCacheLogo from "@/components/BrainCacheLogo"
import { useSession, signOut } from "@/lib/auth-client"

const NAV = [
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/integrations", label: "Integrations", icon: Plug2 },
  { href: "/usage", label: "Usage", icon: BarChart3 },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
]

export default function AppNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()

  const email = session?.user.email ?? ""
  const name = session?.user.name ?? email
  const initials = (name || email || "BC").slice(0, 2).toUpperCase()

  return (
    <aside className="flex h-screen w-[232px] shrink-0 flex-col border-r border-surface-border bg-surface-raised">
      <div className="px-5 py-5">
        <Link href="/chat">
          <BrainCacheLogo size={30} />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                active
                  ? "bg-bc-accent/10 text-bc-accent"
                  : "text-copy-secondary hover:bg-surface-over hover:text-copy-primary"
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-surface-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bc-gradient text-[10px] font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-copy-primary">{name}</p>
            <p className="truncate text-[10px] text-copy-muted">{email}</p>
          </div>
          <button
            onClick={() => signOut().then(() => router.replace("/"))}
            title="Sign out"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-copy-disabled hover:bg-surface-over hover:text-cache-err transition-all"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { isValidClerkPublishableKey } from "@/lib/clerk"

const isPublic = createRouteMatcher([
  "/",
  "/login(.*)",
  "/signup(.*)",
  "/pricing",
  "/api/billing/webhook",
  "/api/workspace/bootstrap-redirect",
])

const authMiddleware = clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) await auth.protect()
})

export default isValidClerkPublishableKey()
  ? authMiddleware
  : function middleware() {
      return NextResponse.next()
    }

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}

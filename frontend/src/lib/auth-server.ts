import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      // TODO: wire up email service
      console.log("Reset password URL for", user.email, ":", url)
    },
  },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh if > 1 day old
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },

  user: {
    additionalFields: {
      // Nothing extra on user — workspace data is in separate tables
    },
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user

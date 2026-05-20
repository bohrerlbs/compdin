import type { NextAuthConfig } from "next-auth"
import type { Role } from "@prisma/client"

export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isLoginPage = nextUrl.pathname.startsWith("/login")
      if (isLoginPage) return true
      return isLoggedIn
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.matricula = (user as { matricula: string }).matricula
        token.trigrama = (user as { trigrama: string }).trigrama
        token.role = (user as { role: Role }).role
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.matricula = token.matricula as string
      session.user.trigrama = token.trigrama as string
      session.user.role = token.role as Role
      return session
    },
  },
  session: { strategy: "jwt" },
} satisfies NextAuthConfig

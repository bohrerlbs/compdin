import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        matricula: { label: "Matrícula", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.matricula || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { matricula: credentials.matricula as string },
        })

        if (!user || !user.ativo) return null

        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          name: user.nome,
          matricula: user.matricula,
          trigrama: user.trigrama,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
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
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
})

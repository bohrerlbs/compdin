import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { authConfig } from "@/auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
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
})

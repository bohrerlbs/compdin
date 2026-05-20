import { Role } from "@prisma/client"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      matricula: string
      trigrama: string
      role: Role
    } & DefaultSession["user"]
  }
}

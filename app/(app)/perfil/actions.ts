"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

async function getUser() {
  const session = await auth()
  if (!session) throw new Error("Não autorizado.")
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) throw new Error("Usuário não encontrado.")
  return user
}

export async function alterarTrigrama(senhaAtual: string, novoTrigrama: string): Promise<{ error?: string }> {
  try {
    const user = await getUser()
    const ok = await bcrypt.compare(senhaAtual, user.passwordHash)
    if (!ok) return { error: "Senha incorreta." }
    const trig = novoTrigrama.toUpperCase().trim()
    if (!/^[A-Z]{3}$/.test(trig)) return { error: "Trigrama deve ter exatamente 3 letras maiúsculas." }
    await prisma.user.update({ where: { id: user.id }, data: { trigrama: trig } })
    return {}
  } catch (err) {
    if (err instanceof Error && err.message === "Não autorizado.") throw err
    const msg = err instanceof Error ? err.message : "Erro."
    if (msg.includes("Unique constraint") || msg.includes("unique constraint")) return { error: "Trigrama já em uso." }
    return { error: msg }
  }
}

export async function alterarMatricula(senhaAtual: string, novaMatricula: string): Promise<{ error?: string }> {
  try {
    const user = await getUser()
    const ok = await bcrypt.compare(senhaAtual, user.passwordHash)
    if (!ok) return { error: "Senha incorreta." }
    const mat = novaMatricula.trim().toLowerCase()
    if (!mat) return { error: "Matrícula não pode ser vazia." }
    await prisma.user.update({ where: { id: user.id }, data: { matricula: mat } })
    return {}
  } catch (err) {
    if (err instanceof Error && err.message === "Não autorizado.") throw err
    const msg = err instanceof Error ? err.message : "Erro."
    if (msg.includes("Unique constraint") || msg.includes("unique constraint")) return { error: "Matrícula já em uso." }
    return { error: msg }
  }
}

export async function alterarSenhaPropria(senhaAtual: string, novaSenha: string): Promise<{ error?: string }> {
  try {
    const user = await getUser()
    const ok = await bcrypt.compare(senhaAtual, user.passwordHash)
    if (!ok) return { error: "Senha atual incorreta." }
    if (novaSenha.length < 6) return { error: "Nova senha deve ter pelo menos 6 caracteres." }
    const passwordHash = await bcrypt.hash(novaSenha, 10)
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
    return {}
  } catch (err) {
    if (err instanceof Error && err.message === "Não autorizado.") throw err
    return { error: err instanceof Error ? err.message : "Erro ao alterar senha." }
  }
}

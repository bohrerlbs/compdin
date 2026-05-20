"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"

async function checkPermissao() {
  const session = await auth()
  if (!session) throw new Error("Não autorizado.")
  const { role } = session.user
  if (role !== "ENCARREGADO" && role !== "INSPETOR" && role !== "ADMIN") throw new Error("Sem permissão.")
  return session
}

export async function criarUsuario(data: {
  nome: string
  trigrama: string
  matricula: string
  senha: string
  role: Role
}): Promise<{ error?: string }> {
  try {
    await checkPermissao()

    const trigrama = data.trigrama.toUpperCase().trim()
    const matricula = data.matricula.trim().toLowerCase()

    if (!/^[A-Z]{3}$/.test(trigrama)) return { error: "Trigrama deve ter exatamente 3 letras." }
    if (!data.nome.trim()) return { error: "Nome obrigatório." }
    if (data.senha.length < 6) return { error: "Senha deve ter pelo menos 6 caracteres." }

    const passwordHash = await bcrypt.hash(data.senha, 10)

    await prisma.user.create({
      data: {
        nome: data.nome.trim(),
        trigrama,
        matricula,
        passwordHash,
        role: data.role,
      },
    })

    return {}
  } catch (err) {
    if (err instanceof Error && (err.message === "Não autorizado." || err.message === "Sem permissão.")) throw err
    const msg = err instanceof Error ? err.message : "Erro ao criar usuário."
    if (msg.includes("Unique constraint") || msg.includes("unique constraint")) {
      return { error: "Matrícula ou trigrama já cadastrado." }
    }
    return { error: msg }
  }
}

export async function alterarSenha(userId: string, novaSenha: string): Promise<{ error?: string }> {
  try {
    await checkPermissao()
    if (novaSenha.length < 6) return { error: "Senha deve ter pelo menos 6 caracteres." }
    const passwordHash = await bcrypt.hash(novaSenha, 10)
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
    return {}
  } catch (err) {
    if (err instanceof Error && (err.message === "Não autorizado." || err.message === "Sem permissão.")) throw err
    return { error: err instanceof Error ? err.message : "Erro ao alterar senha." }
  }
}

export async function editarUsuario(userId: string, data: {
  nome?: string
  trigrama?: string
  matricula?: string
  role?: Role
}): Promise<{ error?: string }> {
  try {
    await checkPermissao()
    const updates: Record<string, unknown> = {}
    if (data.nome !== undefined) {
      if (!data.nome.trim()) return { error: "Nome obrigatório." }
      updates.nome = data.nome.trim()
    }
    if (data.trigrama !== undefined) {
      const trig = data.trigrama.toUpperCase().trim()
      if (!/^[A-Z]{3}$/.test(trig)) return { error: "Trigrama deve ter exatamente 3 letras." }
      updates.trigrama = trig
    }
    if (data.matricula !== undefined) {
      const mat = data.matricula.trim().toLowerCase()
      if (!mat) return { error: "Matrícula obrigatória." }
      updates.matricula = mat
    }
    if (data.role !== undefined) updates.role = data.role
    if (Object.keys(updates).length === 0) return {}
    await prisma.user.update({ where: { id: userId }, data: updates })
    return {}
  } catch (err) {
    if (err instanceof Error && (err.message === "Não autorizado." || err.message === "Sem permissão.")) throw err
    const msg = err instanceof Error ? err.message : "Erro ao editar."
    if (msg.includes("Unique constraint") || msg.includes("unique constraint")) return { error: "Matrícula ou trigrama já em uso." }
    return { error: msg }
  }
}

export async function deletarUsuario(userId: string): Promise<{ error?: string }> {
  try {
    await checkPermissao()
    await prisma.user.delete({ where: { id: userId } })
    return {}
  } catch (err) {
    if (err instanceof Error && (err.message === "Não autorizado." || err.message === "Sem permissão.")) throw err
    const msg = err instanceof Error ? err.message : "Erro ao deletar."
    if (msg.includes("Foreign key") || msg.includes("foreign key")) return { error: "Usuário possui registros vinculados e não pode ser deletado." }
    return { error: msg }
  }
}

export async function toggleAtivo(userId: string, ativo: boolean): Promise<{ error?: string }> {
  try {
    await checkPermissao()
    await prisma.user.update({ where: { id: userId }, data: { ativo } })
    return {}
  } catch (err) {
    if (err instanceof Error && (err.message === "Não autorizado." || err.message === "Sem permissão.")) throw err
    return { error: err instanceof Error ? err.message : "Erro ao atualizar usuário." }
  }
}

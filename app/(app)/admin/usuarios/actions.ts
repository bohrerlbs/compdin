"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"

async function checkPermissao() {
  const session = await auth()
  if (!session) throw new Error("Não autorizado.")
  const { role } = session.user
  if (role !== "ENCARREGADO" && role !== "ADMIN") throw new Error("Sem permissão.")
  return session
}

export async function criarUsuario(data: {
  nome: string
  trigrama: string
  matricula: string
  senha: string
  role: Role
}) {
  await checkPermissao()

  const trigrama = data.trigrama.toUpperCase().trim()
  const matricula = data.matricula.trim().toLowerCase()

  if (!/^[A-Z]{3}$/.test(trigrama)) throw new Error("Trigrama deve ter exatamente 3 letras.")
  if (!data.nome.trim()) throw new Error("Nome obrigatório.")
  if (data.senha.length < 6) throw new Error("Senha deve ter pelo menos 6 caracteres.")

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
}

export async function alterarSenha(userId: string, novaSenha: string) {
  await checkPermissao()
  if (novaSenha.length < 6) throw new Error("Senha deve ter pelo menos 6 caracteres.")
  const passwordHash = await bcrypt.hash(novaSenha, 10)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
}

export async function toggleAtivo(userId: string, ativo: boolean) {
  await checkPermissao()
  await prisma.user.update({ where: { id: userId }, data: { ativo } })
}

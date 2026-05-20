"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

async function checkPermissao() {
  const session = await auth()
  if (!session) throw new Error("Não autorizado.")
  const { role } = session.user
  if (role !== "ENCARREGADO" && role !== "ADMIN") throw new Error("Sem permissão.")
  return session
}

export async function criarAeronave(data: { matricula: string; modelo: string }) {
  await checkPermissao()

  const matricula = data.matricula.trim()
  const modelo = data.modelo.trim() || "H-60L"

  if (!matricula) throw new Error("Matrícula obrigatória.")

  await prisma.anv.create({ data: { matricula, modelo } })
}

export async function toggleAtivoAeronave(id: string, ativo: boolean) {
  await checkPermissao()
  await prisma.anv.update({ where: { id }, data: { ativo } })
}

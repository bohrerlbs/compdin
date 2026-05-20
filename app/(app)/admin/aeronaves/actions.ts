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

export async function deletarAeronave(id: string): Promise<{ error?: string }> {
  try {
    await checkPermissao()
    await prisma.anv.delete({ where: { id } })
    return {}
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao deletar."
    if (msg.includes("Foreign key") || msg.includes("foreign key")) return { error: "Aeronave possui inspeções vinculadas e não pode ser deletada." }
    return { error: msg }
  }
}

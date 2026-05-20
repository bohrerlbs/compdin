"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const PRIVILEGED = ["ADMIN", "ENCARREGADO", "INSPETOR"]

export async function criarAvisoGeral(
  titulo: string,
  corpo: string,
  expiresAt?: string,
): Promise<{ error?: string }> {
  try {
    const session = await auth()
    if (!session) return { error: "Não autorizado." }
    if (!titulo.trim() || !corpo.trim()) return { error: "Título e corpo são obrigatórios." }

    await prisma.avisoGeral.create({
      data: {
        titulo: titulo.trim(),
        corpo: corpo.trim(),
        autorId: session.user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })
    revalidatePath("/anvs")
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao criar aviso." }
  }
}

export async function editarAvisoGeral(
  id: string,
  titulo: string,
  corpo: string,
  expiresAt?: string,
): Promise<{ error?: string }> {
  try {
    const session = await auth()
    if (!session) return { error: "Não autorizado." }
    if (!titulo.trim() || !corpo.trim()) return { error: "Título e corpo são obrigatórios." }

    const aviso = await prisma.avisoGeral.findUnique({ where: { id }, select: { autorId: true } })
    if (!aviso) return { error: "Aviso não encontrado." }

    const canEdit = aviso.autorId === session.user.id || PRIVILEGED.includes(session.user.role)
    if (!canEdit) return { error: "Sem permissão para editar este aviso." }

    await prisma.avisoGeral.update({
      where: { id },
      data: {
        titulo: titulo.trim(),
        corpo: corpo.trim(),
        editadoEm: new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })
    revalidatePath("/anvs")
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao editar aviso." }
  }
}

export async function deletarAvisoGeral(id: string): Promise<{ error?: string }> {
  try {
    const session = await auth()
    if (!session) return { error: "Não autorizado." }

    const aviso = await prisma.avisoGeral.findUnique({ where: { id }, select: { autorId: true } })
    if (!aviso) return { error: "Aviso não encontrado." }

    const canDelete = aviso.autorId === session.user.id || PRIVILEGED.includes(session.user.role)
    if (!canDelete) return { error: "Sem permissão para excluir este aviso." }

    await prisma.avisoGeral.delete({ where: { id } })
    revalidatePath("/anvs")
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao excluir aviso." }
  }
}

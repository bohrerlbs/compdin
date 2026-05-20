"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { StatusTarefa } from "@prisma/client"
import { revalidatePath } from "next/cache"

const PRIVILEGED = ["ADMIN", "ENCARREGADO", "INSPETOR"]

export async function criarTarefa(titulo: string, descricao?: string): Promise<{ error?: string }> {
  try {
    const session = await auth()
    if (!session) return { error: "Não autorizado." }
    if (!titulo.trim()) return { error: "Título obrigatório." }

    await prisma.tarefaCompdin.create({
      data: {
        titulo: titulo.trim(),
        descricao: descricao?.trim() || null,
        autorId: session.user.id,
      },
    })
    revalidatePath("/anvs")
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao criar tarefa." }
  }
}

export async function atualizarStatusTarefa(
  id: string,
  novoStatus: StatusTarefa,
): Promise<{ error?: string }> {
  try {
    const session = await auth()
    if (!session) return { error: "Não autorizado." }

    const tarefa = await prisma.tarefaCompdin.findUnique({
      where: { id },
      select: { status: true, autorId: true },
    })
    if (!tarefa) return { error: "Tarefa não encontrada." }

    // Going backwards (reabrir) requires privileges
    const goingBack = novoStatus === "PENDENTE"
    if (goingBack && !PRIVILEGED.includes(session.user.role) && tarefa.autorId !== session.user.id) {
      return { error: "Sem permissão para reabrir esta tarefa." }
    }

    await prisma.tarefaCompdin.update({
      where: { id },
      data: {
        status: novoStatus,
        responsavelId: novoStatus !== "PENDENTE" ? session.user.id : null,
        iniciadoEm: novoStatus === "INICIADA" ? new Date() : novoStatus === "PENDENTE" ? null : undefined,
        concluidoEm: novoStatus === "CONCLUIDA" ? new Date() : novoStatus === "PENDENTE" || novoStatus === "INICIADA" ? null : undefined,
      },
    })
    revalidatePath("/anvs")
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao atualizar tarefa." }
  }
}

export async function editarTarefa(
  id: string,
  titulo: string,
  descricao?: string,
): Promise<{ error?: string }> {
  try {
    const session = await auth()
    if (!session) return { error: "Não autorizado." }
    if (!titulo.trim()) return { error: "Título obrigatório." }

    const tarefa = await prisma.tarefaCompdin.findUnique({ where: { id }, select: { autorId: true } })
    if (!tarefa) return { error: "Tarefa não encontrada." }

    const canEdit = tarefa.autorId === session.user.id || PRIVILEGED.includes(session.user.role)
    if (!canEdit) return { error: "Sem permissão." }

    await prisma.tarefaCompdin.update({
      where: { id },
      data: { titulo: titulo.trim(), descricao: descricao?.trim() || null },
    })
    revalidatePath("/anvs")
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao editar tarefa." }
  }
}

export async function deletarTarefa(id: string): Promise<{ error?: string }> {
  try {
    const session = await auth()
    if (!session) return { error: "Não autorizado." }

    const tarefa = await prisma.tarefaCompdin.findUnique({ where: { id }, select: { autorId: true } })
    if (!tarefa) return { error: "Tarefa não encontrada." }

    const canDelete = tarefa.autorId === session.user.id || PRIVILEGED.includes(session.user.role)
    if (!canDelete) return { error: "Sem permissão." }

    await prisma.tarefaCompdin.delete({ where: { id } })
    revalidatePath("/anvs")
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao excluir tarefa." }
  }
}

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
    revalidatePath("/compdin")
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao criar tarefa." }
  }
}

export async function atualizarStatusTarefa(
  id: string,
  novoStatus: StatusTarefa,
  dataOverride?: string,
  extraMecanicoIds?: string[],
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

    const dataEfetiva = dataOverride ? new Date(dataOverride) : new Date()
    const userId = session.user.id

    await prisma.tarefaCompdin.update({
      where: { id },
      data: {
        status: novoStatus,
        responsavelId: novoStatus !== "PENDENTE" ? userId : null,
        iniciadoEm: novoStatus === "INICIADA" ? dataEfetiva : novoStatus === "PENDENTE" ? null : undefined,
        concluidoEm: novoStatus === "CONCLUIDA" ? dataEfetiva : novoStatus === "PENDENTE" || novoStatus === "INICIADA" ? null : undefined,
      },
    })

    if (novoStatus !== "PENDENTE") {
      const todosIds = [userId, ...(extraMecanicoIds ?? []).filter((mid) => mid !== userId)]
      await prisma.tarefaCompdinMecanico.deleteMany({ where: { tarefaId: id } })
      await prisma.tarefaCompdinMecanico.createMany({
        data: todosIds.map((mecId) => ({ tarefaId: id, mecanicoId: mecId })),
      })
    } else {
      await prisma.tarefaCompdinMecanico.deleteMany({ where: { tarefaId: id } })
    }

    revalidatePath("/anvs")
    revalidatePath("/compdin")
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao atualizar tarefa." }
  }
}

export async function editarDatasTarefa(
  id: string,
  iniciadoEm: string | null,
  concluidoEm: string | null,
): Promise<{ error?: string }> {
  try {
    const session = await auth()
    if (!session) return { error: "Não autorizado." }

    const tarefa = await prisma.tarefaCompdin.findUnique({
      where: { id },
      select: { autorId: true, responsavelId: true },
    })
    if (!tarefa) return { error: "Tarefa não encontrada." }

    const isPrivileged = PRIVILEGED.includes(session.user.role)
    const isOwn = tarefa.responsavelId === session.user.id || tarefa.autorId === session.user.id

    if (!isPrivileged && !isOwn) return { error: "Sem permissão para editar estas datas." }

    await prisma.tarefaCompdin.update({
      where: { id },
      data: {
        iniciadoEm: iniciadoEm !== null ? new Date(iniciadoEm) : null,
        concluidoEm: concluidoEm !== null ? new Date(concluidoEm) : null,
      },
    })
    revalidatePath("/anvs")
    revalidatePath("/compdin")
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao editar datas." }
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
    revalidatePath("/compdin")
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
    revalidatePath("/compdin")
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao excluir tarefa." }
  }
}

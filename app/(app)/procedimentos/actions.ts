"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

async function getSession() {
  const session = await auth()
  if (!session) throw new Error("Não autorizado.")
  return session
}

function podeDeletar(autorId: string, userId: string, role: string) {
  return autorId === userId || role === "ADMIN" || role === "ENCARREGADO"
}

export async function criarProcedimento(titulo: string, descricao: string): Promise<{ id?: string; error?: string }> {
  try {
    const session = await getSession()
    if (!titulo.trim()) return { error: "Título obrigatório." }
    const p = await prisma.procedimentoPadrao.create({
      data: { titulo: titulo.trim(), descricao: descricao.trim() || null, autorId: session.user.id },
    })
    revalidatePath("/procedimentos")
    return { id: p.id }
  } catch (err) {
    if (err instanceof Error && err.message === "Não autorizado.") throw err
    return { error: err instanceof Error ? err.message : "Erro ao criar." }
  }
}

export async function editarProcedimento(id: string, titulo: string, descricao: string): Promise<{ error?: string }> {
  try {
    const session = await getSession()
    const proc = await prisma.procedimentoPadrao.findUnique({ where: { id } })
    if (!proc) return { error: "Não encontrado." }
    if (!podeDeletar(proc.autorId, session.user.id, session.user.role)) return { error: "Sem permissão." }
    if (!titulo.trim()) return { error: "Título obrigatório." }
    await prisma.procedimentoPadrao.update({ where: { id }, data: { titulo: titulo.trim(), descricao: descricao.trim() || null } })
    revalidatePath("/procedimentos")
    return {}
  } catch (err) {
    if (err instanceof Error && err.message === "Não autorizado.") throw err
    return { error: err instanceof Error ? err.message : "Erro ao editar." }
  }
}

export async function deletarProcedimento(id: string): Promise<{ error?: string }> {
  try {
    const session = await getSession()
    const proc = await prisma.procedimentoPadrao.findUnique({ where: { id } })
    if (!proc) return { error: "Não encontrado." }
    if (!podeDeletar(proc.autorId, session.user.id, session.user.role)) return { error: "Sem permissão." }
    await prisma.procedimentoPadrao.delete({ where: { id } })
    revalidatePath("/procedimentos")
    return {}
  } catch (err) {
    if (err instanceof Error && err.message === "Não autorizado.") throw err
    return { error: err instanceof Error ? err.message : "Erro ao deletar." }
  }
}

export async function adicionarImagem(procedimentoId: string, url: string, legenda: string): Promise<{ error?: string }> {
  try {
    const session = await getSession()
    const proc = await prisma.procedimentoPadrao.findUnique({ where: { id: procedimentoId } })
    if (!proc) return { error: "Procedimento não encontrado." }
    if (!podeDeletar(proc.autorId, session.user.id, session.user.role)) return { error: "Sem permissão." }
    if (!url.trim()) return { error: "URL obrigatória." }
    const count = await prisma.procedimentoImagem.count({ where: { procedimentoId } })
    await prisma.procedimentoImagem.create({ data: { procedimentoId, url: url.trim(), legenda: legenda.trim() || null, ordem: count } })
    revalidatePath("/procedimentos")
    return {}
  } catch (err) {
    if (err instanceof Error && err.message === "Não autorizado.") throw err
    return { error: err instanceof Error ? err.message : "Erro ao adicionar imagem." }
  }
}

export async function removerImagem(imagemId: string): Promise<{ error?: string }> {
  try {
    const session = await getSession()
    const img = await prisma.procedimentoImagem.findUnique({ where: { id: imagemId }, include: { procedimento: true } })
    if (!img) return { error: "Imagem não encontrada." }
    if (!podeDeletar(img.procedimento.autorId, session.user.id, session.user.role)) return { error: "Sem permissão." }
    await prisma.procedimentoImagem.delete({ where: { id: imagemId } })
    revalidatePath("/procedimentos")
    return {}
  } catch (err) {
    if (err instanceof Error && err.message === "Não autorizado.") throw err
    return { error: err instanceof Error ? err.message : "Erro ao remover imagem." }
  }
}

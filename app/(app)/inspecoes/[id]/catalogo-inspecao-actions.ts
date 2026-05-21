"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { TipoCartao } from "@prisma/client"

const PRIVILEGED = ["ADMIN", "ENCARREGADO", "INSPETOR"]

export async function adicionarCartaoCatalogo(
  inspecaoId: string,
  cartaoId: string,
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session || !PRIVILEGED.includes(session.user.role)) return { error: "Sem permissão." }

  const inspecao = await prisma.inspecao.findUnique({
    where: { id: inspecaoId },
    include: { anv: { select: { matricula: true } } },
  })
  if (!inspecao) return { error: "Inspeção não encontrada." }

  const cartao = await prisma.cartao.findUnique({
    where: { id: cartaoId },
    include: { subitens: true, subsistema: { include: { sistema: true } } },
  })
  if (!cartao) return { error: "Cartão não encontrado." }

  const existente = await prisma.execucaoCartao.findFirst({ where: { inspecaoId, cartaoId } })
  if (existente) return { error: "Este cartão já está na inspeção." }

  const execucao = await prisma.execucaoCartao.create({
    data: {
      inspecaoId,
      cartaoId,
      subitemStatuses: {
        create: cartao.subitens.map((s) => ({ subitemId: s.id })),
      },
    },
  })

  revalidatePath(`/inspecoes/${inspecaoId}`)
  return {}
}

export async function removerExecucaoCartao(
  execucaoId: string,
  inspecaoId: string,
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session || !PRIVILEGED.includes(session.user.role)) return { error: "Sem permissão." }

  await prisma.subitemStatus.deleteMany({ where: { execucaoId } })
  await prisma.avisoExecucao.deleteMany({ where: { execucaoId } })
  await prisma.defeitoExecucao.deleteMany({ where: { execucaoId } })
  await prisma.execucaoCartao.delete({ where: { id: execucaoId } })

  revalidatePath(`/inspecoes/${inspecaoId}`)
  return {}
}

export async function adicionarCartaoNaInspecao(args: {
  inspecaoId: string
  subsistemaId: string
  sistemaId: string
  codigo: string
  nomePt: string
  tipo: TipoCartao
  descricaoSubitem: string
  permanente: boolean
}): Promise<{ error?: string; cartaoId?: string }> {
  const session = await auth()
  if (!session || !PRIVILEGED.includes(session.user.role)) return { error: "Sem permissão." }

  const { inspecaoId, subsistemaId, sistemaId, codigo, nomePt, tipo, descricaoSubitem, permanente } = args
  if (!codigo.trim() || !nomePt.trim() || !descricaoSubitem.trim()) {
    return { error: "Código, nome e descrição são obrigatórios." }
  }

  const inspecao = await prisma.inspecao.findUnique({ where: { id: inspecaoId }, select: { tipo: true } })
  if (!inspecao) return { error: "Inspeção não encontrada." }

  const cartao = await prisma.cartao.create({
    data: {
      subsistemaId,
      codigo: codigo.trim().toUpperCase(),
      nomeEn: nomePt.trim(),
      nomePt: nomePt.trim(),
      tipo,
      extra: !permanente,
      ordem: 9999,
      subitens: { create: { letra: "A", descricaoPt: descricaoSubitem.trim(), ordem: 0 } },
      ...(permanente ? { inspecaoTipos: { create: { inspecaoTipo: inspecao.tipo } } } : {}),
    },
    include: { subitens: true },
  })

  const execucao = await prisma.execucaoCartao.create({
    data: {
      inspecaoId,
      cartaoId: cartao.id,
      subitemStatuses: { create: { subitemId: cartao.subitens[0].id } },
    },
  })

  revalidatePath(`/inspecoes/${inspecaoId}`)
  revalidatePath(`/inspecoes/${inspecaoId}/sistemas/${sistemaId}/subsistemas/${subsistemaId}`)
  return { cartaoId: execucao.cartaoId }
}

export async function getSistemasCatalogo() {
  return prisma.sistema.findMany({
    orderBy: { ordem: "asc" },
    include: {
      subsistemas: {
        orderBy: { ordem: "asc" },
        include: {
          cartoes: {
            orderBy: { ordem: "asc" },
            select: { id: true, codigo: true, nomePt: true, nomeEn: true, tipo: true, duracaoMin: true },
          },
        },
      },
    },
  })
}

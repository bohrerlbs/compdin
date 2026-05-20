"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { TipoCartao } from "@prisma/client"
import { revalidatePath } from "next/cache"

const PRIVILEGED = ["ADMIN", "ENCARREGADO", "INSPETOR"]

interface AdicionarCartaoArgs {
  inspecaoId: string
  subsistemaId: string
  sistemaId: string
  codigo: string
  nomePt: string
  tipo: TipoCartao
  descricaoSubitem: string
  permanente: boolean
}

export async function adicionarCartaoNaInspecao(
  args: AdicionarCartaoArgs,
): Promise<{ error?: string; cartaoId?: string }> {
  try {
    const session = await auth()
    if (!session) return { error: "Não autorizado." }
    if (!PRIVILEGED.includes(session.user.role)) return { error: "Sem permissão." }

    const { inspecaoId, subsistemaId, sistemaId, codigo, nomePt, tipo, descricaoSubitem, permanente } = args

    if (!codigo.trim() || !nomePt.trim() || !descricaoSubitem.trim()) {
      return { error: "Código, nome e descrição são obrigatórios." }
    }

    const inspecao = await prisma.inspecao.findUnique({
      where: { id: inspecaoId },
      select: { tipo: true },
    })
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
        subitens: {
          create: {
            letra: "A",
            descricaoPt: descricaoSubitem.trim(),
            ordem: 0,
          },
        },
        ...(permanente
          ? {
              inspecaoTipos: {
                create: { inspecaoTipo: inspecao.tipo },
              },
            }
          : {}),
      },
      include: { subitens: true },
    })

    const subitem = cartao.subitens[0]

    const execucao = await prisma.execucaoCartao.create({
      data: {
        inspecaoId,
        cartaoId: cartao.id,
        subitemStatuses: {
          create: { subitemId: subitem.id },
        },
      },
    })

    revalidatePath(`/inspecoes/${inspecaoId}/sistemas/${sistemaId}/subsistemas/${subsistemaId}`)
    return { cartaoId: execucao.cartaoId }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao adicionar cartão." }
  }
}

export async function excluirCartaoExtra(
  cartaoId: string,
  inspecaoId: string,
  sistemaId: string,
  subsistemaId: string,
): Promise<{ error?: string }> {
  try {
    const session = await auth()
    if (!session) return { error: "Não autorizado." }
    if (!PRIVILEGED.includes(session.user.role)) return { error: "Sem permissão." }

    const cartao = await prisma.cartao.findUnique({
      where: { id: cartaoId },
      select: { extra: true },
    })
    if (!cartao) return { error: "Cartão não encontrado." }
    if (!cartao.extra) return { error: "Apenas cartões extras podem ser excluídos." }

    // Delete cascades via Prisma relations
    const exec = await prisma.execucaoCartao.findFirst({
      where: { cartaoId, inspecaoId },
      select: { id: true },
    })
    if (exec) {
      await prisma.subitemStatus.deleteMany({ where: { execucaoId: exec.id } })
      await prisma.execucaoCartao.delete({ where: { id: exec.id } })
    }
    await prisma.subitem.deleteMany({ where: { cartaoId } })
    await prisma.cartao.delete({ where: { id: cartaoId } })

    revalidatePath(`/inspecoes/${inspecaoId}/sistemas/${sistemaId}/subsistemas/${subsistemaId}`)
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao excluir cartão." }
  }
}

"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { StatusSubitem } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { sendPushToRole, sendPushToUser } from "@/lib/push"

export async function atualizarSubitem(
  statusId: string,
  novoStatus: StatusSubitem,
  dataOverride?: string,
  extraMecanicoIds?: string[],
) {
  const session = await auth()
  if (!session) throw new Error("Não autorizado.")

  const { id: userId, role } = session.user
  if (role !== "MECANICO" && role !== "ENCARREGADO" && role !== "ADMIN") {
    throw new Error("Sem permissão.")
  }

  const dataEfetiva = dataOverride ? new Date(dataOverride) : new Date()

  await prisma.subitemStatus.update({
    where: { id: statusId },
    data: {
      status: novoStatus,
      mecanicoId: userId,
      dataInicio: novoStatus === "INICIADA" ? dataEfetiva : undefined,
      dataConclusao: novoStatus === "CONCLUIDA" ? dataEfetiva : undefined,
    },
  })

  if (novoStatus !== "PENDENTE") {
    const todosIds = [userId, ...(extraMecanicoIds ?? []).filter((id) => id !== userId)]
    await prisma.subitemStatusMecanico.deleteMany({ where: { statusId } })
    await prisma.subitemStatusMecanico.createMany({
      data: todosIds.map((mecId) => ({ statusId, mecanicoId: mecId })),
    })
  } else {
    await prisma.subitemStatusMecanico.deleteMany({ where: { statusId } })
  }

  // Notifications only for INICIADA / CONCLUIDA
  if (novoStatus === "INICIADA" || novoStatus === "CONCLUIDA") {
    try {
      const ctx = await prisma.subitemStatus.findUnique({
        where: { id: statusId },
        select: {
          execucao: {
            select: {
              id: true,
              inspecaoId: true,
              cartaoId: true,
              cartao: {
                select: {
                  nomePt: true,
                  codigo: true,
                  subsistema: { select: { id: true, sistemaId: true } },
                },
              },
              inspecao: { select: { tipo: true, anv: { select: { matricula: true } } } },
              subitemStatuses: { select: { status: true } },
            },
          },
        },
      })

      if (ctx?.execucao) {
        const { execucao: exec } = ctx
        const anvMatricula = exec.inspecao.anv.matricula
        const cartaoLabel = `${exec.cartao.codigo} – ${exec.cartao.nomePt}`
        const actionLabel = novoStatus === "INICIADA" ? "iniciou" : "concluiu"
        const link = `/inspecoes/${exec.inspecaoId}/sistemas/${exec.cartao.subsistema.sistemaId}/subsistemas/${exec.cartao.subsistema.id}/cartoes/${exec.cartaoId}`

        const encarregados = await prisma.user.findMany({
          where: { role: "ENCARREGADO", ativo: true },
          select: { id: true },
        })

        const payload = {
          titulo: `${anvMatricula} – ${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)}`,
          corpo: cartaoLabel,
          link,
          tipo: "subitem_update",
        }

        await prisma.notificacao.createMany({
          data: encarregados.map((e) => ({
            userId: e.id,
            tipo: "subitem_update",
            titulo: payload.titulo,
            corpo: cartaoLabel,
            link,
          })),
        })

        void sendPushToRole("ENCARREGADO", payload, undefined)

        // If all subitens concluded → notify INSPETORs
        const allDone = exec.subitemStatuses.length > 0 &&
          exec.subitemStatuses.every((s) => s.status === "CONCLUIDA")

        if (allDone) {
          const inspPayload = {
            titulo: `Cartão pronto para inspeção`,
            corpo: `${anvMatricula} – ${cartaoLabel}`,
            link,
            tipo: "cartao_pronto",
          }
          const inspetores = await prisma.user.findMany({
            where: { role: "INSPETOR", ativo: true },
            select: { id: true },
          })
          await prisma.notificacao.createMany({
            data: inspetores.map((i) => ({
              userId: i.id,
              tipo: "cartao_pronto",
              titulo: inspPayload.titulo,
              corpo: inspPayload.corpo,
              link,
            })),
          })
          void sendPushToRole("INSPETOR", inspPayload)
        }
      }
    } catch {
      // Notifications are best-effort; don't fail the main action
    }
  }
}

export async function salvarObservacao(statusId: string, observacao: string) {
  const session = await auth()
  if (!session) throw new Error("Não autorizado.")

  const { id: userId, role } = session.user
  if (role !== "MECANICO" && role !== "ENCARREGADO" && role !== "ADMIN") {
    throw new Error("Sem permissão.")
  }

  const atual = await prisma.subitemStatus.findUnique({
    where: { id: statusId },
    select: { observacaoAutorId: true },
  })

  // Só o autor original pode editar (ou se ainda não tem autor)
  if (atual?.observacaoAutorId && atual.observacaoAutorId !== userId) {
    throw new Error("Apenas o autor pode editar esta observação.")
  }

  await prisma.subitemStatus.update({
    where: { id: statusId },
    data: {
      observacao: observacao.trim() || null,
      observacaoAutorId: observacao.trim() ? userId : null,
      observacaoEm: observacao.trim() ? new Date() : null,
    },
  })
}

export async function inspecionarCartao(execucaoId: string) {
  const session = await auth()
  if (!session) throw new Error("Não autorizado.")

  const { id: userId, role } = session.user
  if (role !== "INSPETOR" && role !== "ADMIN") {
    throw new Error("Sem permissão. Apenas Inspetor ou Admin.")
  }

  const statuses = await prisma.subitemStatus.findMany({
    where: { execucaoId },
    select: { status: true },
  })

  const todosOk = statuses.length > 0 && statuses.every((s) => s.status === "CONCLUIDA")
  if (!todosOk) throw new Error("Todos os subitens devem estar concluídos antes de inspecionar.")

  await prisma.execucaoCartao.update({
    where: { id: execucaoId },
    data: {
      inspecionadoEm: new Date(),
      inspecionadorId: userId,
    },
  })
}

export async function enviarAviso(execucaoId: string, texto: string) {
  const session = await auth()
  if (!session) throw new Error("Não autorizado.")

  const { id: userId } = session.user

  await prisma.avisoExecucao.create({
    data: { execucaoId, autorId: userId, texto: texto.trim() },
  })
}

export async function desassinarCartao(execucaoId: string, mensagem: string): Promise<{ error?: string }> {
  try {
    const session = await auth()
    if (!session) return { error: "Não autorizado." }
    const { id: userId, role } = session.user
    if (role !== "INSPETOR" && role !== "ADMIN") return { error: "Sem permissão." }

    const execCtx = await prisma.execucaoCartao.findUnique({
      where: { id: execucaoId },
      select: {
        inspecaoId: true,
        cartaoId: true,
        cartao: {
          select: {
            nomePt: true,
            codigo: true,
            subsistema: { select: { id: true, sistemaId: true } },
          },
        },
        inspecao: { select: { anv: { select: { matricula: true } } } },
        subitemStatuses: { select: { mecanicoId: true } },
      },
    })

    await prisma.execucaoCartao.update({
      where: { id: execucaoId },
      data: { inspecionadoEm: null, inspecionadorId: null },
    })

    if (mensagem.trim()) {
      await prisma.avisoExecucao.create({
        data: { execucaoId, autorId: userId, texto: mensagem.trim() },
      })
    }

    // Notify mechanics who worked on the card
    if (execCtx) {
      try {
        const mecIds = [...new Set(execCtx.subitemStatuses.map((s) => s.mecanicoId).filter(Boolean) as string[])]
        const link = `/inspecoes/${execCtx.inspecaoId}/sistemas/${execCtx.cartao.subsistema.sistemaId}/subsistemas/${execCtx.cartao.subsistema.id}/cartoes/${execCtx.cartaoId}`
        const titulo = `Cartão reaberto para correção`
        const corpo = `${execCtx.inspecao.anv.matricula} – ${execCtx.cartao.codigo} – ${execCtx.cartao.nomePt}`

        await prisma.notificacao.createMany({
          data: mecIds.map((mecId) => ({
            userId: mecId,
            tipo: "cartao_reaberto",
            titulo,
            corpo,
            link,
          })),
        })

        await Promise.allSettled(mecIds.map((mId) => sendPushToUser(mId, { titulo, corpo, link, tipo: "cartao_reaberto" })))
      } catch {
        // best-effort
      }
    }

    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao desassinar." }
  }
}

export async function atualizarWp(cartaoId: string, wp: string): Promise<{ error?: string }> {
  try {
    const session = await auth()
    if (!session) return { error: "Não autorizado." }
    if (session.user.role !== "ADMIN") return { error: "Apenas Admin." }

    await prisma.cartao.update({
      where: { id: cartaoId },
      data: { wp: wp.trim() || null },
    })
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao atualizar WP." }
  }
}

export async function criarFerramenta(cartaoId: string, nome: string, especificacao: string): Promise<{ error?: string }> {
  try {
    const session = await auth()
    if (!session) return { error: "Não autorizado." }
    if (session.user.role !== "ADMIN") return { error: "Apenas Admin." }
    if (!nome.trim()) return { error: "Nome obrigatório." }

    const count = await prisma.ferramenta.count({ where: { cartaoId } })
    await prisma.ferramenta.create({
      data: { cartaoId, nome: nome.trim(), especificacao: especificacao.trim() || null, ordem: count },
    })
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao criar ferramenta." }
  }
}

export async function atualizarFerramenta(ferramentaId: string, nome: string, especificacao: string): Promise<{ error?: string }> {
  try {
    const session = await auth()
    if (!session) return { error: "Não autorizado." }
    if (session.user.role !== "ADMIN") return { error: "Apenas Admin." }
    if (!nome.trim()) return { error: "Nome obrigatório." }

    await prisma.ferramenta.update({
      where: { id: ferramentaId },
      data: { nome: nome.trim(), especificacao: especificacao.trim() || null },
    })
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao atualizar ferramenta." }
  }
}

export async function deletarFerramenta(ferramentaId: string): Promise<{ error?: string }> {
  try {
    const session = await auth()
    if (!session) return { error: "Não autorizado." }
    if (session.user.role !== "ADMIN") return { error: "Apenas Admin." }

    await prisma.ferramenta.delete({ where: { id: ferramentaId } })
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao excluir ferramenta." }
  }
}

export async function editarAviso(avisoId: string, novoTexto: string) {
  const session = await auth()
  if (!session) throw new Error("Não autorizado.")

  const aviso = await prisma.avisoExecucao.findUnique({ where: { id: avisoId }, select: { autorId: true } })
  if (!aviso) throw new Error("Aviso não encontrado.")
  if (aviso.autorId !== session.user.id) throw new Error("Apenas o autor pode editar este aviso.")

  await prisma.avisoExecucao.update({
    where: { id: avisoId },
    data: { texto: novoTexto.trim(), editadoEm: new Date() },
  })
}

export async function deletarAviso(avisoId: string) {
  const session = await auth()
  if (!session) throw new Error("Não autorizado.")

  const aviso = await prisma.avisoExecucao.findUnique({ where: { id: avisoId }, select: { autorId: true } })
  if (!aviso) throw new Error("Aviso não encontrado.")
  if (aviso.autorId !== session.user.id) throw new Error("Apenas o autor pode excluir este aviso.")

  await prisma.avisoLeitura.deleteMany({ where: { avisoId } })
  await prisma.avisoExecucao.delete({ where: { id: avisoId } })
}

export async function editarDefeito(defeitoId: string, novaDescricao: string) {
  const session = await auth()
  if (!session) throw new Error("Não autorizado.")

  const defeito = await prisma.defeitoExecucao.findUnique({ where: { id: defeitoId }, select: { inspetorId: true } })
  if (!defeito) throw new Error("Defeito não encontrado.")
  if (defeito.inspetorId !== session.user.id) throw new Error("Apenas o inspetor que registrou pode editar este defeito.")

  await prisma.defeitoExecucao.update({
    where: { id: defeitoId },
    data: { descricao: novaDescricao.trim(), editadoEm: new Date() },
  })
}

export async function deletarDefeito(defeitoId: string) {
  const session = await auth()
  if (!session) throw new Error("Não autorizado.")

  const defeito = await prisma.defeitoExecucao.findUnique({ where: { id: defeitoId }, select: { inspetorId: true } })
  if (!defeito) throw new Error("Defeito não encontrado.")
  if (defeito.inspetorId !== session.user.id) throw new Error("Apenas o inspetor que registrou pode excluir este defeito.")

  await prisma.defeitoExecucao.delete({ where: { id: defeitoId } })
}

export async function marcarAvisosLidos(execucaoId: string) {
  const session = await auth()
  if (!session) return

  const { id: userId } = session.user

  const avisos = await prisma.avisoExecucao.findMany({
    where: { execucaoId },
    select: { id: true },
  })

  for (const aviso of avisos) {
    await prisma.avisoLeitura.upsert({
      where: { avisoId_userId: { avisoId: aviso.id, userId } },
      update: {},
      create: { avisoId: aviso.id, userId },
    })
  }
}

export async function atualizarSubitemTexto(subitemId: string, descricaoEn: string, descricaoPt: string): Promise<{ error?: string }> {
  try {
    const session = await auth()
    if (!session) return { error: "Não autorizado." }
    if (session.user.role !== "ADMIN") return { error: "Apenas Admin." }
    if (!descricaoPt.trim()) return { error: "Descrição PT obrigatória." }

    await prisma.subitem.update({
      where: { id: subitemId },
      data: {
        descricaoEn: descricaoEn.trim() || null,
        descricaoPt: descricaoPt.trim(),
      },
    })
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao atualizar texto." }
  }
}

export async function registrarDefeito(execucaoId: string, descricao: string) {
  const session = await auth()
  if (!session) throw new Error("Não autorizado.")

  const { id: userId, role } = session.user
  if (role !== "INSPETOR" && role !== "ADMIN") {
    throw new Error("Sem permissão. Apenas Inspetor ou Admin.")
  }

  const execCtx = await prisma.execucaoCartao.findUnique({
    where: { id: execucaoId },
    select: {
      inspecaoId: true,
      cartaoId: true,
      cartao: {
        select: {
          nomePt: true,
          codigo: true,
          subsistema: { select: { id: true, sistemaId: true } },
        },
      },
      inspecao: { select: { anv: { select: { matricula: true } } } },
      subitemStatuses: { select: { mecanicoId: true } },
    },
  })

  // Cria o defeito
  await prisma.defeitoExecucao.create({
    data: { execucaoId, inspetorId: userId, descricao: descricao.trim() },
  })

  // Reabre o cartão: remove assinatura e volta todos os subitens a PENDENTE
  await prisma.execucaoCartao.update({
    where: { id: execucaoId },
    data: { inspecionadoEm: null, inspecionadorId: null },
  })

  await prisma.subitemStatus.updateMany({
    where: { execucaoId },
    data: { status: "PENDENTE", mecanicoId: null, dataInicio: null, dataConclusao: null },
  })

  // Notify mechanics who worked on the card
  if (execCtx) {
    try {
      const mecIds = [...new Set(execCtx.subitemStatuses.map((s) => s.mecanicoId).filter(Boolean) as string[])]
      const link = `/inspecoes/${execCtx.inspecaoId}/sistemas/${execCtx.cartao.subsistema.sistemaId}/subsistemas/${execCtx.cartao.subsistema.id}/cartoes/${execCtx.cartaoId}`
      const titulo = `Defeito registrado — retrabalho necessário`
      const corpo = `${execCtx.inspecao.anv.matricula} – ${execCtx.cartao.codigo} – ${execCtx.cartao.nomePt}`

      await prisma.notificacao.createMany({
        data: mecIds.map((mecId) => ({
          userId: mecId,
          tipo: "defeito_registrado",
          titulo,
          corpo,
          link,
        })),
      })

      await Promise.allSettled(mecIds.map((mId) => sendPushToUser(mId, { titulo, corpo, link, tipo: "defeito_registrado" })))
    } catch {
      // best-effort
    }
  }
}

export async function editarDatasSubitem(
  statusId: string,
  dataInicio: string | null,
  dataConclusao: string | null,
  mecanicoIds?: string[],
): Promise<{ error?: string }> {
  try {
    const session = await auth()
    if (!session) return { error: "Não autorizado." }

    const { id: userId, role } = session.user

    const st = await prisma.subitemStatus.findUnique({
      where: { id: statusId },
      select: {
        mecanicoId: true,
        execucao: {
          select: {
            inspecaoId: true,
            cartaoId: true,
            cartao: { select: { subsistema: { select: { id: true, sistemaId: true } } } },
          },
        },
      },
    })
    if (!st) return { error: "Registro não encontrado." }

    const isPrivileged = role === "ADMIN" || role === "ENCARREGADO" || role === "INSPETOR"
    const isOwn = st.mecanicoId === userId

    if (!isPrivileged && !isOwn) return { error: "Sem permissão para editar estas datas." }

    await prisma.subitemStatus.update({
      where: { id: statusId },
      data: {
        dataInicio: dataInicio !== null ? new Date(dataInicio) : null,
        dataConclusao: dataConclusao !== null ? new Date(dataConclusao) : null,
      },
    })

    if (mecanicoIds !== undefined && mecanicoIds.length > 0) {
      await prisma.subitemStatusMecanico.deleteMany({ where: { statusId } })
      await prisma.subitemStatusMecanico.createMany({
        data: mecanicoIds.map((mecId) => ({ statusId, mecanicoId: mecId })),
      })
    }

    const exec = st.execucao
    if (exec) {
      const path = `/inspecoes/${exec.inspecaoId}/sistemas/${exec.cartao.subsistema.sistemaId}/subsistemas/${exec.cartao.subsistema.id}/cartoes/${exec.cartaoId}`
      revalidatePath(path)
    }

    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao editar datas." }
  }
}

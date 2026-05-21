"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { TipoCartao, InspecaoTipo } from "@prisma/client"
import { revalidatePath } from "next/cache"

const PRIVILEGED = ["ADMIN", "ENCARREGADO", "INSPETOR"]
const ADMIN_ONLY = ["ADMIN"]

async function checkPriv() {
  const session = await auth()
  if (!session || !PRIVILEGED.includes(session.user.role)) throw new Error("Sem permissão.")
  return session.user.role
}

async function checkAdmin() {
  const session = await auth()
  if (!session || !ADMIN_ONLY.includes(session.user.role)) throw new Error("Apenas ADMIN pode realizar esta ação.")
  return session.user
}

// ─── Sistemas ──────────────────────────────────────────────────────────────

export async function criarSistema(formData: FormData) {
  await checkPriv()
  const codigo = (formData.get("codigo") as string).trim().toUpperCase()
  const nomePt = (formData.get("nomePt") as string).trim()
  const nomeEn = (formData.get("nomeEn") as string).trim()
  if (!codigo || !nomePt || !nomeEn) return { error: "Todos os campos são obrigatórios." }

  const max = await prisma.sistema.aggregate({ _max: { ordem: true } })
  await prisma.sistema.create({ data: { codigo, nomePt, nomeEn, ordem: (max._max.ordem ?? 0) + 1 } })
  revalidatePath("/admin/catalogo")
  return {}
}

export async function editarSistema(id: string, formData: FormData) {
  await checkPriv()
  const codigo = (formData.get("codigo") as string).trim().toUpperCase()
  const nomePt = (formData.get("nomePt") as string).trim()
  const nomeEn = (formData.get("nomeEn") as string).trim()
  if (!codigo || !nomePt || !nomeEn) return { error: "Todos os campos são obrigatórios." }
  await prisma.sistema.update({ where: { id }, data: { codigo, nomePt, nomeEn } })
  revalidatePath("/admin/catalogo")
  return {}
}

export async function deletarSistema(id: string) {
  await checkAdmin()
  const count = await prisma.subsistema.count({ where: { sistemaId: id } })
  if (count > 0) return { error: "Remova todos os subsistemas antes de deletar o sistema." }
  await prisma.sistema.delete({ where: { id } })
  revalidatePath("/admin/catalogo")
  return {}
}

// ─── Subsistemas ───────────────────────────────────────────────────────────

export async function criarSubsistema(sistemaId: string, formData: FormData) {
  await checkPriv()
  const nomePt = (formData.get("nomePt") as string).trim()
  const nomeEn = (formData.get("nomeEn") as string).trim()
  if (!nomePt || !nomeEn) return { error: "Nome PT e EN são obrigatórios." }
  const max = await prisma.subsistema.aggregate({ _max: { ordem: true }, where: { sistemaId } })
  await prisma.subsistema.create({ data: { sistemaId, nomePt, nomeEn, ordem: (max._max.ordem ?? 0) + 1 } })
  revalidatePath("/admin/catalogo")
  return {}
}

export async function editarSubsistema(id: string, formData: FormData) {
  await checkPriv()
  const nomePt = (formData.get("nomePt") as string).trim()
  const nomeEn = (formData.get("nomeEn") as string).trim()
  if (!nomePt || !nomeEn) return { error: "Nome PT e EN são obrigatórios." }
  await prisma.subsistema.update({ where: { id }, data: { nomePt, nomeEn } })
  revalidatePath("/admin/catalogo")
  return {}
}

export async function deletarSubsistema(id: string) {
  await checkAdmin()
  const count = await prisma.cartao.count({ where: { subsistemaId: id } })
  if (count > 0) return { error: "Remova todos os cartões antes de deletar o subsistema." }
  await prisma.subsistema.delete({ where: { id } })
  revalidatePath("/admin/catalogo")
  return {}
}

export async function moverSubsistema(id: string, novoSistemaId: string) {
  await checkPriv()
  const max = await prisma.subsistema.aggregate({ _max: { ordem: true }, where: { sistemaId: novoSistemaId } })
  await prisma.subsistema.update({
    where: { id },
    data: { sistemaId: novoSistemaId, ordem: (max._max.ordem ?? 0) + 1 },
  })
  revalidatePath("/admin/catalogo")
  return {}
}

// ─── Cartões ───────────────────────────────────────────────────────────────

export async function criarCartao(subsistemaId: string, formData: FormData) {
  await checkPriv()
  const codigo = (formData.get("codigo") as string).trim().toUpperCase()
  const nomePt = (formData.get("nomePt") as string).trim()
  const nomeEn = (formData.get("nomeEn") as string).trim() || nomePt
  const tipo = formData.get("tipo") as TipoCartao
  const publicacao = (formData.get("publicacao") as string | null)?.trim() || null
  const wp = (formData.get("wp") as string | null)?.trim() || null
  const duracaoMin = parseInt(formData.get("duracaoMin") as string) || null
  const qtdRecursos = parseInt(formData.get("qtdRecursos") as string) || 1
  const observacao = (formData.get("observacao") as string | null)?.trim() || null
  const descricaoSubitem = (formData.get("descricaoSubitem") as string).trim()

  if (!codigo || !nomePt || !tipo || !descricaoSubitem) return { error: "Código, nome, tipo e descrição do subitem são obrigatórios." }

  const max = await prisma.cartao.aggregate({ _max: { ordem: true }, where: { subsistemaId } })
  await prisma.cartao.create({
    data: {
      subsistemaId,
      codigo,
      nomePt,
      nomeEn,
      tipo,
      publicacao,
      wp,
      duracaoMin,
      qtdRecursos,
      observacao,
      ordem: (max._max.ordem ?? 0) + 10,
      subitens: {
        create: { letra: "A", descricaoPt: descricaoSubitem, ordem: 0 },
      },
    },
  })
  revalidatePath("/admin/catalogo")
  return {}
}

export async function editarCartao(id: string, formData: FormData) {
  await checkPriv()
  const codigo = (formData.get("codigo") as string).trim().toUpperCase()
  const nomePt = (formData.get("nomePt") as string).trim()
  const nomeEn = (formData.get("nomeEn") as string).trim() || nomePt
  const tipo = formData.get("tipo") as TipoCartao
  const publicacao = (formData.get("publicacao") as string | null)?.trim() || null
  const wp = (formData.get("wp") as string | null)?.trim() || null
  const duracaoMin = parseInt(formData.get("duracaoMin") as string) || null
  const qtdRecursos = parseInt(formData.get("qtdRecursos") as string) || 1
  const observacao = (formData.get("observacao") as string | null)?.trim() || null

  if (!codigo || !nomePt || !tipo) return { error: "Código, nome e tipo são obrigatórios." }

  await prisma.cartao.update({
    where: { id },
    data: { codigo, nomePt, nomeEn, tipo, publicacao, wp, duracaoMin, qtdRecursos, observacao },
  })
  revalidatePath("/admin/catalogo")
  return {}
}

export async function deletarCartao(id: string) {
  await checkAdmin()
  const execCount = await prisma.execucaoCartao.count({ where: { cartaoId: id } })
  if (execCount > 0) return { error: "Cartão está em uso em inspeções ativas. Não é possível deletar." }
  await prisma.subitem.deleteMany({ where: { cartaoId: id } })
  await prisma.cartaoInspecaoTipo.deleteMany({ where: { cartaoId: id } })
  await prisma.ferramenta.deleteMany({ where: { cartaoId: id } })
  await prisma.cartao.delete({ where: { id } })
  revalidatePath("/admin/catalogo")
  return {}
}

export async function moverCartao(id: string, novoSubsistemaId: string) {
  await checkPriv()
  const max = await prisma.cartao.aggregate({ _max: { ordem: true }, where: { subsistemaId: novoSubsistemaId } })
  await prisma.cartao.update({
    where: { id },
    data: { subsistemaId: novoSubsistemaId, ordem: (max._max.ordem ?? 0) + 10 },
  })
  revalidatePath("/admin/catalogo")
  return {}
}

// ─── Subitens ──────────────────────────────────────────────────────────────

export async function criarSubitem(cartaoId: string, formData: FormData) {
  await checkPriv()
  const letra = (formData.get("letra") as string).trim().toUpperCase()
  const descricaoPt = (formData.get("descricaoPt") as string).trim()
  const descricaoEn = (formData.get("descricaoEn") as string | null)?.trim() || null
  const referencia = (formData.get("referencia") as string | null)?.trim() || null
  if (!letra || !descricaoPt) return { error: "Letra e descrição são obrigatórias." }
  const max = await prisma.subitem.aggregate({ _max: { ordem: true }, where: { cartaoId } })
  await prisma.subitem.create({
    data: { cartaoId, letra, descricaoPt, descricaoEn, referencia, ordem: (max._max.ordem ?? 0) + 1 },
  })
  revalidatePath("/admin/catalogo")
  return {}
}

export async function editarSubitem(id: string, formData: FormData) {
  await checkPriv()
  const letra = (formData.get("letra") as string).trim().toUpperCase()
  const descricaoPt = (formData.get("descricaoPt") as string).trim()
  const descricaoEn = (formData.get("descricaoEn") as string | null)?.trim() || null
  const referencia = (formData.get("referencia") as string | null)?.trim() || null
  if (!letra || !descricaoPt) return { error: "Letra e descrição são obrigatórias." }
  await prisma.subitem.update({ where: { id }, data: { letra, descricaoPt, descricaoEn, referencia } })
  revalidatePath("/admin/catalogo")
  return {}
}

export async function deletarSubitem(id: string) {
  await checkAdmin()
  const count = await prisma.subitemStatus.count({ where: { subitemId: id } })
  if (count > 0) return { error: "Subitem está em uso em execuções. Não é possível deletar." }
  await prisma.subitem.delete({ where: { id } })
  revalidatePath("/admin/catalogo")
  return {}
}

export async function vincularCartaoTipo(cartaoId: string, inspecaoTipo: InspecaoTipo) {
  await checkPriv()
  await prisma.cartaoInspecaoTipo.upsert({
    where: { cartaoId_inspecaoTipo: { cartaoId, inspecaoTipo } },
    create: { cartaoId, inspecaoTipo },
    update: {},
  })
  revalidatePath("/admin/catalogo")
  return {}
}

export async function desvincularCartaoTipo(cartaoId: string, inspecaoTipo: InspecaoTipo) {
  await checkPriv()
  await prisma.cartaoInspecaoTipo.deleteMany({ where: { cartaoId, inspecaoTipo } })
  revalidatePath("/admin/catalogo")
  return {}
}

export async function getCatalogo() {
  return prisma.sistema.findMany({
    orderBy: { ordem: "asc" },
    include: {
      subsistemas: {
        orderBy: { ordem: "asc" },
        include: {
          cartoes: {
            orderBy: { ordem: "asc" },
            include: {
              subitens: { orderBy: { ordem: "asc" } },
              inspecaoTipos: true,
            },
          },
        },
      },
    },
  })
}

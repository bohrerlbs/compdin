import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { InspecaoTipo, InspecaoStatus } from "@prisma/client"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 })

  const { role, id: userId } = session.user
  const { anvId, tipo } = await req.json()

  if (!anvId || !tipo) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
  }

  // INSP_ESPECIAL: inspetor, admin e encarregado podem abrir
  // Demais tipos: apenas inspetor e admin
  const isEspecial = tipo === "INSP_ESPECIAL"
  const canOpen = role === "INSPETOR" || role === "ADMIN" || (isEspecial && role === "ENCARREGADO")
  if (!canOpen) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 })
  }

  // Para INSP_ESPECIAL, permite múltiplas abertas (cada uma é única por ocasião)
  if (!isEspecial) {
    const existente = await prisma.inspecao.findFirst({
      where: { anvId, tipo: tipo as InspecaoTipo, status: InspecaoStatus.ABERTA },
    })
    if (existente) {
      return NextResponse.json({ error: "Já existe uma inspeção desse tipo aberta para esta ANV." }, { status: 409 })
    }
  }

  // Para INSP_ESPECIAL: cria sem cartões (o inspetor adiciona depois)
  if (isEspecial) {
    const inspecao = await prisma.inspecao.create({
      data: { anvId, tipo: "INSP_ESPECIAL", abertaPorId: userId },
    })
    return NextResponse.json({ id: inspecao.id }, { status: 201 })
  }

  // Para os demais tipos: pré-popula com os cartões do catálogo
  const cartoes = await prisma.cartaoInspecaoTipo.findMany({
    where: { inspecaoTipo: tipo as InspecaoTipo },
    select: { cartaoId: true },
  })

  const inspecao = await prisma.inspecao.create({
    data: {
      anvId,
      tipo: tipo as InspecaoTipo,
      abertaPorId: userId,
      execucoes: {
        create: cartoes.map((c) => ({ cartaoId: c.cartaoId })),
      },
    },
  })

  const execucoes = await prisma.execucaoCartao.findMany({
    where: { inspecaoId: inspecao.id },
    include: { cartao: { include: { subitens: true } } },
  })

  const subitemStatuses = execucoes.flatMap((exec) =>
    exec.cartao.subitens.map((subitem) => ({
      execucaoId: exec.id,
      subitemId: subitem.id,
    }))
  )

  if (subitemStatuses.length > 0) {
    await prisma.subitemStatus.createMany({ data: subitemStatuses })
  }

  return NextResponse.json({ id: inspecao.id }, { status: 201 })
}

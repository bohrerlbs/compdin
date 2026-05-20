import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { InspecaoTipo, InspecaoStatus } from "@prisma/client"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 })

  const { role, id: userId } = session.user
  if (role !== "INSPETOR" && role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 })
  }

  const { anvId, tipo } = await req.json()
  if (!anvId || !tipo) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
  }

  // Verifica se já existe inspeção aberta do mesmo tipo
  const existente = await prisma.inspecao.findFirst({
    where: { anvId, tipo: tipo as InspecaoTipo, status: InspecaoStatus.ABERTA },
  })
  if (existente) {
    return NextResponse.json({ error: "Já existe uma inspeção desse tipo aberta para esta ANV." }, { status: 409 })
  }

  // Busca os cartões do tipo de inspeção
  const cartoes = await prisma.cartaoInspecaoTipo.findMany({
    where: { inspecaoTipo: tipo as InspecaoTipo },
    select: { cartaoId: true },
  })

  // Cria a inspeção com execuções para cada cartão
  const inspecao = await prisma.inspecao.create({
    data: {
      anvId,
      tipo: tipo as InspecaoTipo,
      abertaPorId: userId,
      execucoes: {
        create: cartoes.map((c) => ({
          cartaoId: c.cartaoId,
          subitemStatuses: {
            create: [], // criados ao acessar o cartão pela primeira vez
          },
        })),
      },
    },
  })

  // Cria os SubitemStatus para todos os subitens dos cartões
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

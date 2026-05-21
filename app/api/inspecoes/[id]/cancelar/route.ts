import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

const PRIVILEGED = ["INSPETOR", "ADMIN", "ENCARREGADO"]

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 })

  const { role, id: userId } = session.user
  if (!PRIVILEGED.includes(role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 })
  }

  const inspecao = await prisma.inspecao.findUnique({ where: { id }, select: { status: true } })
  if (!inspecao) return NextResponse.json({ error: "Inspeção não encontrada." }, { status: 404 })
  if (inspecao.status !== "ABERTA") {
    return NextResponse.json({ error: "Apenas inspeções abertas podem ser canceladas." }, { status: 409 })
  }

  await prisma.inspecao.update({
    where: { id },
    data: { status: "CANCELADA", fechadaEm: new Date(), fechadaPorId: userId },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 })

  const { role } = session.user
  if (!PRIVILEGED.includes(role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 })
  }

  const inspecao = await prisma.inspecao.findUnique({
    where: { id },
    select: {
      status: true,
      execucoes: {
        select: {
          id: true,
          cartaoId: true,
          cartao: { select: { extra: true } },
          subitemStatuses: { select: { id: true } },
          avisos: { select: { id: true } },
        },
      },
    },
  })
  if (!inspecao) return NextResponse.json({ error: "Inspeção não encontrada." }, { status: 404 })
  if (inspecao.status !== "ABERTA" && inspecao.status !== "CANCELADA") {
    return NextResponse.json({ error: "Apenas inspeções abertas ou canceladas podem ser excluídas." }, { status: 409 })
  }

  const execIds = inspecao.execucoes.map((e) => e.id)
  const statusIds = inspecao.execucoes.flatMap((e) => e.subitemStatuses.map((s) => s.id))
  const avisoIds = inspecao.execucoes.flatMap((e) => e.avisos.map((a) => a.id))
  const extraCartaoIds = inspecao.execucoes
    .filter((e) => e.cartao.extra)
    .map((e) => e.cartaoId)

  await prisma.$transaction([
    prisma.subitemStatusMecanico.deleteMany({ where: { statusId: { in: statusIds } } }),
    prisma.subitemStatus.deleteMany({ where: { execucaoId: { in: execIds } } }),
    prisma.avisoLeitura.deleteMany({ where: { avisoId: { in: avisoIds } } }),
    prisma.avisoExecucao.deleteMany({ where: { execucaoId: { in: execIds } } }),
    prisma.defeitoExecucao.deleteMany({ where: { execucaoId: { in: execIds } } }),
    prisma.execucaoCartao.deleteMany({ where: { inspecaoId: id } }),
    prisma.subitem.deleteMany({ where: { cartaoId: { in: extraCartaoIds } } }),
    prisma.cartao.deleteMany({ where: { id: { in: extraCartaoIds } } }),
    prisma.inspecao.delete({ where: { id } }),
  ])

  return NextResponse.json({ ok: true })
}

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 })

  const { role, id: userId } = session.user
  if (role !== "INSPETOR" && role !== "ADMIN" && role !== "ENCARREGADO") {
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

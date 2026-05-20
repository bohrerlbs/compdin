import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 })

  const { role, id: userId } = session.user
  if (role !== "INSPETOR" && role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 })
  }

  await prisma.inspecao.update({
    where: { id },
    data: { status: "CONCLUIDA", fechadaEm: new Date(), fechadaPorId: userId },
  })

  return NextResponse.json({ ok: true })
}

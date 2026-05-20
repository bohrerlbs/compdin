import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const notifs = await prisma.notificacao.findMany({
    where: { userId: session.user.id },
    orderBy: { criadoEm: "desc" },
    take: 50,
  })

  return NextResponse.json(notifs)
}

export async function PATCH() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  await prisma.notificacao.updateMany({
    where: { userId: session.user.id, lido: false },
    data: { lido: true },
  })

  return NextResponse.json({ ok: true })
}

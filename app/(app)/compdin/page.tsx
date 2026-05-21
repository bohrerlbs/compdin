import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import CompdinPanel from "./CompdinPanel"

export const dynamic = "force-dynamic"

export default async function CompdinPage() {
  const session = await auth()
  const role = session!.user.role
  const userId = session!.user.id

  const [tarefas, todosMecanicos] = await Promise.all([
    prisma.tarefaCompdin.findMany({
      orderBy: [{ status: "asc" }, { criadoEm: "desc" }],
      include: {
        autor: { select: { trigrama: true } },
        responsavel: { select: { trigrama: true } },
        mecanicos: {
          include: { mecanico: { select: { id: true, trigrama: true, nome: true } } },
          orderBy: { mecanico: { trigrama: "asc" } },
        },
      },
    }),
    prisma.user.findMany({
      where: { ativo: true },
      select: { id: true, trigrama: true, nome: true },
      orderBy: { trigrama: "asc" },
    }),
  ])

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/anvs" className="hover:text-white">Início</Link>
        <span>/</span>
        <span className="text-white font-medium">COMPDIN</span>
      </div>

      <div className="mb-2">
        <h1 style={{ color: "var(--gold-bright)", fontWeight: 800, fontSize: "1.1rem", letterSpacing: "0.12em", margin: "0 0 2px" }}>
          COMPDIN
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", margin: 0 }}>
          Tarefas da seção · 5/8 GAV Pantera
        </p>
      </div>

      <CompdinPanel
        tarefas={tarefas as Parameters<typeof CompdinPanel>[0]["tarefas"]}
        userId={userId}
        userRole={role}
        todosMecanicos={todosMecanicos}
      />
    </div>
  )
}

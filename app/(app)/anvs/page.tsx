import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import { InspecaoStatus } from "@prisma/client"
import AvisosPanel from "../avisos-gerais/AvisosPanel"
import CompdinPanel from "../compdin/CompdinPanel"

export default async function HomePage() {
  const session = await auth()
  const role = session!.user.role
  const userId = session!.user.id

  const now = new Date()

  const [anvs, avisos, tarefas] = await Promise.all([
    prisma.anv.findMany({
      where: { ativo: true },
      orderBy: { matricula: "asc" },
      include: {
        inspecoes: {
          where: { status: InspecaoStatus.ABERTA },
          select: { id: true, tipo: true, abertaEm: true },
          orderBy: { abertaEm: "desc" },
        },
      },
    }),
    prisma.avisoGeral.findMany({
      where: {
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { criadoEm: "desc" },
      include: { autor: { select: { trigrama: true, nome: true } } },
    }),
    prisma.tarefaCompdin.findMany({
      orderBy: [{ status: "asc" }, { criadoEm: "desc" }],
      include: {
        autor: { select: { trigrama: true } },
        responsavel: { select: { trigrama: true } },
      },
    }),
  ])

  return (
    <div>
      {/* Avisos Gerais */}
      <AvisosPanel
        avisos={avisos as Parameters<typeof AvisosPanel>[0]["avisos"]}
        userId={userId}
        userRole={role}
      />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Aeronaves</h1>
        {role === "ADMIN" && (
          <Link
            href="/anvs/nova"
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            + Nova ANV
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {anvs.map((anv) => (
          <Link
            key={anv.id}
            href={`/anvs/${anv.matricula}`}
            className="block bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-lg">{anv.matricula}</span>
                  <span className="text-gray-500 text-sm">{anv.modelo}</span>
                </div>
                {anv.inspecoes.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {anv.inspecoes.map((insp) => (
                      <span
                        key={insp.id}
                        className="inline-flex items-center text-xs bg-yellow-900/50 text-yellow-400 border border-yellow-800 px-2 py-0.5 rounded-full"
                      >
                        {formatTipo(insp.tipo)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-xs mt-1">Sem inspeção aberta</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {anv.inspecoes.length > 0 && (
                  <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse" />
                )}
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}

        {anvs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>Nenhuma aeronave cadastrada.</p>
          </div>
        )}
      </div>

      {/* Divisor */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, var(--border), transparent)", margin: "1.5rem 0" }} />

      {/* Tarefas COMPDIN */}
      <CompdinPanel
        tarefas={tarefas as Parameters<typeof CompdinPanel>[0]["tarefas"]}
        userId={userId}
        userRole={role}
      />
    </div>
  )
}

function formatTipo(tipo: string) {
  return tipo
    .replace("INSP_", "INSP-")
    .replace("PMS_", "PMS-")
    .replace("PMI_", "PMI-")
    .replace(/_/g, "/")
}

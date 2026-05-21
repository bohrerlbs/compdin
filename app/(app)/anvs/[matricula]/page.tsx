import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { notFound } from "next/navigation"
import Link from "next/link"
import { InspecaoStatus } from "@prisma/client"
import AbrirInspecaoButton from "./AbrirInspecaoButton"
import { formatTipo } from "@/lib/inspecao"
import { fmtDate } from "@/lib/fmt"

interface Props {
  params: Promise<{ matricula: string }>
}

export default async function AnvPage({ params }: Props) {
  const { matricula } = await params
  const session = await auth()
  const role = session!.user.role

  const anv = await prisma.anv.findUnique({
    where: { matricula },
    include: {
      inspecoes: {
        orderBy: { abertaEm: "desc" },
        include: {
          abertaPor: { select: { nome: true } },
          execucoes: {
            include: {
              subitemStatuses: { select: { status: true } },
            },
          },
        },
      },
    },
  })

  if (!anv) notFound()

  const abertas = anv.inspecoes.filter((i) => i.status === InspecaoStatus.ABERTA)
  const historico = anv.inspecoes.filter((i) => i.status !== InspecaoStatus.ABERTA)

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/anvs" className="hover:text-white">Aeronaves</Link>
        <span>/</span>
        <span className="text-white font-medium">{anv.matricula}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{anv.matricula}</h1>
          <p className="text-gray-400 text-sm">{anv.modelo}</p>
        </div>
        {(role === "INSPETOR" || role === "ADMIN" || role === "ENCARREGADO") && (
          <AbrirInspecaoButton anvId={anv.id} role={role} />
        )}
      </div>

      {/* Inspeções abertas */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Inspeções Abertas
        </h2>
        {abertas.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-500 text-sm">
            Nenhuma inspeção aberta.
          </div>
        ) : (
          <div className="space-y-3">
            {abertas.map((insp) => {
              const total = insp.execucoes.reduce((s, e) => s + e.subitemStatuses.length, 0)
              const concluidos = insp.execucoes.reduce(
                (s, e) => s + e.subitemStatuses.filter((st) => st.status === "CONCLUIDA").length,
                0
              )
              const pct = total > 0 ? Math.round((concluidos / total) * 100) : 0

              return (
                <Link
                  key={insp.id}
                  href={`/inspecoes/${insp.id}`}
                  className="block bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-white font-semibold">{formatTipo(insp.tipo)}</span>
                      <span className="text-gray-500 text-xs ml-2">
                        Aberta em {fmtDate(insp.abertaEm)}
                      </span>
                    </div>
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  {total > 0 && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{concluidos}/{total} subitens concluídos</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Histórico */}
      {historico.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Histórico
          </h2>
          <div className="space-y-2">
            {historico.slice(0, 5).map((insp) => (
              <Link
                key={insp.id}
                href={`/inspecoes/${insp.id}`}
                className="bg-gray-900/50 border border-gray-800 hover:border-gray-700 rounded-xl p-3 flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="text-gray-300 text-sm font-medium">{formatTipo(insp.tipo)}</span>
                  <span className="text-gray-500 text-xs ml-2">
                    {fmtDate(insp.abertaEm)}
                  </span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  insp.status === "CONCLUIDA"
                    ? "bg-green-900/50 text-green-400 border border-green-800"
                    : "bg-red-900/50 text-red-400 border border-red-800"
                }`}>
                  {insp.status === "CONCLUIDA" ? "Concluída" : "Cancelada"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}


import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { formatTipo } from "@/lib/inspecao"

interface Props {
  params: Promise<{ id: string; sistemaId: string }>
}

export default async function SistemaPage({ params }: Props) {
  const { id: inspecaoId, sistemaId } = await params

  const inspecao = await prisma.inspecao.findUnique({
    where: { id: inspecaoId },
    include: { anv: true },
  })
  if (!inspecao) notFound()

  const sistema = await prisma.sistema.findUnique({
    where: { id: sistemaId },
    include: {
      subsistemas: {
        orderBy: { ordem: "asc" },
        include: {
          cartoes: {
            include: {
              execucoes: {
                where: { inspecaoId },
                include: { subitemStatuses: { select: { status: true } } },
              },
            },
          },
        },
      },
    },
  })
  if (!sistema) notFound()

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4 flex-wrap">
        <Link href="/anvs" className="hover:text-white">Aeronaves</Link>
        <span>/</span>
        <Link href={`/anvs/${inspecao.anv.matricula}`} className="hover:text-white">{inspecao.anv.matricula}</Link>
        <span>/</span>
        <Link href={`/inspecoes/${inspecaoId}`} className="hover:text-white">{formatTipo(inspecao.tipo)}</Link>
        <span>/</span>
        <span className="text-white font-medium">Área {sistema.codigo}</span>
      </div>

      <h1 className="text-xl font-bold text-white mb-1">{sistema.nomeEn}</h1>
      <p className="text-gray-400 text-sm mb-6">{sistema.nomePt}</p>

      <div className="space-y-3">
        {sistema.subsistemas.map((sub) => {
          // Só mostra subsistemas que têm cartões nessa inspeção
          const cartoesNaInspecao = sub.cartoes.filter((c) => c.execucoes.length > 0)
          if (cartoesNaInspecao.length === 0) return null

          const total = cartoesNaInspecao.reduce((s, c) =>
            s + c.execucoes.reduce((ss, e) => ss + e.subitemStatuses.length, 0), 0)
          const concluidos = cartoesNaInspecao.reduce((s, c) =>
            s + c.execucoes.reduce((ss, e) =>
              ss + e.subitemStatuses.filter((st) => st.status === "CONCLUIDA").length, 0), 0)
          const pct = total > 0 ? Math.round((concluidos / total) * 100) : 0

          return (
            <Link
              key={sub.id}
              href={`/inspecoes/${inspecaoId}/sistemas/${sistemaId}/subsistemas/${sub.id}`}
              className="block bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-white font-medium">{sub.nomeEn}</p>
                  <p className="text-gray-400 text-xs">{sub.nomePt} · {cartoesNaInspecao.length} cartões</p>
                </div>
                <div className="flex items-center gap-2">
                  {pct === 100 && <span className="text-green-400">✓</span>}
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{concluidos}/{total} subitens</span>
                <span>{pct}%</span>
              </div>
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${pct === 100 ? "bg-green-500" : "bg-blue-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}


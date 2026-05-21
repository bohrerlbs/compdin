import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { notFound } from "next/navigation"
import Link from "next/link"
import FecharInspecaoButton from "./FecharInspecaoButton"
import CancelarInspecaoButton from "./CancelarInspecaoButton"
import AdicionarCartaoCatalogoButton from "./AdicionarCartaoCatalogoButton"
import { formatTipo } from "@/lib/inspecao"
import { fmtDate } from "@/lib/fmt"

interface Props {
  params: Promise<{ id: string }>
}

export default async function InspecaoPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  const role = session!.user.role

  const inspecao = await prisma.inspecao.findUnique({
    where: { id },
    include: {
      anv: true,
      abertaPor: { select: { nome: true } },
      execucoes: {
        include: {
          cartao: {
            include: {
              subsistema: {
                include: { sistema: true },
              },
            },
          },
          subitemStatuses: { select: { status: true } },
        },
      },
    },
  })

  if (!inspecao) notFound()

  // Agrupa execuções por sistema
  const sistemasMap = new Map<string, {
    sistema: { id: string; codigo: string; nomeEn: string; nomePt: string }
    total: number
    concluidos: number
  }>()

  for (const exec of inspecao.execucoes) {
    const sistema = exec.cartao.subsistema.sistema
    const prev = sistemasMap.get(sistema.id) ?? { sistema, total: 0, concluidos: 0 }
    prev.total += exec.subitemStatuses.length
    prev.concluidos += exec.subitemStatuses.filter((s) => s.status === "CONCLUIDA").length
    sistemasMap.set(sistema.id, prev)
  }

  const sistemas = Array.from(sistemasMap.values()).sort((a, b) =>
    a.sistema.codigo.localeCompare(b.sistema.codigo)
  )

  const totalGeral = sistemas.reduce((s, x) => s + x.total, 0)
  const concluidosGeral = sistemas.reduce((s, x) => s + x.concluidos, 0)
  const pctGeral = totalGeral > 0 ? Math.round((concluidosGeral / totalGeral) * 100) : 0

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4 flex-wrap">
        <Link href="/anvs" className="hover:text-white">Aeronaves</Link>
        <span>/</span>
        <Link href={`/anvs/${inspecao.anv.matricula}`} className="hover:text-white">{inspecao.anv.matricula}</Link>
        <span>/</span>
        <span className="text-white font-medium">{formatTipo(inspecao.tipo)}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-white">{formatTipo(inspecao.tipo)}</h1>
          <p className="text-gray-400 text-sm">
            ANV {inspecao.anv.matricula} · Aberta em {fmtDate(inspecao.abertaEm)}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">por {inspecao.abertaPor.nome}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full mt-1 ${
          inspecao.status === "ABERTA"
            ? "bg-yellow-900/50 text-yellow-400 border border-yellow-800"
            : inspecao.status === "CANCELADA"
            ? "bg-red-900/50 text-red-400 border border-red-800"
            : "bg-green-900/50 text-green-400 border border-green-800"
        }`}>
          {inspecao.status === "ABERTA" ? "Aberta" : inspecao.status === "CANCELADA" ? "Cancelada" : "Concluída"}
        </span>
      </div>

      {/* Progresso geral */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Progresso geral</span>
          <span className="text-white font-medium">{concluidosGeral}/{totalGeral} subitens · {pctGeral}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${pctGeral}%` }}
          />
        </div>
      </div>

      {/* Sistemas */}
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Sistemas</h2>
      <div className="space-y-3 mb-6">
        {sistemas.map(({ sistema, total, concluidos }) => {
          const pct = total > 0 ? Math.round((concluidos / total) * 100) : 0
          return (
            <Link
              key={sistema.id}
              href={`/inspecoes/${id}/sistemas/${sistema.id}`}
              className="block bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs text-gray-500 font-mono">Área {sistema.codigo}</span>
                  <p className="text-white font-medium">{sistema.nomeEn}</p>
                  <p className="text-gray-400 text-xs">{sistema.nomePt}</p>
                </div>
                <div className="flex items-center gap-2">
                  {pct === 100 && (
                    <span className="text-green-400 text-lg">✓</span>
                  )}
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

      {/* Adicionar cartão do catálogo (Inspeção Especial ou privilegiados em qualquer inspeção) */}
      {inspecao.status === "ABERTA" && (role === "INSPETOR" || role === "ADMIN" || role === "ENCARREGADO") && (
        <div className="mb-4">
          <AdicionarCartaoCatalogoButton
            inspecaoId={id}
            tipo={inspecao.tipo}
          />
        </div>
      )}

      {/* Fechar inspeção */}
      {inspecao.status === "ABERTA" && (role === "INSPETOR" || role === "ADMIN") && (
        <FecharInspecaoButton inspecaoId={id} />
      )}

      {/* Cancelar / Excluir inspeção */}
      {(inspecao.status === "ABERTA" || inspecao.status === "CANCELADA") && (role === "ADMIN" || role === "INSPETOR" || role === "ENCARREGADO") && (
        <div className="mt-3">
          <CancelarInspecaoButton inspecaoId={id} anvMatricula={inspecao.anv.matricula} status={inspecao.status} />
        </div>
      )}
    </div>
  )
}

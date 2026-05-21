import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { notFound } from "next/navigation"
import Link from "next/link"
import AdicionarCartaoForm from "./AdicionarCartaoForm"
import { formatTipo } from "@/lib/inspecao"

interface Props {
  params: Promise<{ id: string; sistemaId: string; subsistemaId: string }>
}

const TIPO_LABEL: Record<string, string> = {
  VISUAL_CHECK: "Visual Check",
  DETAILED_INSPECTION: "Detailed Inspection",
  SPECIAL_DETAILED_INSPECTION: "Special Detailed Inspection",
  SERVICE: "Service",
  LUBRIFICATION: "Lubrification",
  BIM_CHECK: "BIM Check",
  TAP_TEST: "Tap Test",
  OIL_SAMPLE: "Oil Sample",
}

const PRIVILEGED = ["ADMIN", "ENCARREGADO", "INSPETOR"]

export default async function SubsistemaPage({ params }: Props) {
  const { id: inspecaoId, sistemaId, subsistemaId } = await params
  const session = await auth()
  const role = session?.user.role ?? "MECANICO"
  const canManage = PRIVILEGED.includes(role)

  const [inspecao, subsistema] = await Promise.all([
    prisma.inspecao.findUnique({
      where: { id: inspecaoId },
      include: { anv: true },
    }),
    prisma.subsistema.findUnique({
      where: { id: subsistemaId },
      include: {
        sistema: true,
        cartoes: {
          orderBy: { ordem: "asc" },
          include: {
            execucoes: {
              where: { inspecaoId },
              include: { subitemStatuses: { select: { status: true } } },
            },
          },
        },
      },
    }),
  ])

  if (!inspecao || !subsistema) notFound()

  const cartoesNaInspecao = subsistema.cartoes.filter((c) => c.execucoes.length > 0)
  const extraCartoes = cartoesNaInspecao
    .filter((c) => c.extra)
    .map((c) => ({ id: c.id, codigo: c.codigo, nomePt: c.nomePt }))

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4 flex-wrap">
        <Link href="/anvs" className="hover:text-white">ANVs</Link>
        <span>/</span>
        <Link href={`/anvs/${inspecao.anv.matricula}`} className="hover:text-white">{inspecao.anv.matricula}</Link>
        <span>/</span>
        <Link href={`/inspecoes/${inspecaoId}`} className="hover:text-white">{formatTipo(inspecao.tipo)}</Link>
        <span>/</span>
        <Link href={`/inspecoes/${inspecaoId}/sistemas/${sistemaId}`} className="hover:text-white">
          Área {subsistema.sistema.codigo}
        </Link>
        <span>/</span>
        <span className="text-white font-medium">{subsistema.nomePt}</span>
      </div>

      <h1 className="text-xl font-bold text-white mb-1">{subsistema.nomePt}</h1>
      <p className="text-gray-400 text-sm mb-6">{subsistema.nomeEn}</p>

      <div className="space-y-3">
        {cartoesNaInspecao.map((cartao) => {
          const exec = cartao.execucoes[0]
          const total = exec?.subitemStatuses.length ?? 0
          const concluidos = exec?.subitemStatuses.filter((s) => s.status === "CONCLUIDA").length ?? 0
          const pct = total > 0 ? Math.round((concluidos / total) * 100) : 0

          return (
            <Link
              key={cartao.id}
              href={`/inspecoes/${inspecaoId}/sistemas/${sistemaId}/subsistemas/${subsistemaId}/cartoes/${cartao.id}`}
              className="block bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition-colors"
              style={cartao.extra ? { borderColor: "var(--border-gold)", background: "rgba(190,148,50,0.04)" } : {}}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-white font-mono font-medium text-sm">{cartao.codigo}</span>
                    <span className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                      {TIPO_LABEL[cartao.tipo] ?? cartao.tipo}
                    </span>
                    {cartao.extra && (
                      <span style={{
                        background: "var(--gold-dim)",
                        border: "1px solid var(--border-gold)",
                        color: "var(--gold)",
                        fontSize: "0.55rem",
                        padding: "1px 5px",
                        borderRadius: 4,
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                      }}>
                        EXTRA
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm">{cartao.nomePt}</p>
                  {cartao.wp && (
                    <p className="text-gray-500 text-xs mt-0.5 font-mono">{cartao.wp}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {pct === 100 && <span className="text-green-400">✓</span>}
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {total > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{concluidos}/{total} passos</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct === 100 ? "bg-green-500" : "bg-blue-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}
            </Link>
          )
        })}

        {cartoesNaInspecao.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">
            Nenhum cartão disponível para esta inspeção.
          </p>
        )}
      </div>

      {canManage && (
        <AdicionarCartaoForm
          inspecaoId={inspecaoId}
          sistemaId={sistemaId}
          subsistemaId={subsistemaId}
          extraCartoes={extraCartoes}
        />
      )}
    </div>
  )
}


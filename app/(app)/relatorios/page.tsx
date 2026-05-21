import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"
import { formatTipo } from "@/lib/inspecao"
import { fmtDate, fmtDateShort, fmtHora } from "@/lib/fmt"
import FiltroPanel from "./FiltroPanel"

interface Props {
  searchParams: Promise<{ di?: string; df?: string; mec?: string; sis?: string; sub?: string; anv?: string; busca?: string; dia?: string }>
}

export default async function RelatoriosPage({ searchParams }: Props) {
  const session = await auth()
  if (!session) redirect("/login")

  const { role } = session.user
  if (role !== "ENCARREGADO" && role !== "INSPETOR" && role !== "ADMIN") redirect("/anvs")

  const { di, df, mec, sis, sub, anv, busca, dia } = await searchParams

  // ── Dados para os selects de filtro ───────────────────────────────────────
  const [users, sistemas, subsistemas, anvs] = await Promise.all([
    prisma.user.findMany({ select: { id: true, trigrama: true, nome: true }, where: { ativo: true }, orderBy: { trigrama: "asc" } }),
    prisma.sistema.findMany({ select: { id: true, codigo: true, nomePt: true }, orderBy: { ordem: "asc" } }),
    prisma.subsistema.findMany({ select: { id: true, nomePt: true, sistemaId: true }, orderBy: { ordem: "asc" } }),
    prisma.anv.findMany({ select: { id: true, matricula: true }, orderBy: { matricula: "asc" } }),
  ])

  // ── Construir where para subitemStatuses ──────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { status: "CONCLUIDA" }

  if (di || df) {
    where.dataConclusao = {}
    if (di) where.dataConclusao.gte = new Date(`${di}T00:00:00`)
    if (df) where.dataConclusao.lte = new Date(`${df}T23:59:59`)
  }
  if (mec) where.mecanicoId = mec
  if (anv) {
    where.execucao = { inspecao: { anvId: anv } }
  }

  const cartaoWhere = sub
    ? { subsistemaId: sub }
    : sis
    ? { subsistema: { sistemaId: sis } }
    : undefined

  if (cartaoWhere) {
    const execucoesComFiltro = await prisma.execucaoCartao.findMany({
      where: { cartao: cartaoWhere },
      select: { id: true },
    })
    const execIds = execucoesComFiltro.map(e => e.id)
    where.execucaoId = { in: execIds }
  }

  // ── Tarefas COMPDIN ──────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tarefasWhere: any = {}
  if (di || df) {
    tarefasWhere.criadoEm = {}
    if (di) tarefasWhere.criadoEm.gte = new Date(`${di}T00:00:00`)
    if (df) tarefasWhere.criadoEm.lte = new Date(`${df}T23:59:59`)
  }
  if (busca?.trim()) {
    tarefasWhere.titulo = { contains: busca.trim(), mode: "insensitive" }
  }
  const tarefasCompdin = await prisma.tarefaCompdin.findMany({
    where: tarefasWhere,
    include: {
      autor: { select: { trigrama: true, nome: true } },
      responsavel: { select: { trigrama: true, nome: true } },
      mecanicos: { include: { mecanico: { select: { trigrama: true } } } },
    },
    orderBy: { criadoEm: "desc" },
    take: 100,
  })

  // ── Query principal ───────────────────────────────────────────────────────
  const statuses = await prisma.subitemStatus.findMany({
    where,
    include: {
      mecanico: { select: { nome: true, trigrama: true, matricula: true } },
      mecanicos: { include: { mecanico: { select: { trigrama: true } } } },
      subitem: {
        select: {
          letra: true,
          cartao: {
            select: {
              codigo: true,
              nomePt: true,
              duracaoMin: true,
              subsistema: { select: { nomePt: true, sistema: { select: { codigo: true, nomePt: true } } } },
            },
          },
        },
      },
      execucao: {
        include: {
          inspecao: { include: { anv: { select: { matricula: true } } } },
        },
      },
    },
    orderBy: { dataConclusao: "desc" },
    take: 200,
  })

  // ── Resumo por mecânico ───────────────────────────────────────────────────
  type MecResumo = {
    trigrama: string; nome: string; matricula: string
    totalConcluidos: number; totalMinutos: number; inspecoes: Set<string>
  }

  const porMecanico = new Map<string, MecResumo>()
  for (const st of statuses) {
    if (!st.mecanico) continue
    const key = st.mecanico.trigrama
    const prev = porMecanico.get(key) ?? {
      trigrama: st.mecanico.trigrama, nome: st.mecanico.nome, matricula: st.mecanico.matricula,
      totalConcluidos: 0, totalMinutos: 0, inspecoes: new Set<string>(),
    }
    prev.totalConcluidos++
    if (st.dataInicio && st.dataConclusao) {
      prev.totalMinutos += Math.round((st.dataConclusao.getTime() - st.dataInicio.getTime()) / 60000)
    } else if (st.subitem?.cartao?.duracaoMin) {
      prev.totalMinutos += Math.round(st.subitem.cartao.duracaoMin / 4)
    }
    prev.inspecoes.add(st.execucao.inspecaoId)
    porMecanico.set(key, prev)
  }
  const mecanicos = Array.from(porMecanico.values()).sort((a, b) => b.totalConcluidos - a.totalConcluidos)

  // Inspeções abertas (sem filtro — sempre mostrado)
  const inspecoesAbertas = await prisma.inspecao.findMany({
    where: { status: "ABERTA" },
    include: {
      anv: { select: { matricula: true } },
      execucoes: { include: { subitemStatuses: { select: { status: true } } } },
    },
    orderBy: { abertaEm: "desc" },
  })

  // ── Livro do dia ──────────────────────────────────────────────────────────
  let livroData: {
    statuses: typeof statuses
    tarefas: typeof tarefasCompdin
  } | null = null

  if (dia) {
    const livroStatuses = await prisma.subitemStatus.findMany({
      where: {
        status: "CONCLUIDA",
        dataConclusao: {
          gte: new Date(`${dia}T00:00:00`),
          lte: new Date(`${dia}T23:59:59`),
        },
      },
      include: {
        mecanico: { select: { trigrama: true } },
        mecanicos: { include: { mecanico: { select: { trigrama: true } } } },
        subitem: {
          select: {
            letra: true,
            cartao: {
              select: {
                codigo: true, nomePt: true,
                subsistema: { select: { sistema: { select: { codigo: true } } } },
              },
            },
          },
        },
        execucao: {
          include: { inspecao: { include: { anv: { select: { matricula: true } }, } } },
        },
      },
      orderBy: { dataConclusao: "asc" },
    })

    const livroTarefas = await prisma.tarefaCompdin.findMany({
      where: {
        status: "CONCLUIDA",
        concluidoEm: {
          gte: new Date(`${dia}T00:00:00`),
          lte: new Date(`${dia}T23:59:59`),
        },
      },
      include: {
        responsavel: { select: { trigrama: true } },
        mecanicos: { include: { mecanico: { select: { trigrama: true } } } },
      },
      orderBy: { concluidoEm: "asc" },
    })

    livroData = { statuses: livroStatuses as typeof statuses, tarefas: livroTarefas as typeof tarefasCompdin }
  }

  const temFiltro = !!(di || df || mec || sis || sub || anv || busca || dia)

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/anvs" style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>← Voltar</Link>
        <h1 style={{ color: "var(--gold-bright)", fontWeight: 800, fontSize: "1.1rem", letterSpacing: "0.12em", margin: "8px 0 4px" }}>
          RELATÓRIOS
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", margin: "0 0 4px" }}>
          Controle de trabalho · COMPDIN
        </p>
        {temFiltro && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
            {dia && <span className="badge-gold" style={{ fontSize: "0.58rem" }}>Livro: {fmtDate(dia)}</span>}
            {di && <span className="badge-gold" style={{ fontSize: "0.58rem" }}>De: {fmtDate(di)}</span>}
            {df && <span className="badge-gold" style={{ fontSize: "0.58rem" }}>Até: {fmtDate(df)}</span>}
            {mec && <span className="badge-gold" style={{ fontSize: "0.58rem" }}>Mec: {users.find(u => u.id === mec)?.trigrama}</span>}
            {anv && <span className="badge-gold" style={{ fontSize: "0.58rem" }}>ANV: {anvs.find(a => a.id === anv)?.matricula}</span>}
            {sis && <span className="badge-gold" style={{ fontSize: "0.58rem" }}>Sis: {sistemas.find(s => s.id === sis)?.codigo}</span>}
            {sub && <span className="badge-gold" style={{ fontSize: "0.58rem" }}>Sub: {subsistemas.find(s => s.id === sub)?.nomePt}</span>}
            {busca && <span className="badge-gold" style={{ fontSize: "0.58rem" }}>Busca: &quot;{busca}&quot;</span>}
          </div>
        )}
      </div>

      {/* Filtros */}
      <Suspense fallback={null}>
        <FiltroPanel
          mecanicos={users.map(u => ({ id: u.id, label: `${u.trigrama} — ${u.nome}` }))}
          sistemas={sistemas.map(s => ({ id: s.id, label: `${s.codigo} · ${s.nomePt}` }))}
          subsistemas={subsistemas.map(s => ({ id: s.id, label: s.nomePt }))}
          anvs={anvs.map(a => ({ id: a.id, label: a.matricula }))}
        />
      </Suspense>

      {/* ── LIVRO DO DIA ─────────────────────────────────────────────────── */}
      {livroData && dia && (
        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "0.6rem", letterSpacing: "0.14em", color: "var(--gold)", fontWeight: 700, margin: "0 0 0.75rem" }}>
            LIVRO DO DIA — {fmtDate(dia)}
          </h2>
          <LivroView statuses={livroData.statuses} tarefas={livroData.tarefas} />
        </section>
      )}

      {/* Inspeções em andamento — só sem filtro */}
      {!temFiltro && (
        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "0.6rem", letterSpacing: "0.14em", color: "var(--text-dim)", fontWeight: 700, margin: "0 0 0.75rem" }}>
            INSPEÇÕES EM ANDAMENTO
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {inspecoesAbertas.map((insp) => {
              const total = insp.execucoes.reduce((s, e) => s + e.subitemStatuses.length, 0)
              const concl = insp.execucoes.reduce((s, e) => s + e.subitemStatuses.filter(x => x.status === "CONCLUIDA").length, 0)
              const pct = total > 0 ? Math.round((concl / total) * 100) : 0
              return (
                <div key={insp.id} className="card-mil" style={{ padding: "0.75rem 1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem" }}>{insp.anv.matricula}</span>
                      <span style={{ marginLeft: 8, color: "var(--gold)", fontSize: "0.78rem", fontWeight: 600 }}>{fmt(insp.tipo)}</span>
                    </div>
                    <span style={{ color: pct === 100 ? "var(--green-text)" : "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700 }}>{pct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-bar-fill ${pct === 100 ? "done" : "partial"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p style={{ color: "var(--text-dim)", fontSize: "0.65rem", margin: "4px 0 0" }}>
                    {concl}/{total} subitens · Aberta em {fmtDate(insp.abertaEm)}
                  </p>
                </div>
              )
            })}
            {inspecoesAbertas.length === 0 && (
              <p style={{ color: "var(--text-dim)", fontSize: "0.8rem", padding: "0.5rem 0" }}>Nenhuma inspeção em andamento.</p>
            )}
          </div>
        </section>
      )}

      {/* Resumo por mecânico */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "0.6rem", letterSpacing: "0.14em", color: "var(--text-dim)", fontWeight: 700, margin: "0 0 0.75rem" }}>
          PRODUTIVIDADE POR MECÂNICO {temFiltro ? "(FILTRADO)" : ""}
        </h2>
        <div className="card-mil" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["TRIG.", "NOME", "TAREFAS", "H.TRAB.", "INSPEÇÕES"].map(h => (
                  <th key={h} style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontSize: "0.58rem", letterSpacing: "0.1em", color: "var(--text-dim)", fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mecanicos.map((m, i) => (
                <tr key={m.trigrama} style={{ borderBottom: i < mecanicos.length - 1 ? "1px solid var(--border)" : undefined, background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                  <td style={{ padding: "0.6rem 0.75rem" }}>
                    <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "0.85rem", color: "var(--gold-bright)", letterSpacing: "0.1em" }}>{m.trigrama}</span>
                  </td>
                  <td style={{ padding: "0.6rem 0.75rem", color: "var(--text-primary)", fontSize: "0.8rem" }}>{m.nome}</td>
                  <td style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600 }}>{m.totalConcluidos}</td>
                  <td style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>{fmtDur(m.totalMinutos)}</td>
                  <td style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>{m.inspecoes.size}</td>
                </tr>
              ))}
              {mecanicos.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-dim)", fontSize: "0.8rem" }}>Nenhuma tarefa no período/filtro selecionado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tarefas COMPDIN */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "0.6rem", letterSpacing: "0.14em", color: "var(--text-dim)", fontWeight: 700, margin: "0 0 0.75rem" }}>
          TAREFAS COMPDIN {busca ? `— busca: "${busca}"` : temFiltro ? "(FILTRADO)" : `(${tarefasCompdin.length})`}
        </h2>
        <div className="card-mil" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["CRIADA EM", "AUTOR", "MECÂNICOS", "STATUS", "INICIADA", "CONCLUÍDA", "TAREFA"].map(h => (
                  <th key={h} style={{ padding: "0.5rem 0.6rem", textAlign: "left", fontSize: "0.55rem", letterSpacing: "0.08em", color: "var(--text-dim)", fontWeight: 700, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tarefasCompdin.map((t, i) => {
                const statusCfg = {
                  PENDENTE: { color: "var(--text-dim)", label: "PENDENTE" },
                  INICIADA: { color: "var(--yellow-text)", label: "INICIADA" },
                  CONCLUIDA: { color: "var(--green-text)", label: "CONCLUÍDA" },
                }[t.status]
                const mecTrigrams = t.mecanicos.length > 0
                  ? t.mecanicos.map(m => m.mecanico.trigrama).join(", ")
                  : t.responsavel?.trigrama ?? "—"
                return (
                  <tr key={t.id} style={{ borderBottom: i < tarefasCompdin.length - 1 ? "1px solid var(--border)" : undefined, background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                    <td style={{ padding: "0.45rem 0.6rem", color: "var(--text-dim)", fontSize: "0.65rem", whiteSpace: "nowrap" }}>
                      {fmtDateShort(t.criadoEm)}
                    </td>
                    <td style={{ padding: "0.45rem 0.6rem" }}>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.75rem", color: "var(--gold-bright)" }}>{t.autor.trigrama}</span>
                    </td>
                    <td style={{ padding: "0.45rem 0.6rem" }}>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.72rem", color: t.status === "CONCLUIDA" ? "var(--green-text)" : t.status === "INICIADA" ? "var(--yellow-text)" : "var(--text-dim)" }}>
                        {mecTrigrams}
                      </span>
                    </td>
                    <td style={{ padding: "0.45rem 0.6rem" }}>
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, color: statusCfg.color }}>{statusCfg.label}</span>
                    </td>
                    <td style={{ padding: "0.45rem 0.6rem", color: "var(--yellow-text)", fontSize: "0.65rem", whiteSpace: "nowrap" }}>
                      {t.iniciadoEm ? fmtDateShort(t.iniciadoEm) : "—"}
                    </td>
                    <td style={{ padding: "0.45rem 0.6rem", color: "var(--green-text)", fontSize: "0.65rem", whiteSpace: "nowrap" }}>
                      {t.concluidoEm ? fmtDateShort(t.concluidoEm) : "—"}
                    </td>
                    <td style={{ padding: "0.45rem 0.6rem", color: "var(--text-primary)", fontSize: "0.72rem", maxWidth: 200 }}>
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.titulo}</span>
                    </td>
                  </tr>
                )
              })}
              {tarefasCompdin.length === 0 && (
                <tr><td colSpan={7} style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-dim)", fontSize: "0.8rem" }}>Nenhuma tarefa no período selecionado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Log de execuções */}
      <section>
        <h2 style={{ fontSize: "0.6rem", letterSpacing: "0.14em", color: "var(--text-dim)", fontWeight: 700, margin: "0 0 0.75rem" }}>
          REGISTRO DE TAREFAS {temFiltro ? `(${statuses.length} resultado${statuses.length !== 1 ? "s" : ""})` : "(ÚLTIMAS 200)"}
        </h2>
        <div className="card-mil" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["DATA/HORA", "MEC.", "ANV", "INSP.", "SISTEMA", "CARTÃO", "PASSO"].map(h => (
                  <th key={h} style={{ padding: "0.5rem 0.6rem", textAlign: "left", fontSize: "0.55rem", letterSpacing: "0.08em", color: "var(--text-dim)", fontWeight: 700, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {statuses.map((st, i) => {
                const mecTrigrams = st.mecanicos.length > 0
                  ? st.mecanicos.map(m => m.mecanico.trigrama).join(", ")
                  : st.mecanico?.trigrama ?? "—"
                return (
                  <tr key={st.id} style={{ borderBottom: i < statuses.length - 1 ? "1px solid var(--border)" : undefined, background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                    <td style={{ padding: "0.45rem 0.6rem", color: "var(--text-dim)", fontSize: "0.65rem", whiteSpace: "nowrap" }}>
                      {st.dataConclusao ? fmtHora(st.dataConclusao) : "—"}
                    </td>
                    <td style={{ padding: "0.45rem 0.6rem" }}>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.72rem", color: "var(--gold-bright)" }}>{mecTrigrams}</span>
                    </td>
                    <td style={{ padding: "0.45rem 0.6rem", color: "var(--text-primary)", fontSize: "0.72rem", fontFamily: "monospace", fontWeight: 600 }}>
                      {st.execucao.inspecao.anv.matricula}
                    </td>
                    <td style={{ padding: "0.45rem 0.6rem", color: "var(--text-muted)", fontSize: "0.68rem" }}>{fmt(st.execucao.inspecao.tipo)}</td>
                    <td style={{ padding: "0.45rem 0.6rem", color: "var(--text-dim)", fontSize: "0.65rem" }}>
                      {st.subitem?.cartao?.subsistema?.sistema?.codigo ?? "—"}
                    </td>
                    <td style={{ padding: "0.45rem 0.6rem", color: "var(--gold)", fontSize: "0.68rem", fontFamily: "monospace", fontWeight: 600 }}>
                      {st.subitem?.cartao?.codigo ?? "—"}
                    </td>
                    <td style={{ padding: "0.45rem 0.6rem", color: "var(--text-muted)", fontSize: "0.68rem", fontFamily: "monospace" }}>
                      {st.subitem?.letra ?? "—"}
                    </td>
                  </tr>
                )
              })}
              {statuses.length === 0 && (
                <tr><td colSpan={7} style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-dim)", fontSize: "0.8rem" }}>Sem registros para os filtros aplicados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

// ── Livro do Dia ──────────────────────────────────────────────────────────────

type AnyStatus = {
  mecanicos: { mecanico: { trigrama: string } }[]
  mecanico: { trigrama: string } | null
  subitem: {
    letra: string
    cartao: {
      codigo: string
      nomePt: string
      subsistema: { sistema: { codigo: string } }
    } | null
  } | null
  execucao: { inspecao: { tipo: string; anv: { matricula: string } } }
}

type AnyTarefa = {
  id: string
  titulo: string
  mecanicos: { mecanico: { trigrama: string } }[]
  responsavel: { trigrama: string } | null
}

function mecStr(mecanicos: { mecanico: { trigrama: string } }[], fallback: string | null | undefined) {
  return mecanicos.length > 0 ? mecanicos.map(m => m.mecanico.trigrama).join(", ") : (fallback ?? "—")
}

function LivroView({ statuses, tarefas }: { statuses: AnyStatus[]; tarefas: AnyTarefa[] }) {
  // Group statuses by ANV matricula
  const byAnv = new Map<string, AnyStatus[]>()
  for (const st of statuses) {
    const mat = st.execucao.inspecao.anv.matricula
    const arr = byAnv.get(mat) ?? []
    arr.push(st)
    byAnv.set(mat, arr)
  }

  const nada = byAnv.size === 0 && tarefas.length === 0

  if (nada) {
    return (
      <div className="card-mil" style={{ padding: "1.5rem", textAlign: "center" }}>
        <p style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>Nenhuma atividade registrada neste dia.</p>
      </div>
    )
  }

  return (
    <div className="card-mil" style={{ padding: "1rem" }}>
      {Array.from(byAnv.entries()).map(([mat, sts]) => (
        <div key={mat} style={{ marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "0.95rem", color: "var(--gold-bright)", letterSpacing: "0.08em" }}>{mat}</span>
            <span style={{ color: "var(--text-dim)", fontSize: "0.65rem" }}>{fmt(sts[0].execucao.inspecao.tipo)}</span>
          </div>
          <div style={{ paddingLeft: 12, borderLeft: "2px solid var(--border-gold)" }}>
            {sts.map((st, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3px 0", borderBottom: i < sts.length - 1 ? "1px solid rgba(255,255,255,0.04)" : undefined }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                  <span style={{ color: "var(--gold)", fontFamily: "monospace", fontWeight: 600 }}>{st.subitem?.cartao?.codigo ?? "—"}</span>
                  {" "}<span style={{ color: "var(--text-dim)", fontSize: "0.65rem" }}>seção {st.subitem?.cartao?.subsistema?.sistema?.codigo}</span>
                  {" · "}{st.subitem?.cartao?.nomePt}
                  {" · passo "}<span style={{ fontFamily: "monospace" }}>{st.subitem?.letra}</span>
                </span>
                <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.72rem", color: "var(--green-text)", marginLeft: 12, whiteSpace: "nowrap" }}>
                  {mecStr(st.mecanicos, st.mecanico?.trigrama)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {tarefas.length > 0 && (
        <div style={{ marginTop: byAnv.size > 0 ? "1rem" : 0, paddingTop: byAnv.size > 0 ? "1rem" : 0, borderTop: byAnv.size > 0 ? "1px solid var(--border)" : undefined }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "0.95rem", color: "var(--text-primary)" }}>COMPDIN</span>
          </div>
          <div style={{ paddingLeft: 12, borderLeft: "2px solid var(--border)" }}>
            {tarefas.map((t, i) => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3px 0", borderBottom: i < tarefas.length - 1 ? "1px solid rgba(255,255,255,0.04)" : undefined }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>{t.titulo}</span>
                <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.72rem", color: "var(--green-text)", marginLeft: 12, whiteSpace: "nowrap" }}>
                  {mecStr(t.mecanicos, t.responsavel?.trigrama)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const fmt = formatTipo

function fmtDur(min: number) {
  if (min === 0) return "—"
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`
}

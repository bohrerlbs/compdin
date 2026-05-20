import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function RelatoriosPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const { role } = session.user
  if (role !== "ENCARREGADO" && role !== "ADMIN") redirect("/anvs")

  // Busca todos os subitemStatuses concluídos com dados do mecânico e da inspeção
  const statuses = await prisma.subitemStatus.findMany({
    where: { status: "CONCLUIDA", mecanicoId: { not: null } },
    include: {
      mecanico: { select: { nome: true, trigrama: true, matricula: true } },
      subitem: { select: { letra: true, cartao: { select: { codigo: true, nomePt: true, duracaoMin: true } } } },
      execucao: {
        include: {
          inspecao: {
            include: { anv: { select: { matricula: true } } },
          },
        },
      },
    },
    orderBy: { dataConclusao: "desc" },
  })

  // Agrupa por mecânico
  type MecResumo = {
    trigrama: string
    nome: string
    matricula: string
    totalConcluidos: number
    totalMinutos: number
    inspecoes: Set<string>
  }

  const porMecanico = new Map<string, MecResumo>()

  for (const st of statuses) {
    if (!st.mecanico) continue
    const key = st.mecanico.trigrama
    const prev = porMecanico.get(key) ?? {
      trigrama: st.mecanico.trigrama,
      nome: st.mecanico.nome,
      matricula: st.mecanico.matricula,
      totalConcluidos: 0,
      totalMinutos: 0,
      inspecoes: new Set(),
    }
    prev.totalConcluidos++
    if (st.dataInicio && st.dataConclusao) {
      prev.totalMinutos += Math.round(
        (st.dataConclusao.getTime() - st.dataInicio.getTime()) / 60000
      )
    } else if (st.subitem?.cartao?.duracaoMin) {
      // fallback: usa duração estimada do cartão dividida pelo número de subitens
      prev.totalMinutos += Math.round(st.subitem.cartao.duracaoMin / 4)
    }
    prev.inspecoes.add(st.execucao.inspecaoId)
    porMecanico.set(key, prev)
  }

  const mecanicos = Array.from(porMecanico.values()).sort(
    (a, b) => b.totalConcluidos - a.totalConcluidos
  )

  // Últimas 30 execuções concluídas (log recente)
  const recentes = statuses.slice(0, 30)

  // Inspeções abertas
  const inspecoesAbertas = await prisma.inspecao.findMany({
    where: { status: "ABERTA" },
    include: {
      anv: { select: { matricula: true } },
      execucoes: {
        include: {
          subitemStatuses: { select: { status: true } },
        },
      },
    },
    orderBy: { abertaEm: "desc" },
  })

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Link href="/anvs" style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
            ← Voltar
          </Link>
        </div>
        <h1
          style={{
            color: "var(--gold-bright)",
            fontWeight: 800,
            fontSize: "1.1rem",
            letterSpacing: "0.12em",
            margin: 0,
          }}
        >
          RELATÓRIOS
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", margin: "4px 0 0" }}>
          Controle de trabalho · COMPDIN
        </p>
      </div>

      {/* Cards de inspeção aberta */}
      <section style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            fontSize: "0.6rem",
            letterSpacing: "0.14em",
            color: "var(--text-dim)",
            fontWeight: 700,
            margin: "0 0 0.75rem",
          }}
        >
          INSPEÇÕES EM ANDAMENTO
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {inspecoesAbertas.map((insp) => {
            const total = insp.execucoes.reduce((s, e) => s + e.subitemStatuses.length, 0)
            const concl = insp.execucoes.reduce(
              (s, e) => s + e.subitemStatuses.filter((x) => x.status === "CONCLUIDA").length,
              0
            )
            const pct = total > 0 ? Math.round((concl / total) * 100) : 0
            return (
              <div key={insp.id} className="card-mil" style={{ padding: "0.75rem 1rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        fontSize: "0.9rem",
                      }}
                    >
                      {insp.anv.matricula}
                    </span>
                    <span
                      style={{
                        marginLeft: 8,
                        color: "var(--gold)",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                      }}
                    >
                      {fmt(insp.tipo)}
                    </span>
                  </div>
                  <span style={{ color: pct === 100 ? "var(--green-text)" : "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700 }}>
                    {pct}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-bar-fill ${pct === 100 ? "done" : "partial"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p style={{ color: "var(--text-dim)", fontSize: "0.65rem", margin: "4px 0 0" }}>
                  {concl}/{total} subitens · Aberta em {new Date(insp.abertaEm).toLocaleDateString("pt-BR")}
                </p>
              </div>
            )
          })}
          {inspecoesAbertas.length === 0 && (
            <p style={{ color: "var(--text-dim)", fontSize: "0.8rem", padding: "1rem 0" }}>
              Nenhuma inspeção em andamento.
            </p>
          )}
        </div>
      </section>

      {/* Resumo por mecânico */}
      <section style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            fontSize: "0.6rem",
            letterSpacing: "0.14em",
            color: "var(--text-dim)",
            fontWeight: 700,
            margin: "0 0 0.75rem",
          }}
        >
          PRODUTIVIDADE POR MECÂNICO
        </h2>
        <div className="card-mil" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["TRIGRAMA", "NOME", "TAREFAS", "H.TRAB.", "INSPEÇÕES"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "0.5rem 0.75rem",
                      textAlign: "left",
                      fontSize: "0.58rem",
                      letterSpacing: "0.1em",
                      color: "var(--text-dim)",
                      fontWeight: 700,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mecanicos.map((m, i) => (
                <tr
                  key={m.trigrama}
                  style={{
                    borderBottom: i < mecanicos.length - 1 ? "1px solid var(--border)" : undefined,
                    background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                  }}
                >
                  <td style={{ padding: "0.6rem 0.75rem" }}>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        color: "var(--gold-bright)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {m.trigrama}
                    </span>
                  </td>
                  <td style={{ padding: "0.6rem 0.75rem", color: "var(--text-primary)", fontSize: "0.8rem" }}>
                    {m.nome}
                  </td>
                  <td style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600 }}>
                    {m.totalConcluidos}
                  </td>
                  <td style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    {fmtDur(m.totalMinutos)}
                  </td>
                  <td style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    {m.inspecoes.size}
                  </td>
                </tr>
              ))}
              {mecanicos.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: "1.5rem",
                      textAlign: "center",
                      color: "var(--text-dim)",
                      fontSize: "0.8rem",
                    }}
                  >
                    Nenhuma tarefa concluída ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Log recente */}
      <section>
        <h2
          style={{
            fontSize: "0.6rem",
            letterSpacing: "0.14em",
            color: "var(--text-dim)",
            fontWeight: 700,
            margin: "0 0 0.75rem",
          }}
        >
          REGISTRO RECENTE (ÚLTIMAS 30 TAREFAS CONCLUÍDAS)
        </h2>
        <div className="card-mil" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["DATA/HORA", "MEC.", "ANV", "INSPEÇÃO", "CARTÃO", "PASSO"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "0.5rem 0.75rem",
                      textAlign: "left",
                      fontSize: "0.58rem",
                      letterSpacing: "0.1em",
                      color: "var(--text-dim)",
                      fontWeight: 700,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentes.map((st, i) => (
                <tr
                  key={st.id}
                  style={{
                    borderBottom: i < recentes.length - 1 ? "1px solid var(--border)" : undefined,
                    background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                  }}
                >
                  <td
                    style={{
                      padding: "0.5rem 0.75rem",
                      color: "var(--text-dim)",
                      fontSize: "0.68rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {st.dataConclusao
                      ? new Date(st.dataConclusao).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td style={{ padding: "0.5rem 0.75rem" }}>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        color: "var(--gold-bright)",
                      }}
                    >
                      {st.mecanico?.trigrama ?? "—"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "0.5rem 0.75rem",
                      color: "var(--text-primary)",
                      fontSize: "0.75rem",
                      fontFamily: "monospace",
                      fontWeight: 600,
                    }}
                  >
                    {st.execucao.inspecao.anv.matricula}
                  </td>
                  <td
                    style={{
                      padding: "0.5rem 0.75rem",
                      color: "var(--text-muted)",
                      fontSize: "0.72rem",
                    }}
                  >
                    {fmt(st.execucao.inspecao.tipo)}
                  </td>
                  <td
                    style={{
                      padding: "0.5rem 0.75rem",
                      color: "var(--gold)",
                      fontSize: "0.72rem",
                      fontFamily: "monospace",
                      fontWeight: 600,
                    }}
                  >
                    {st.subitem?.cartao?.codigo ?? "—"}
                  </td>
                  <td
                    style={{
                      padding: "0.5rem 0.75rem",
                      color: "var(--text-muted)",
                      fontSize: "0.72rem",
                      fontFamily: "monospace",
                    }}
                  >
                    {st.subitem?.letra ?? "—"}
                  </td>
                </tr>
              ))}
              {recentes.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "1.5rem",
                      textAlign: "center",
                      color: "var(--text-dim)",
                      fontSize: "0.8rem",
                    }}
                  >
                    Sem registros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function fmt(tipo: string) {
  return tipo.replace("INSP_", "INSP-").replace("PMS_", "PMS-").replace("PMI_", "PMI-")
}

function fmtDur(min: number) {
  if (min === 0) return "—"
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`
}

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { notFound } from "next/navigation"
import Link from "next/link"
import SubitemCard from "./SubitemCard"
import AvisosPanel from "./AvisosPanel"
import DefeitosPanel from "./DefeitosPanel"
import AdminCartaoEditor from "./AdminCartaoEditor"

interface Props {
  params: Promise<{ id: string; sistemaId: string; subsistemaId: string; cartaoId: string }>
}

const TIPO_LABEL: Record<string, string> = {
  VISUAL_CHECK: "Visual Check",
  DETAILED_INSPECTION: "Detailed Inspection",
  SPECIAL_DETAILED_INSPECTION: "Special Detailed Insp.",
  SERVICE: "Service",
  LUBRIFICATION: "Lubrification",
  BIM_CHECK: "BIM Check",
  TAP_TEST: "Tap Test",
  OIL_SAMPLE: "Oil Sample",
}

export default async function CartaoPage({ params }: Props) {
  const { id: inspecaoId, sistemaId, subsistemaId, cartaoId } = await params
  const session = await auth()
  const role = session!.user.role
  const userId = session!.user.id

  const [inspecao, cartao] = await Promise.all([
    prisma.inspecao.findUnique({
      where: { id: inspecaoId },
      include: { anv: true },
    }),
    prisma.cartao.findUnique({
      where: { id: cartaoId },
      include: {
        subsistema: { include: { sistema: true } },
        ferramentas: { orderBy: { ordem: "asc" } },
        subitens: { orderBy: { ordem: "asc" } },
        execucoes: {
          where: { inspecaoId },
          include: {
            inspecionador: { select: { trigrama: true, nome: true } },
            subitemStatuses: {
              include: {
                subitem: { select: { id: true, letra: true, ordem: true } },
                mecanico: { select: { trigrama: true, nome: true } },
              },
              orderBy: { subitem: { ordem: "asc" } },
            },
            avisos: {
              include: {
                autor: { select: { trigrama: true, nome: true, role: true } },
                leituras: { where: { userId }, select: { lidoEm: true } },
              },
              orderBy: { criadoEm: "asc" },
            },
            defeitos: {
              include: {
                inspetor: { select: { trigrama: true, nome: true } },
              },
              orderBy: { criadoEm: "desc" },
            },
          },
        },
      },
    }),
  ])

  if (!inspecao || !cartao) notFound()

  const execucao = cartao.execucoes[0]
  const inspecaoAberta = inspecao.status === "ABERTA"
  const podeEditar = inspecaoAberta && (role === "MECANICO" || role === "ENCARREGADO" || role === "ADMIN")
  const podeAvisar = inspecaoAberta
  const podeDesassinar = inspecaoAberta && (role === "INSPETOR" || role === "ADMIN") && !!execucao?.inspecionadoEm

  const todosConcluidos = execucao
    ? execucao.subitemStatuses.every((s) => s.status === "CONCLUIDA")
    : false
  const podeInspecionar =
    inspecaoAberta &&
    (role === "INSPETOR" || role === "ADMIN") &&
    todosConcluidos &&
    !execucao?.inspecionadoEm

  const podeRegistrarDefeito =
    inspecaoAberta &&
    (role === "INSPETOR" || role === "ADMIN") &&
    !!execucao?.inspecionadoEm

  const totalSubitens = execucao?.subitemStatuses.length ?? 0
  const concluidos = execucao?.subitemStatuses.filter((s) => s.status === "CONCLUIDA").length ?? 0
  const pct = totalSubitens > 0 ? Math.round((concluidos / totalSubitens) * 100) : 0

  // Avisos não lidos pelo usuário atual
  const avisosNaoLidos = execucao?.avisos.filter((a) => a.leituras.length === 0).length ?? 0

  return (
    <div>
      {/* Breadcrumb */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.35rem",
          alignItems: "center",
          fontSize: "0.7rem",
          color: "var(--text-dim)",
          marginBottom: "1rem",
          letterSpacing: "0.04em",
        }}
      >
        <Link href="/anvs" style={{ color: "var(--text-muted)" }}>ANVs</Link>
        <span>/</span>
        <Link href={`/anvs/${inspecao.anv.matricula}`} style={{ color: "var(--text-muted)" }}>{inspecao.anv.matricula}</Link>
        <span>/</span>
        <Link href={`/inspecoes/${inspecaoId}`} style={{ color: "var(--text-muted)" }}>{fmt(inspecao.tipo)}</Link>
        <span>/</span>
        <Link href={`/inspecoes/${inspecaoId}/sistemas/${sistemaId}`} style={{ color: "var(--text-muted)" }}>
          Área {cartao.subsistema.sistema.codigo}
        </Link>
        <span>/</span>
        <Link href={`/inspecoes/${inspecaoId}/sistemas/${sistemaId}/subsistemas/${subsistemaId}`} style={{ color: "var(--text-muted)" }}>
          {cartao.subsistema.nomePt}
        </Link>
        <span>/</span>
        <span style={{ color: "var(--gold-bright)", fontFamily: "monospace", fontWeight: 700 }}>{cartao.codigo}</span>
      </div>

      {/* Header do cartão */}
      <div
        className="card-mil card-mil-gold"
        style={{ padding: "1rem", marginBottom: "1rem" }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <span
                style={{
                  fontFamily: "monospace",
                  fontWeight: 800,
                  fontSize: "1.2rem",
                  color: "var(--gold-bright)",
                  letterSpacing: "0.06em",
                }}
              >
                {cartao.codigo}
              </span>
              <span className="badge-gold">{TIPO_LABEL[cartao.tipo] ?? cartao.tipo}</span>
              {cartao.omDesignator && cartao.omDesignator !== "PAMASP" && (
                <span className="badge-yellow">{cartao.omDesignator}</span>
              )}
            </div>
            <p style={{ color: "var(--text-primary)", fontWeight: 600, margin: 0, marginBottom: 2 }}>{cartao.nomePt}</p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0 }}>{cartao.nomeEn}</p>
          </div>
        </div>

        <div style={{ height: 1, background: "var(--border-gold)", margin: "0.75rem 0", opacity: 0.4 }} />

        {/* Detalhes técnicos */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "0.5rem" }}>
          {cartao.publicacao && (
            <div>
              <span style={{ color: "var(--text-dim)", fontSize: "0.6rem", letterSpacing: "0.08em" }}>PUBLICAÇÃO</span>
              <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontFamily: "monospace", margin: 0 }}>{cartao.publicacao}</p>
            </div>
          )}
          {cartao.wp && (
            <div>
              <span style={{ color: "var(--text-dim)", fontSize: "0.6rem", letterSpacing: "0.08em" }}>WORK PACKAGE</span>
              <p style={{ color: "var(--gold)", fontSize: "0.75rem", fontFamily: "monospace", fontWeight: 700, margin: 0 }}>{cartao.wp}</p>
            </div>
          )}
          {cartao.duracaoMin && (
            <div>
              <span style={{ color: "var(--text-dim)", fontSize: "0.6rem", letterSpacing: "0.08em" }}>DURAÇÃO EST.</span>
              <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", margin: 0 }}>{fmtDur(cartao.duracaoMin)}</p>
            </div>
          )}
          {cartao.qtdRecursos && (
            <div>
              <span style={{ color: "var(--text-dim)", fontSize: "0.6rem", letterSpacing: "0.08em" }}>RECURSOS</span>
              <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", margin: 0 }}>{cartao.qtdRecursos} mec.</p>
            </div>
          )}
        </div>

        {cartao.observacao && (
          <div
            style={{
              marginTop: 10,
              padding: "0.5rem 0.75rem",
              background: "rgba(190,148,50,0.08)",
              border: "1px solid var(--border-gold)",
              borderRadius: 7,
            }}
          >
            <p style={{ color: "var(--gold-bright)", fontSize: "0.75rem", margin: 0 }}>
              ⚠ {cartao.observacao}
            </p>
          </div>
        )}

        {/* Progresso */}
        {totalSubitens > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "var(--text-dim)", fontSize: "0.65rem" }}>Progresso</span>
              <span style={{ color: pct === 100 ? "var(--green-text)" : "var(--text-muted)", fontSize: "0.65rem" }}>
                {concluidos}/{totalSubitens} · {pct}%
              </span>
            </div>
            <div className="progress-bar">
              <div
                className={`progress-bar-fill ${pct === 100 ? "done" : "partial"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Inspector sign-off status no header */}
        {execucao?.inspecionadoEm && (
          <div
            style={{
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "0.4rem 0.75rem",
              background: "rgba(39,98,58,0.2)",
              border: "1px solid rgba(74,222,128,0.3)",
              borderRadius: 7,
            }}
          >
            <span style={{ color: "var(--green-text)", fontSize: 14 }}>✔</span>
            <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
              Inspecionado por{" "}
              <span style={{ color: "var(--gold-bright)", fontFamily: "monospace", fontWeight: 700 }}>
                {execucao.inspecionador?.trigrama}
              </span>
              {" "}em {new Date(execucao.inspecionadoEm).toLocaleDateString("pt-BR")}
            </span>
          </div>
        )}
      </div>

      {/* Avisos do Encarregado/Inspetor */}
      {execucao && (
        <AvisosPanel
          execucaoId={execucao.id}
          avisos={execucao.avisos.map((a) => ({
            id: a.id,
            texto: a.texto,
            criadoEm: a.criadoEm.toISOString(),
            editadoEm: a.editadoEm?.toISOString(),
            autorId: a.autorId,
            autorTrigrama: a.autor.trigrama,
            autorNome: a.autor.nome,
            autorRole: a.autor.role,
            lido: a.leituras.length > 0,
          }))}
          podeAvisar={podeAvisar}
          avisosNaoLidos={avisosNaoLidos}
          userId={userId}
        />
      )}

      {/* Defeitos registrados pelo inspetor */}
      {execucao && (execucao.defeitos.length > 0 || podeRegistrarDefeito) && (
        <DefeitosPanel
          execucaoId={execucao.id}
          defeitos={execucao.defeitos.map((d) => ({
            id: d.id,
            descricao: d.descricao,
            criadoEm: d.criadoEm.toISOString(),
            editadoEm: d.editadoEm?.toISOString(),
            resolvidoEm: d.resolvidoEm?.toISOString(),
            inspetorId: d.inspetorId,
            inspetorTrigrama: d.inspetor.trigrama,
          }))}
          podeRegistrar={podeRegistrarDefeito}
          userId={userId}
        />
      )}

      {/* Ferramentas */}
      {cartao.ferramentas.length > 0 && (
        <div className="card-mil" style={{ padding: "0.75rem 1rem", marginBottom: "1rem" }}>
          <h3
            style={{
              fontSize: "0.6rem",
              letterSpacing: "0.14em",
              color: "var(--text-dim)",
              margin: "0 0 0.6rem",
              fontWeight: 700,
            }}
          >
            🔧 FERRAMENTAS E MATERIAIS
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {cartao.ferramentas.map((f) => (
              <div key={f.id} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ color: "var(--gold)", fontSize: "0.55rem", flexShrink: 0 }}>◆</span>
                <div>
                  <span style={{ color: "var(--text-primary)", fontSize: "0.8rem" }}>{f.nome}</span>
                  {f.especificacao && (
                    <span style={{ color: "var(--text-dim)", fontSize: "0.7rem", marginLeft: 6 }}>
                      — {f.especificacao}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subitens */}
      <h3
        style={{
          fontSize: "0.6rem",
          letterSpacing: "0.14em",
          color: "var(--text-dim)",
          margin: "0 0 0.75rem",
          fontWeight: 700,
        }}
      >
        TASK TEXT
      </h3>

      {execucao ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {execucao.subitemStatuses.map((st, idx) => (
            <SubitemCard
              key={st.id}
              statusId={st.id}
              letra={st.subitem.letra}
              showLetra={execucao.subitemStatuses.length > 1}
              descricaoPt={cartao.subitens.find((s) => s.id === st.subitemId)?.descricaoPt ?? ""}
              descricaoEn={cartao.subitens.find((s) => s.id === st.subitemId)?.descricaoEn ?? undefined}
              referencia={cartao.subitens.find((s) => s.id === st.subitemId)?.referencia ?? undefined}
              status={st.status}
              mecanicoTrigrama={st.mecanico?.trigrama}
              mecanicoNome={st.mecanico?.nome}
              dataInicio={st.dataInicio?.toISOString()}
              dataConclusao={st.dataConclusao?.toISOString()}
              observacao={st.observacao ?? undefined}
              observacaoAutorId={st.observacaoAutorId ?? undefined}
              observacaoEm={st.observacaoEm?.toISOString()}
              podeEditar={podeEditar}
              podeInspecionar={podeInspecionar && idx === execucao.subitemStatuses.length - 1}
              podeDesassinar={podeDesassinar && idx === execucao.subitemStatuses.length - 1}
              isLastSubitem={idx === execucao.subitemStatuses.length - 1}
              execucaoId={execucao.id}
              inspecionadoEm={execucao.inspecionadoEm?.toISOString()}
              inspecionadorTrigrama={execucao.inspecionador?.trigrama}
              userId={userId}
            />
          ))}
        </div>
      ) : (
        <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", textAlign: "center", padding: "2rem 0" }}>
          Este cartão não faz parte desta inspeção.
        </p>
      )}

      {role === "ADMIN" && (
        <AdminCartaoEditor
          cartaoId={cartao.id}
          wp={cartao.wp ?? null}
          ferramentas={cartao.ferramentas.map(f => ({ id: f.id, nome: f.nome, especificacao: f.especificacao ?? null }))}
        />
      )}
    </div>
  )
}

function fmt(tipo: string) {
  return tipo.replace("INSP_", "INSP-").replace("PMS_", "PMS-").replace("PMI_", "PMI-").replace(/_/g, "/")
}

function fmtDur(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`
}

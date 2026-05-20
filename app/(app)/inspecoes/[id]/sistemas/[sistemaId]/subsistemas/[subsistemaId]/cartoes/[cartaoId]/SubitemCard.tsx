"use client"

import { useState, useTransition } from "react"
import { StatusSubitem } from "@prisma/client"
import { atualizarSubitem, inspecionarCartao, salvarObservacao } from "./actions"

interface Props {
  statusId: string
  letra: string
  descricaoPt: string
  descricaoEn?: string
  referencia?: string
  status: StatusSubitem
  mecanicoTrigrama?: string
  mecanicoNome?: string
  dataInicio?: string
  dataConclusao?: string
  observacao?: string
  observacaoAutorId?: string
  observacaoEm?: string
  podeEditar: boolean
  podeInspecionar: boolean
  isLastSubitem: boolean
  execucaoId: string
  inspecionadoEm?: string
  inspecionadorTrigrama?: string
  userId: string
}

const STATUS_BG: Record<StatusSubitem, string> = {
  PENDENTE: "rgba(28,46,72,0.5)",
  INICIADA: "rgba(180,83,9,0.2)",
  CONCLUIDA: "rgba(39,98,58,0.25)",
}
const STATUS_BORDER: Record<StatusSubitem, string> = {
  PENDENTE: "var(--border)",
  INICIADA: "rgba(251,191,36,0.35)",
  CONCLUIDA: "rgba(74,222,128,0.3)",
}

export default function SubitemCard({
  statusId,
  letra,
  descricaoPt,
  descricaoEn,
  referencia,
  status: initialStatus,
  mecanicoTrigrama,
  mecanicoNome,
  dataInicio,
  dataConclusao,
  observacao: initialObservacao,
  observacaoAutorId,
  observacaoEm,
  podeEditar,
  podeInspecionar,
  isLastSubitem,
  execucaoId,
  inspecionadoEm,
  inspecionadorTrigrama,
  userId,
}: Props) {
  const [status, setStatus] = useState(initialStatus)
  const [inspecionado, setInspecionado] = useState(!!inspecionadoEm)
  const [showEn, setShowEn] = useState(false)
  const [showObsInput, setShowObsInput] = useState(false)
  const [obsText, setObsText] = useState(initialObservacao ?? "")
  const [savedObs, setSavedObs] = useState(initialObservacao ?? "")
  const [isPending, startTransition] = useTransition()
  const [isSavingObs, startObsTransition] = useTransition()

  function handleCiclo() {
    if (!podeEditar || isPending) return
    const next: StatusSubitem =
      status === "PENDENTE" ? "INICIADA" : status === "INICIADA" ? "CONCLUIDA" : "PENDENTE"
    setStatus(next)
    startTransition(async () => {
      await atualizarSubitem(statusId, next)
    })
  }

  function handleInspecionar() {
    if (!podeInspecionar || isPending || inspecionado) return
    setInspecionado(true)
    startTransition(async () => {
      await inspecionarCartao(execucaoId)
    })
  }

  function handleSalvarObs() {
    startObsTransition(async () => {
      await salvarObservacao(statusId, obsText)
      setSavedObs(obsText)
      setShowObsInput(false)
    })
  }

  return (
    <div
      style={{
        background: STATUS_BG[status],
        border: `1px solid ${STATUS_BORDER[status]}`,
        borderRadius: 10,
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
    >
      {/* Cabeçalho */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.6rem 1rem",
          borderBottom: `1px solid ${STATUS_BORDER[status]}`,
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            style={{
              fontFamily: "monospace",
              fontWeight: 800,
              fontSize: "1.1rem",
              color: status === "CONCLUIDA" ? "var(--green-text)" : status === "INICIADA" ? "var(--yellow-text)" : "var(--text-primary)",
              width: 20,
              textAlign: "center",
            }}
          >
            {letra}
          </span>

          <span
            className={
              status === "CONCLUIDA" ? "badge-green" : status === "INICIADA" ? "badge-yellow" : "badge-red"
            }
            style={{ fontSize: "0.6rem" }}
          >
            {status === "CONCLUIDA" ? "CONCLUÍDO" : status === "INICIADA" ? "EM EXECUÇÃO" : "PENDENTE"}
          </span>
        </div>

        {podeEditar && (
          <button
            onClick={handleCiclo}
            disabled={isPending}
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              padding: "4px 12px",
              borderRadius: 6,
              border: "none",
              cursor: isPending ? "not-allowed" : "pointer",
              opacity: isPending ? 0.5 : 1,
              background:
                status === "PENDENTE"
                  ? "rgba(180,83,9,0.6)"
                  : status === "INICIADA"
                  ? "rgba(39,98,58,0.7)"
                  : "var(--border)",
              color:
                status === "PENDENTE"
                  ? "var(--yellow-text)"
                  : status === "INICIADA"
                  ? "var(--green-text)"
                  : "var(--text-muted)",
              transition: "all 0.15s",
            }}
          >
            {status === "PENDENTE" ? "INICIAR" : status === "INICIADA" ? "CONCLUIR" : "REABRIR"}
          </button>
        )}
      </div>

      {/* Corpo */}
      <div style={{ padding: "0.75rem 1rem" }}>
        <p style={{ color: "var(--text-primary)", fontSize: "0.88rem", lineHeight: 1.55, margin: 0 }}>
          {descricaoPt}
        </p>

        {/* Toggle EN */}
        {descricaoEn && (
          <>
            <button
              onClick={() => setShowEn(!showEn)}
              style={{
                marginTop: 8,
                fontSize: "0.65rem",
                color: "var(--text-dim)",
                background: "none",
                border: "none",
                cursor: "pointer",
                letterSpacing: "0.05em",
              }}
            >
              {showEn ? "▲ ocultar EN" : "▼ ver em inglês"}
            </button>
            {showEn && (
              <p
                style={{
                  marginTop: 6,
                  paddingTop: 6,
                  borderTop: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  fontSize: "0.78rem",
                  lineHeight: 1.5,
                }}
              >
                {descricaoEn}
              </p>
            )}
          </>
        )}

        {/* Referência técnica */}
        {referencia && (
          <div
            style={{
              marginTop: 8,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "rgba(190,148,50,0.08)",
              border: "1px solid var(--border-gold)",
              borderRadius: 5,
              padding: "3px 8px",
            }}
          >
            <span style={{ color: "var(--gold)", fontSize: "0.6rem" }}>▶</span>
            <span
              style={{
                color: "var(--gold-bright)",
                fontSize: "0.68rem",
                fontFamily: "monospace",
                fontWeight: 600,
              }}
            >
              {referencia}
            </span>
          </div>
        )}

        {/* Meta: trigrama + datas */}
        {(mecanicoTrigrama || dataInicio) && (
          <div
            style={{
              marginTop: 10,
              paddingTop: 8,
              borderTop: "1px solid var(--border)",
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {mecanicoTrigrama && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span
                  style={{
                    background: "var(--gold-dim)",
                    border: "1px solid var(--border-gold)",
                    borderRadius: 4,
                    padding: "1px 6px",
                    fontFamily: "monospace",
                    fontWeight: 800,
                    fontSize: "0.75rem",
                    color: "var(--gold-bright)",
                    letterSpacing: "0.08em",
                  }}
                >
                  {mecanicoTrigrama}
                </span>
                <span style={{ color: "var(--text-dim)", fontSize: "0.65rem" }}>
                  {mecanicoNome}
                </span>
              </div>
            )}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {dataInicio && (
                <span style={{ color: "var(--text-dim)", fontSize: "0.65rem" }}>
                  Início: {fmtDateTime(dataInicio)}
                </span>
              )}
              {dataConclusao && (
                <span style={{ color: "var(--green-text)", fontSize: "0.65rem" }}>
                  Conclusão: {fmtDateTime(dataConclusao)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Observação do mecânico */}
        <div style={{ marginTop: 10 }}>
          {savedObs && !showObsInput && (
            <div
              style={{
                padding: "0.5rem 0.75rem",
                background: "rgba(14,36,64,0.6)",
                border: "1px solid rgba(90,120,160,0.3)",
                borderRadius: 7,
                marginBottom: 4,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ color: "var(--text-dim)", fontSize: "0.58rem", letterSpacing: "0.1em" }}>
                      OBS. MECÂNICO
                    </span>
                    {observacaoEm && (
                      <span style={{ color: "var(--text-dim)", fontSize: "0.58rem" }}>
                        · {fmtDateTime(observacaoEm)}
                      </span>
                    )}
                  </div>
                  <p style={{ color: "var(--text-primary)", fontSize: "0.78rem", margin: 0, lineHeight: 1.5 }}>
                    {savedObs}
                  </p>
                </div>
                {/* Só o autor pode editar/deletar */}
                {podeEditar && userId === observacaoAutorId && (
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => { setObsText(savedObs); setShowObsInput(true) }}
                      style={{ fontSize: "0.6rem", color: "var(--text-dim)", background: "none", border: "none", cursor: "pointer" }}
                    >
                      editar
                    </button>
                    <button
                      onClick={() => {
                        setObsText("")
                        setSavedObs("")
                        startObsTransition(async () => { await salvarObservacao(statusId, "") })
                      }}
                      style={{ fontSize: "0.6rem", color: "rgba(220,80,80,0.7)", background: "none", border: "none", cursor: "pointer" }}
                    >
                      excluir
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pode adicionar se: podeEditar E (sem obs OU é o autor) */}
          {podeEditar && !showObsInput && !savedObs && (
            <button
              onClick={() => setShowObsInput(true)}
              style={{
                fontSize: "0.65rem",
                color: "var(--text-dim)",
                background: "none",
                border: "1px dashed var(--border)",
                borderRadius: 6,
                padding: "4px 10px",
                cursor: "pointer",
                letterSpacing: "0.05em",
                width: "100%",
              }}
            >
              + adicionar observação (pane, substituição...)
            </button>
          )}

          {showObsInput && (
            <div>
              <textarea
                value={obsText}
                onChange={(e) => setObsText(e.target.value)}
                rows={3}
                placeholder="Descreva a pane encontrada, substituição realizada, etc..."
                style={{
                  width: "100%",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border)",
                  borderRadius: 7,
                  color: "var(--text-primary)",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.8rem",
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <button
                  onClick={handleSalvarObs}
                  disabled={isSavingObs}
                  className="btn-primary"
                  style={{ flex: 1, fontSize: "0.68rem", padding: "5px" }}
                >
                  {isSavingObs ? "Salvando..." : "Salvar"}
                </button>
                <button
                  onClick={() => { setObsText(savedObs); setShowObsInput(false) }}
                  className="btn-ghost"
                  style={{ fontSize: "0.68rem", padding: "5px 12px" }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sign-off do inspetor — só aparece no último subitem */}
        {isLastSubitem && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 10,
              borderTop: "1px solid var(--border-gold)",
            }}
          >
            {inspecionado || inspecionadoEm ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "var(--green-text)", fontSize: "0.75rem" }}>✔</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>
                  Inspecionado por{" "}
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 700,
                      color: "var(--gold-bright)",
                    }}
                  >
                    {inspecionadorTrigrama}
                  </span>
                  {inspecionadoEm && (
                    <span style={{ color: "var(--text-dim)" }}>
                      {" "}· {fmtDateTime(inspecionadoEm)}
                    </span>
                  )}
                </span>
              </div>
            ) : podeInspecionar ? (
              <button
                onClick={handleInspecionar}
                disabled={isPending}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: 7,
                  border: "1px solid var(--border-gold)",
                  background: "var(--gold-dim)",
                  color: "var(--gold-bright)",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  letterSpacing: "0.12em",
                  cursor: isPending ? "not-allowed" : "pointer",
                  opacity: isPending ? 0.5 : 1,
                  transition: "all 0.15s",
                }}
              >
                ✦ ASSINAR — CARTÃO INSPECIONADO
              </button>
            ) : (
              <p
                style={{
                  color: "var(--text-dim)",
                  fontSize: "0.65rem",
                  letterSpacing: "0.06em",
                  textAlign: "center",
                }}
              >
                Aguardando assinatura do inspetor
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

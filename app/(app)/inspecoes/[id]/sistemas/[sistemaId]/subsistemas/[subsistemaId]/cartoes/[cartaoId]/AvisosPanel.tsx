"use client"

import { useState, useTransition, useEffect } from "react"
import { enviarAviso, marcarAvisosLidos, editarAviso, deletarAviso } from "./actions"

interface Aviso {
  id: string
  texto: string
  criadoEm: string
  editadoEm?: string
  autorId: string
  autorTrigrama: string
  autorNome: string
  autorRole: string
  lido: boolean
}

interface Props {
  execucaoId: string
  avisos: Aviso[]
  podeAvisar: boolean
  avisosNaoLidos: number
  userId: string
}

const ROLE_LABEL: Record<string, string> = {
  ENCARREGADO: "ENC",
  INSPETOR: "INSP",
  ADMIN: "ADM",
}

export default function AvisosPanel({ execucaoId, avisos: initialAvisos, podeAvisar, avisosNaoLidos, userId }: Props) {
  const [avisos, setAvisos] = useState(initialAvisos)
  const [expanded, setExpanded] = useState(avisosNaoLidos > 0)
  const [showForm, setShowForm] = useState(false)
  const [texto, setTexto] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [isPending, startTransition] = useTransition()
  const [isEditPending, startEditTransition] = useTransition()
  const [marked, setMarked] = useState(false)

  useEffect(() => {
    if (expanded && avisosNaoLidos > 0 && !marked) {
      setMarked(true)
      marcarAvisosLidos(execucaoId).catch(() => {})
      setAvisos((prev) => prev.map((a) => ({ ...a, lido: true })))
    }
  }, [expanded, avisosNaoLidos, marked, execucaoId])

  function handleEnviar() {
    if (!texto.trim()) return
    startTransition(async () => {
      await enviarAviso(execucaoId, texto)
      setTexto("")
      setShowForm(false)
      // optimistic add — refresh would be ideal but we keep it simple
    })
  }

  function handleEditar(aviso: Aviso) {
    setEditingId(aviso.id)
    setEditText(aviso.texto)
  }

  function handleSalvarEdicao(avisoId: string) {
    if (!editText.trim()) return
    startEditTransition(async () => {
      await editarAviso(avisoId, editText)
      setAvisos((prev) =>
        prev.map((a) =>
          a.id === avisoId ? { ...a, texto: editText, editadoEm: new Date().toISOString() } : a
        )
      )
      setEditingId(null)
    })
  }

  function handleDeletar(avisoId: string) {
    startEditTransition(async () => {
      await deletarAviso(avisoId)
      setAvisos((prev) => prev.filter((a) => a.id !== avisoId))
    })
  }

  const naoLidos = avisos.filter((a) => !a.lido).length

  if (avisos.length === 0 && !podeAvisar) return null

  return (
    <div className="card-mil" style={{ marginBottom: "1rem", overflow: "hidden" }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%",
          padding: "0.6rem 1rem",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "0.6rem", letterSpacing: "0.14em", color: "var(--text-dim)", fontWeight: 700 }}>
            AVISOS DO ENCARREGADO / INSPETOR
          </span>
          {naoLidos > 0 && (
            <span
              style={{
                background: "rgba(251,191,36,0.2)",
                border: "1px solid rgba(251,191,36,0.5)",
                color: "var(--yellow-text)",
                fontSize: "0.58rem",
                fontWeight: 800,
                padding: "1px 6px",
                borderRadius: 10,
              }}
            >
              {naoLidos} novo{naoLidos > 1 ? "s" : ""}
            </span>
          )}
          {avisos.length > 0 && naoLidos === 0 && (
            <span style={{ color: "var(--text-dim)", fontSize: "0.6rem" }}>
              {avisos.length} aviso{avisos.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <span style={{ color: "var(--text-dim)", fontSize: "0.7rem" }}>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "0.75rem 1rem" }}>
          {avisos.length === 0 && (
            <p style={{ color: "var(--text-dim)", fontSize: "0.75rem", margin: "0 0 0.75rem" }}>
              Nenhum aviso registrado.
            </p>
          )}

          {avisos.map((aviso) => (
            <div
              key={aviso.id}
              style={{
                padding: "0.5rem 0.75rem",
                background: aviso.lido ? "rgba(14,36,64,0.4)" : "rgba(180,83,9,0.15)",
                border: `1px solid ${aviso.lido ? "var(--border)" : "rgba(251,191,36,0.4)"}`,
                borderRadius: 7,
                marginBottom: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 800,
                      fontSize: "0.72rem",
                      color: "var(--gold-bright)",
                      background: "var(--gold-dim)",
                      border: "1px solid var(--border-gold)",
                      borderRadius: 4,
                      padding: "0px 5px",
                    }}
                  >
                    {aviso.autorTrigrama}
                  </span>
                  <span style={{ color: "var(--text-dim)", fontSize: "0.6rem" }}>
                    {ROLE_LABEL[aviso.autorRole] ?? aviso.autorRole}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ color: "var(--text-dim)", fontSize: "0.6rem", display: "block" }}>
                      {fmtDateTime(aviso.criadoEm)}
                    </span>
                    {aviso.editadoEm && (
                      <span style={{ color: "var(--text-dim)", fontSize: "0.55rem" }}>
                        (editado {fmtDateTime(aviso.editadoEm)})
                      </span>
                    )}
                  </div>
                  {aviso.autorId === userId && (
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        onClick={() => handleEditar(aviso)}
                        disabled={isEditPending}
                        style={{ fontSize: "0.6rem", color: "var(--text-dim)", background: "none", border: "none", cursor: "pointer" }}
                      >
                        editar
                      </button>
                      <button
                        onClick={() => handleDeletar(aviso.id)}
                        disabled={isEditPending}
                        style={{ fontSize: "0.6rem", color: "rgba(220,80,80,0.7)", background: "none", border: "none", cursor: "pointer" }}
                      >
                        excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {editingId === aviso.id ? (
                <div>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
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
                      onClick={() => handleSalvarEdicao(aviso.id)}
                      disabled={isEditPending}
                      className="btn-primary"
                      style={{ flex: 1, fontSize: "0.68rem", padding: "4px" }}
                    >
                      {isEditPending ? "Salvando..." : "Salvar"}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="btn-ghost"
                      style={{ fontSize: "0.68rem", padding: "4px 10px" }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ color: "var(--text-primary)", fontSize: "0.8rem", margin: 0, lineHeight: 1.5 }}>
                  {aviso.texto}
                </p>
              )}
            </div>
          ))}

          {podeAvisar && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              style={{
                width: "100%",
                fontSize: "0.65rem",
                color: "var(--gold-bright)",
                background: "none",
                border: "1px dashed var(--border-gold)",
                borderRadius: 6,
                padding: "5px",
                cursor: "pointer",
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              + novo aviso para o mecânico
            </button>
          )}

          {showForm && (
            <div>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={3}
                placeholder="Digite o aviso, instrução ou alerta para o mecânico..."
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
                  onClick={handleEnviar}
                  disabled={isPending || !texto.trim()}
                  className="btn-primary"
                  style={{ flex: 1, fontSize: "0.68rem", padding: "5px" }}
                >
                  {isPending ? "Enviando..." : "Enviar Aviso"}
                </button>
                <button
                  onClick={() => { setTexto(""); setShowForm(false) }}
                  className="btn-ghost"
                  style={{ fontSize: "0.68rem", padding: "5px 12px" }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
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

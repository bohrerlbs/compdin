"use client"

import { useState, useTransition } from "react"
import { registrarDefeito, editarDefeito, deletarDefeito } from "./actions"
import { useRouter } from "next/navigation"

interface Defeito {
  id: string
  descricao: string
  criadoEm: string
  editadoEm?: string
  resolvidoEm?: string
  inspetorId: string
  inspetorTrigrama: string
}

interface Props {
  execucaoId: string
  defeitos: Defeito[]
  podeRegistrar: boolean
  userId: string
}

export default function DefeitosPanel({ execucaoId, defeitos: initialDefeitos, podeRegistrar, userId }: Props) {
  const [defeitos, setDefeitos] = useState(initialDefeitos)
  const [showForm, setShowForm] = useState(false)
  const [descricao, setDescricao] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [isPending, startTransition] = useTransition()
  const [isEditPending, startEditTransition] = useTransition()
  const router = useRouter()

  function handleRegistrar() {
    if (!descricao.trim()) return
    startTransition(async () => {
      await registrarDefeito(execucaoId, descricao)
      setDescricao("")
      setShowForm(false)
      router.refresh()
    })
  }

  function handleEditar(defeito: Defeito) {
    setEditingId(defeito.id)
    setEditText(defeito.descricao)
  }

  function handleSalvarEdicao(defeitoId: string) {
    if (!editText.trim()) return
    startEditTransition(async () => {
      await editarDefeito(defeitoId, editText)
      setDefeitos((prev) =>
        prev.map((d) =>
          d.id === defeitoId ? { ...d, descricao: editText, editadoEm: new Date().toISOString() } : d
        )
      )
      setEditingId(null)
    })
  }

  function handleDeletar(defeitoId: string) {
    startEditTransition(async () => {
      await deletarDefeito(defeitoId)
      setDefeitos((prev) => prev.filter((d) => d.id !== defeitoId))
    })
  }

  if (defeitos.length === 0 && !podeRegistrar) return null

  return (
    <div
      style={{
        background: "rgba(100,20,20,0.2)",
        border: "1px solid rgba(220,80,80,0.3)",
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: "1rem",
      }}
    >
      <div style={{ padding: "0.6rem 1rem", borderBottom: "1px solid rgba(220,80,80,0.2)" }}>
        <span style={{ fontSize: "0.6rem", letterSpacing: "0.14em", color: "rgba(255,120,120,0.8)", fontWeight: 700 }}>
          ⚠ DEFEITOS / REINSPEÇÃO NECESSÁRIA
        </span>
      </div>

      <div style={{ padding: "0.75rem 1rem" }}>
        {defeitos.map((d) => (
          <div
            key={d.id}
            style={{
              padding: "0.5rem 0.75rem",
              background: "rgba(100,20,20,0.3)",
              border: "1px solid rgba(220,80,80,0.2)",
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
                    color: "rgba(255,160,160,1)",
                    background: "rgba(100,20,20,0.5)",
                    border: "1px solid rgba(220,80,80,0.4)",
                    borderRadius: 4,
                    padding: "0px 5px",
                  }}
                >
                  {d.inspetorTrigrama}
                </span>
                <span style={{ color: "rgba(255,120,120,0.6)", fontSize: "0.6rem" }}>INSPETOR</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ textAlign: "right" }}>
                  <span style={{ color: "rgba(255,120,120,0.5)", fontSize: "0.6rem", display: "block" }}>
                    {fmtDateTime(d.criadoEm)}
                  </span>
                  {d.editadoEm && (
                    <span style={{ color: "rgba(255,120,120,0.4)", fontSize: "0.55rem" }}>
                      (editado {fmtDateTime(d.editadoEm)})
                    </span>
                  )}
                </div>
                {d.inspetorId === userId && (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => handleEditar(d)}
                      disabled={isEditPending}
                      style={{ fontSize: "0.6rem", color: "rgba(255,160,160,0.6)", background: "none", border: "none", cursor: "pointer" }}
                    >
                      editar
                    </button>
                    <button
                      onClick={() => handleDeletar(d.id)}
                      disabled={isEditPending}
                      style={{ fontSize: "0.6rem", color: "rgba(220,80,80,0.7)", background: "none", border: "none", cursor: "pointer" }}
                    >
                      excluir
                    </button>
                  </div>
                )}
              </div>
            </div>

            {editingId === d.id ? (
              <div>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    background: "rgba(50,10,10,0.5)",
                    border: "1px solid rgba(220,80,80,0.3)",
                    borderRadius: 7,
                    color: "rgba(255,200,200,0.9)",
                    padding: "0.5rem 0.75rem",
                    fontSize: "0.8rem",
                    resize: "vertical",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <button
                    onClick={() => handleSalvarEdicao(d.id)}
                    disabled={isEditPending}
                    style={{
                      flex: 1,
                      fontSize: "0.68rem",
                      padding: "4px",
                      borderRadius: 6,
                      border: "1px solid rgba(220,80,80,0.4)",
                      background: "rgba(180,30,30,0.3)",
                      color: "rgba(255,180,180,0.9)",
                      fontWeight: 700,
                      cursor: isEditPending ? "not-allowed" : "pointer",
                      opacity: isEditPending ? 0.5 : 1,
                    }}
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
              <>
                <p style={{ color: "rgba(255,200,200,0.9)", fontSize: "0.8rem", margin: 0, lineHeight: 1.5 }}>
                  {d.descricao}
                </p>
                {d.resolvidoEm && (
                  <p style={{ color: "rgba(100,220,100,0.7)", fontSize: "0.65rem", margin: "4px 0 0" }}>
                    Resolvido em {fmtDateTime(d.resolvidoEm)}
                  </p>
                )}
              </>
            )}
          </div>
        ))}

        {defeitos.length === 0 && (
          <p style={{ color: "rgba(255,120,120,0.6)", fontSize: "0.75rem", margin: "0 0 0.75rem" }}>
            Nenhum defeito registrado ainda.
          </p>
        )}

        {podeRegistrar && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              width: "100%",
              fontSize: "0.65rem",
              color: "rgba(255,160,160,0.9)",
              background: "none",
              border: "1px dashed rgba(220,80,80,0.4)",
              borderRadius: 6,
              padding: "5px",
              cursor: "pointer",
              letterSpacing: "0.08em",
              fontWeight: 600,
            }}
          >
            ⚠ registrar defeito e reabrir cartão
          </button>
        )}

        {showForm && (
          <div>
            <p style={{ color: "rgba(255,160,160,0.8)", fontSize: "0.72rem", margin: "0 0 8px" }}>
              Ao registrar o defeito, o cartão será reaberto e o mecânico deve corrigir e refechar para nova inspeção.
            </p>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              placeholder="Descreva o defeito encontrado durante a inspeção..."
              style={{
                width: "100%",
                background: "rgba(50,10,10,0.5)",
                border: "1px solid rgba(220,80,80,0.3)",
                borderRadius: 7,
                color: "rgba(255,200,200,0.9)",
                padding: "0.5rem 0.75rem",
                fontSize: "0.8rem",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button
                onClick={handleRegistrar}
                disabled={isPending || !descricao.trim()}
                style={{
                  flex: 1,
                  fontSize: "0.68rem",
                  padding: "5px",
                  borderRadius: 6,
                  border: "1px solid rgba(220,80,80,0.5)",
                  background: "rgba(180,30,30,0.4)",
                  color: "rgba(255,180,180,0.9)",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  cursor: isPending ? "not-allowed" : "pointer",
                  opacity: isPending ? 0.5 : 1,
                }}
              >
                {isPending ? "Registrando..." : "Confirmar e Reabrir"}
              </button>
              <button
                onClick={() => { setDescricao(""); setShowForm(false) }}
                className="btn-ghost"
                style={{ fontSize: "0.68rem", padding: "5px 12px" }}
              >
                Cancelar
              </button>
            </div>
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

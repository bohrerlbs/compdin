"use client"

import { useState } from "react"
import { criarAvisoGeral, editarAvisoGeral, deletarAvisoGeral } from "./actions"

interface Aviso {
  id: string
  titulo: string
  corpo: string
  criadoEm: Date
  editadoEm: Date | null
  expiresAt: Date | null
  autorId: string
  autor: { trigrama: string; nome: string }
}

interface Props {
  avisos: Aviso[]
  userId: string
  userRole: string
}

const PRIVILEGED = ["ADMIN", "ENCARREGADO", "INSPETOR"]

function fmtData(d: Date) {
  const dt = new Date(d)
  return `${dt.getDate().toString().padStart(2, "0")}/${(dt.getMonth() + 1).toString().padStart(2, "0")} ${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`
}

const inp: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  color: "var(--text-primary)",
  padding: "0.4rem 0.6rem",
  fontSize: "0.78rem",
  outline: "none",
  boxSizing: "border-box",
}

export default function AvisosPanel({ avisos: initial, userId, userRole }: Props) {
  const [avisos, setAvisos] = useState(initial)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [err, setErr] = useState("")

  // Create form state
  const [titulo, setTitulo] = useState("")
  const [corpo, setCorpo] = useState("")
  const [expires, setExpires] = useState("")
  const [saving, setSaving] = useState(false)

  // Edit form state
  const [editTitulo, setEditTitulo] = useState("")
  const [editCorpo, setEditCorpo] = useState("")
  const [editExpires, setEditExpires] = useState("")
  const [editSaving, setEditSaving] = useState(false)

  const canModify = (aviso: Aviso) =>
    aviso.autorId === userId || PRIVILEGED.includes(userRole)

  async function handleCriar() {
    if (!titulo.trim() || !corpo.trim()) { setErr("Preencha título e mensagem."); return }
    setSaving(true); setErr("")
    const res = await criarAvisoGeral(titulo, corpo, expires || undefined)
    setSaving(false)
    if (res.error) { setErr(res.error); return }
    // Optimistic: reload from server (revalidatePath triggers re-render)
    setTitulo(""); setCorpo(""); setExpires(""); setOpen(false)
    window.location.reload()
  }

  function startEdit(aviso: Aviso) {
    setEditingId(aviso.id)
    setEditTitulo(aviso.titulo)
    setEditCorpo(aviso.corpo)
    setEditExpires(aviso.expiresAt ? new Date(aviso.expiresAt).toISOString().slice(0, 10) : "")
    setErr("")
  }

  async function handleEditar(id: string) {
    if (!editTitulo.trim() || !editCorpo.trim()) { setErr("Preencha título e mensagem."); return }
    setEditSaving(true); setErr("")
    const res = await editarAvisoGeral(id, editTitulo, editCorpo, editExpires || undefined)
    setEditSaving(false)
    if (res.error) { setErr(res.error); return }
    setEditingId(null)
    window.location.reload()
  }

  async function handleDeletar(id: string) {
    const res = await deletarAvisoGeral(id)
    if (res.error) { setErr(res.error); return }
    setAvisos((prev) => prev.filter((a) => a.id !== id))
    setConfirmDelete(null)
  }

  return (
    <div className="card-mil card-mil-gold" style={{ padding: "0.85rem 1rem", marginBottom: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: avisos.length > 0 || open ? "0.75rem" : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "var(--gold-bright)", fontSize: "0.6rem", letterSpacing: "0.12em", fontWeight: 700 }}>
            AVISOS GERAIS
          </span>
          {avisos.length > 0 && (
            <span style={{
              background: "var(--gold-dim)",
              border: "1px solid var(--border-gold)",
              color: "var(--gold-bright)",
              borderRadius: 9999,
              fontSize: "0.58rem",
              fontWeight: 700,
              padding: "1px 6px",
            }}>
              {avisos.length}
            </span>
          )}
        </div>
        <button
          onClick={() => { setOpen(!open); setErr("") }}
          style={{
            fontSize: "0.62rem",
            color: "var(--gold)",
            background: "none",
            border: "none",
            cursor: "pointer",
            letterSpacing: "0.06em",
          }}
        >
          {open ? "cancelar" : "+ novo aviso"}
        </button>
      </div>

      {/* Create form */}
      {open && (
        <div style={{ marginBottom: "0.85rem", padding: "0.75rem", background: "var(--bg-input)", borderRadius: 8, border: "1px solid var(--border)" }}>
          <div style={{ marginBottom: 6 }}>
            <label style={{ color: "var(--text-dim)", fontSize: "0.56rem", letterSpacing: "0.08em", display: "block", marginBottom: 2 }}>TÍTULO</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} style={inp} placeholder="Título do aviso" maxLength={120} />
          </div>
          <div style={{ marginBottom: 6 }}>
            <label style={{ color: "var(--text-dim)", fontSize: "0.56rem", letterSpacing: "0.08em", display: "block", marginBottom: 2 }}>MENSAGEM</label>
            <textarea
              value={corpo}
              onChange={e => setCorpo(e.target.value)}
              style={{ ...inp, minHeight: 72, resize: "vertical" }}
              placeholder="Mensagem do aviso..."
              maxLength={1000}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ color: "var(--text-dim)", fontSize: "0.56rem", letterSpacing: "0.08em", display: "block", marginBottom: 2 }}>VALIDADE (opcional)</label>
            <input type="date" value={expires} onChange={e => setExpires(e.target.value)} style={inp} />
          </div>
          {err && <p style={{ color: "var(--red-text)", fontSize: "0.7rem", marginBottom: 6 }}>{err}</p>}
          <button
            onClick={handleCriar}
            disabled={saving}
            className="btn-primary"
            style={{ width: "100%", fontSize: "0.72rem", padding: "6px" }}
          >
            {saving ? "Publicando..." : "Publicar Aviso"}
          </button>
        </div>
      )}

      {/* Avisos list */}
      {avisos.length === 0 && !open && (
        <p style={{ color: "var(--text-dim)", fontSize: "0.7rem", textAlign: "center", padding: "0.5rem 0" }}>
          Nenhum aviso ativo.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {avisos.map((aviso) => (
          <div key={aviso.id}>
            {editingId === aviso.id ? (
              <div style={{ padding: "0.75rem", background: "var(--bg-input)", borderRadius: 8, border: "1px solid var(--border-gold)" }}>
                <div style={{ marginBottom: 6 }}>
                  <label style={{ color: "var(--text-dim)", fontSize: "0.56rem", letterSpacing: "0.08em", display: "block", marginBottom: 2 }}>TÍTULO</label>
                  <input value={editTitulo} onChange={e => setEditTitulo(e.target.value)} style={inp} maxLength={120} />
                </div>
                <div style={{ marginBottom: 6 }}>
                  <label style={{ color: "var(--text-dim)", fontSize: "0.56rem", letterSpacing: "0.08em", display: "block", marginBottom: 2 }}>MENSAGEM</label>
                  <textarea
                    value={editCorpo}
                    onChange={e => setEditCorpo(e.target.value)}
                    style={{ ...inp, minHeight: 64, resize: "vertical" }}
                    maxLength={1000}
                  />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ color: "var(--text-dim)", fontSize: "0.56rem", letterSpacing: "0.08em", display: "block", marginBottom: 2 }}>VALIDADE (opcional)</label>
                  <input type="date" value={editExpires} onChange={e => setEditExpires(e.target.value)} style={inp} />
                </div>
                {err && <p style={{ color: "var(--red-text)", fontSize: "0.7rem", marginBottom: 6 }}>{err}</p>}
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => handleEditar(aviso.id)}
                    disabled={editSaving}
                    className="btn-primary"
                    style={{ flex: 1, fontSize: "0.7rem", padding: "5px" }}
                  >
                    {editSaving ? "Salvando..." : "Salvar"}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    style={{ fontSize: "0.7rem", padding: "5px 12px", background: "none", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-muted)", cursor: "pointer" }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : confirmDelete === aviso.id ? (
              <div style={{ padding: "0.6rem 0.75rem", background: "rgba(127,29,29,0.2)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8 }}>
                <p style={{ color: "var(--red-text)", fontSize: "0.72rem", marginBottom: 8 }}>
                  Excluir &quot;{aviso.titulo}&quot;?
                </p>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => handleDeletar(aviso.id)}
                    style={{ fontSize: "0.7rem", padding: "4px 12px", background: "rgba(127,29,29,0.5)", border: "1px solid rgba(248,113,113,0.4)", borderRadius: 6, color: "var(--red-text)", cursor: "pointer" }}
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    style={{ fontSize: "0.7rem", padding: "4px 12px", background: "none", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-muted)", cursor: "pointer" }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                padding: "0.6rem 0.75rem",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "var(--gold-bright)", fontWeight: 700, fontSize: "0.8rem", marginBottom: 2 }}>
                      {aviso.titulo}
                    </p>
                    <p style={{ color: "var(--text-primary)", fontSize: "0.75rem", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                      {aviso.corpo}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <span style={{ color: "var(--text-dim)", fontSize: "0.58rem", fontFamily: "monospace", fontWeight: 700 }}>
                        {aviso.autor.trigrama}
                      </span>
                      <span style={{ color: "var(--text-dim)", fontSize: "0.58rem" }}>
                        {fmtData(aviso.criadoEm)}
                      </span>
                      {aviso.editadoEm && (
                        <span style={{ color: "var(--text-dim)", fontSize: "0.56rem", fontStyle: "italic" }}>editado</span>
                      )}
                      {aviso.expiresAt && (
                        <span style={{ color: "var(--yellow-text)", fontSize: "0.56rem" }}>
                          até {fmtData(aviso.expiresAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  {canModify(aviso) && (
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button
                        onClick={() => startEdit(aviso)}
                        style={{ fontSize: "0.6rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}
                      >
                        editar
                      </button>
                      <button
                        onClick={() => setConfirmDelete(aviso.id)}
                        style={{ fontSize: "0.6rem", color: "rgba(220,80,80,0.7)", background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}
                      >
                        excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

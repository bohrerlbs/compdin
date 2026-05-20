"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { atualizarWp, criarFerramenta, atualizarFerramenta, deletarFerramenta } from "./actions"

interface Ferramenta {
  id: string
  nome: string
  especificacao: string | null
}

interface Props {
  cartaoId: string
  wp: string | null
  ferramentas: Ferramenta[]
}

const inp: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  color: "var(--text-primary)",
  padding: "0.4rem 0.6rem",
  fontSize: "0.8rem",
  outline: "none",
  boxSizing: "border-box",
}

export default function AdminCartaoEditor({ cartaoId, wp: initWp, ferramentas: initFerr }: Props) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)

  // WP
  const [editingWp, setEditingWp] = useState(false)
  const [wpText, setWpText] = useState(initWp ?? "")
  const [erroWp, setErroWp] = useState("")
  const [pendingWp, startWp] = useTransition()

  // Ferramentas
  const [ferrs, setFerrs] = useState(initFerr)
  const [editId, setEditId] = useState<string | null>(null)
  const [editNome, setEditNome] = useState("")
  const [editSpec, setEditSpec] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [addNome, setAddNome] = useState("")
  const [addSpec, setAddSpec] = useState("")
  const [erroFerr, setErroFerr] = useState("")
  const [pendingFerr, startFerr] = useTransition()

  function salvarWp() {
    setErroWp("")
    startWp(async () => {
      const r = await atualizarWp(cartaoId, wpText)
      if (r.error) { setErroWp(r.error) } else { setEditingWp(false); router.refresh() }
    })
  }

  function iniciarEditFerr(f: Ferramenta) {
    setEditId(f.id); setEditNome(f.nome); setEditSpec(f.especificacao ?? ""); setErroFerr("")
  }

  function salvarFerr(id: string) {
    setErroFerr("")
    startFerr(async () => {
      const r = await atualizarFerramenta(id, editNome, editSpec)
      if (r.error) { setErroFerr(r.error) } else {
        setFerrs(p => p.map(f => f.id === id ? { ...f, nome: editNome, especificacao: editSpec || null } : f))
        setEditId(null)
      }
    })
  }

  function excluirFerr(id: string) {
    startFerr(async () => {
      const r = await deletarFerramenta(id)
      if (!r.error) setFerrs(p => p.filter(f => f.id !== id))
    })
  }

  function adicionarFerr() {
    setErroFerr("")
    startFerr(async () => {
      const r = await criarFerramenta(cartaoId, addNome, addSpec)
      if (r.error) { setErroFerr(r.error) } else {
        setAddNome(""); setAddSpec(""); setShowAdd(false); router.refresh()
      }
    })
  }

  return (
    <div style={{ marginTop: "1rem", border: "1px solid rgba(190,148,50,0.25)", borderRadius: 10, overflow: "hidden" }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%", padding: "0.6rem 1rem", background: "rgba(190,148,50,0.06)",
          border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: "0.58rem", letterSpacing: "0.14em", color: "var(--gold)", fontWeight: 700 }}>
          ADMIN — EDITAR CARTÃO
        </span>
        <span style={{ color: "var(--text-dim)", fontSize: "0.7rem" }}>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--border)" }}>
          {/* WP */}
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "var(--text-dim)", fontSize: "0.6rem", letterSpacing: "0.1em", fontWeight: 700 }}>WORK PACKAGE</span>
              {!editingWp && (
                <button onClick={() => { setEditingWp(true); setErroWp("") }}
                  style={{ fontSize: "0.6rem", color: "var(--gold)", background: "none", border: "none", cursor: "pointer" }}>
                  editar
                </button>
              )}
            </div>
            {editingWp ? (
              <div>
                <input value={wpText} onChange={e => setWpText(e.target.value)} placeholder="ex: WP-1234.56"
                  style={{ ...inp, fontFamily: "monospace", fontWeight: 700, borderColor: "var(--border-gold)" }} />
                {erroWp && <p style={{ color: "var(--red-text)", fontSize: "0.7rem", margin: "3px 0 0" }}>{erroWp}</p>}
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <button onClick={salvarWp} disabled={pendingWp} className="btn-primary" style={{ flex: 1, fontSize: "0.68rem", padding: "4px" }}>
                    {pendingWp ? "..." : "Salvar"}
                  </button>
                  <button onClick={() => { setEditingWp(false); setWpText(initWp ?? "") }} className="btn-ghost" style={{ fontSize: "0.68rem", padding: "4px 10px" }}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ color: wpText ? "var(--gold)" : "var(--text-dim)", fontFamily: "monospace", fontWeight: 700, fontSize: "0.85rem", margin: 0 }}>
                {wpText || "— não definido —"}
              </p>
            )}
          </div>

          <div style={{ height: 1, background: "var(--border)", margin: "0.75rem 0" }} />

          {/* Ferramentas */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "var(--text-dim)", fontSize: "0.6rem", letterSpacing: "0.1em", fontWeight: 700 }}>FERRAMENTAS E MATERIAIS</span>
              {!showAdd && (
                <button onClick={() => { setShowAdd(true); setErroFerr("") }}
                  style={{ fontSize: "0.6rem", color: "var(--gold)", background: "none", border: "none", cursor: "pointer" }}>
                  + adicionar
                </button>
              )}
            </div>

            {ferrs.length === 0 && !showAdd && (
              <p style={{ color: "var(--text-dim)", fontSize: "0.75rem", margin: "0 0 0.5rem" }}>Nenhuma ferramenta.</p>
            )}

            {ferrs.map(f => (
              <div key={f.id} style={{ marginBottom: 6, padding: "0.45rem 0.7rem", background: "rgba(0,0,0,0.2)", borderRadius: 6, border: "1px solid var(--border)" }}>
                {editId === f.id ? (
                  <div>
                    <input value={editNome} onChange={e => setEditNome(e.target.value)} placeholder="Nome *" style={{ ...inp, marginBottom: 4 }} />
                    <input value={editSpec} onChange={e => setEditSpec(e.target.value)} placeholder="Especificação (opcional)" style={{ ...inp, fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4 }} />
                    {erroFerr && <p style={{ color: "var(--red-text)", fontSize: "0.7rem" }}>{erroFerr}</p>}
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => salvarFerr(f.id)} disabled={pendingFerr} className="btn-primary" style={{ flex: 1, fontSize: "0.65rem", padding: "3px" }}>
                        {pendingFerr ? "..." : "Salvar"}
                      </button>
                      <button onClick={() => setEditId(null)} className="btn-ghost" style={{ fontSize: "0.65rem", padding: "3px 8px" }}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <span style={{ color: "var(--text-primary)", fontSize: "0.8rem" }}>{f.nome}</span>
                      {f.especificacao && <span style={{ color: "var(--text-dim)", fontSize: "0.7rem", marginLeft: 6 }}>— {f.especificacao}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => iniciarEditFerr(f)} style={{ fontSize: "0.6rem", color: "var(--text-dim)", background: "none", border: "none", cursor: "pointer" }}>editar</button>
                      <button onClick={() => excluirFerr(f.id)} disabled={pendingFerr} style={{ fontSize: "0.6rem", color: "rgba(220,80,80,0.7)", background: "none", border: "none", cursor: "pointer" }}>excluir</button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {showAdd && (
              <div style={{ padding: "0.5rem 0.7rem", background: "rgba(190,148,50,0.05)", border: "1px dashed var(--border-gold)", borderRadius: 6 }}>
                <input value={addNome} onChange={e => setAddNome(e.target.value)} placeholder="Nome da ferramenta *" style={{ ...inp, marginBottom: 4 }} />
                <input value={addSpec} onChange={e => setAddSpec(e.target.value)} placeholder="Especificação (opcional)" style={{ ...inp, fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4 }} />
                {erroFerr && <p style={{ color: "var(--red-text)", fontSize: "0.7rem" }}>{erroFerr}</p>}
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={adicionarFerr} disabled={pendingFerr || !addNome.trim()} className="btn-primary" style={{ flex: 1, fontSize: "0.65rem", padding: "3px" }}>
                    {pendingFerr ? "..." : "Adicionar"}
                  </button>
                  <button onClick={() => { setShowAdd(false); setAddNome(""); setAddSpec(""); setErroFerr("") }} className="btn-ghost" style={{ fontSize: "0.65rem", padding: "3px 8px" }}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

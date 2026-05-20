"use client"

import { useState, useTransition } from "react"
import ProcedimentoCard from "./ProcedimentoCard"
import { criarProcedimento } from "./actions"

interface Imagem { id: string; url: string; legenda: string | null; ordem: number }
interface Procedimento {
  id: string; titulo: string; descricao: string | null; autorId: string
  autorTrigrama: string; autorNome: string; criadoEm: string; imagens: Imagem[]
}

interface Props {
  procedimentos: Procedimento[]
  userId: string
  userRole: string
}

const inp: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  color: "var(--text-primary)",
  padding: "0.4rem 0.6rem",
  fontSize: "0.82rem",
  outline: "none",
  boxSizing: "border-box",
}

export default function ProcedimentosList({ procedimentos: init, userId, userRole }: Props) {
  const [lista, setLista] = useState(init)
  const [showForm, setShowForm] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [erro, setErro] = useState("")
  const [isPending, startTransition] = useTransition()

  function criar() {
    setErro("")
    startTransition(async () => {
      const r = await criarProcedimento(titulo, descricao)
      if (r.error) { setErro(r.error) } else if (r.id) {
        const novo: Procedimento = {
          id: r.id, titulo: titulo.trim(), descricao: descricao.trim() || null,
          autorId: userId, autorTrigrama: "—", autorNome: "—",
          criadoEm: new Date().toISOString(), imagens: [],
        }
        setLista(p => [novo, ...p])
        setTitulo(""); setDescricao(""); setShowForm(false)
      }
    })
  }

  return (
    <div>
      {/* Botão novo procedimento */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
            style={{ fontSize: "0.72rem", padding: "5px 14px" }}
          >
            + Novo Procedimento
          </button>
        )}
      </div>

      {/* Formulário novo */}
      {showForm && (
        <div className="card-mil" style={{ padding: "0.9rem 1rem", marginBottom: "1rem", border: "1px dashed var(--border-gold)" }}>
          <label style={{ color: "var(--text-dim)", fontSize: "0.58rem", letterSpacing: "0.1em", fontWeight: 700, display: "block", marginBottom: 3 }}>TÍTULO *</label>
          <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Instalação do rolamento do cubo MR" style={{ ...inp, fontWeight: 700, marginBottom: 8 }} />
          <label style={{ color: "var(--text-dim)", fontSize: "0.58rem", letterSpacing: "0.1em", fontWeight: 700, display: "block", marginBottom: 3 }}>DESCRIÇÃO / PROCEDIMENTO</label>
          <textarea
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Descreva o procedimento, passos, dicas, torques relevantes..."
            rows={5}
            style={{ ...inp, resize: "vertical", fontFamily: "inherit", lineHeight: 1.55, marginBottom: 8 }}
          />
          <p style={{ color: "var(--text-dim)", fontSize: "0.62rem", margin: "0 0 8px", fontStyle: "italic" }}>
            Imagens podem ser adicionadas após criar o procedimento.
          </p>
          {erro && <p style={{ color: "var(--red-text)", fontSize: "0.7rem", marginBottom: 6 }}>{erro}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={criar} disabled={isPending || !titulo.trim()} className="btn-primary" style={{ flex: 1, fontSize: "0.72rem", padding: "5px" }}>
              {isPending ? "..." : "Criar Procedimento"}
            </button>
            <button onClick={() => { setShowForm(false); setTitulo(""); setDescricao(""); setErro("") }} className="btn-ghost" style={{ fontSize: "0.72rem", padding: "5px 12px" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {lista.length === 0 && !showForm && (
        <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-dim)", fontSize: "0.8rem" }}>
          Nenhum procedimento cadastrado ainda.<br />
          <span style={{ fontSize: "0.72rem" }}>Clique em "+ Novo Procedimento" para adicionar o primeiro.</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {lista.map(p => (
          <ProcedimentoCard
            key={p.id}
            proc={p}
            userId={userId}
            userRole={userRole}
            onRemovido={id => setLista(l => l.filter(x => x.id !== id))}
            onAtualizado={upd => setLista(l => l.map(x => x.id === upd.id ? upd : x))}
          />
        ))}
      </div>
    </div>
  )
}

"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

interface Opcao { id: string; label: string }
interface Props {
  mecanicos: Opcao[]
  sistemas: Opcao[]
  subsistemas: Opcao[]
  anvs: Opcao[]
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

function fmtDateInput(s: string) {
  if (!s) return ""
  const [y, m, d] = s.split("-")
  return `${d}/${m}/${y}`
}

export default function FiltroPanel({ mecanicos, sistemas, subsistemas, anvs }: Props) {
  const router = useRouter()
  const sp = useSearchParams()

  const [dataIni, setDataIni] = useState(sp.get("di") ?? "")
  const [dataFim, setDataFim] = useState(sp.get("df") ?? "")
  const [mecId, setMecId] = useState(sp.get("mec") ?? "")
  const [sisId, setSisId] = useState(sp.get("sis") ?? "")
  const [subId, setSubId] = useState(sp.get("sub") ?? "")
  const [anvId, setAnvId] = useState(sp.get("anv") ?? "")
  const [busca, setBusca] = useState(sp.get("busca") ?? "")
  const [dia, setDia] = useState(sp.get("dia") ?? "")

  function aplicar() {
    const params = new URLSearchParams()
    if (dataIni) params.set("di", dataIni)
    if (dataFim) params.set("df", dataFim)
    if (mecId) params.set("mec", mecId)
    if (sisId) params.set("sis", sisId)
    if (subId) params.set("sub", subId)
    if (anvId) params.set("anv", anvId)
    if (busca.trim()) params.set("busca", busca.trim())
    if (dia) params.set("dia", dia)
    router.push(`/relatorios?${params.toString()}`)
  }

  function limpar() {
    setDataIni(""); setDataFim(""); setMecId(""); setSisId(""); setSubId(""); setAnvId("")
    setBusca(""); setDia("")
    router.push("/relatorios")
  }

  const temFiltro = sp.toString().length > 0

  return (
    <div className="card-mil" style={{ padding: "0.85rem 1rem", marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <span style={{ color: "var(--text-dim)", fontSize: "0.6rem", letterSpacing: "0.12em", fontWeight: 700 }}>FILTROS</span>
        {temFiltro && (
          <button onClick={limpar} style={{ fontSize: "0.62rem", color: "rgba(220,80,80,0.7)", background: "none", border: "none", cursor: "pointer" }}>
            limpar filtros
          </button>
        )}
      </div>

      {/* Livro do dia */}
      <div style={{ marginBottom: 8 }}>
        <label style={{ color: "var(--text-dim)", fontSize: "0.56rem", letterSpacing: "0.08em", display: "block", marginBottom: 2 }}>LIVRO DO DIA (selecionar um dia específico)</label>
        <div style={{ position: "relative" }}>
          <input type="date" value={dia} onChange={e => setDia(e.target.value)} style={{ ...inp, colorScheme: "dark" }} />
          {dia && <span style={{ display: "block", fontSize: "0.62rem", color: "var(--gold)", marginTop: 2 }}>{fmtDateInput(dia)}</span>}
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", margin: "8px 0" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <div>
          <label style={{ color: "var(--text-dim)", fontSize: "0.56rem", letterSpacing: "0.08em", display: "block", marginBottom: 2 }}>DATA INÍCIO</label>
          <input type="date" value={dataIni} onChange={e => setDataIni(e.target.value)} style={{ ...inp, colorScheme: "dark" }} />
          {dataIni && <span style={{ display: "block", fontSize: "0.62rem", color: "var(--text-dim)", marginTop: 2 }}>{fmtDateInput(dataIni)}</span>}
        </div>
        <div>
          <label style={{ color: "var(--text-dim)", fontSize: "0.56rem", letterSpacing: "0.08em", display: "block", marginBottom: 2 }}>DATA FIM</label>
          <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={{ ...inp, colorScheme: "dark" }} />
          {dataFim && <span style={{ display: "block", fontSize: "0.62rem", color: "var(--text-dim)", marginTop: 2 }}>{fmtDateInput(dataFim)}</span>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <div>
          <label style={{ color: "var(--text-dim)", fontSize: "0.56rem", letterSpacing: "0.08em", display: "block", marginBottom: 2 }}>MECÂNICO</label>
          <select value={mecId} onChange={e => setMecId(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
            <option value="">Todos</option>
            {mecanicos.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ color: "var(--text-dim)", fontSize: "0.56rem", letterSpacing: "0.08em", display: "block", marginBottom: 2 }}>AERONAVE</label>
          <select value={anvId} onChange={e => setAnvId(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
            <option value="">Todas</option>
            {anvs.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <div>
          <label style={{ color: "var(--text-dim)", fontSize: "0.56rem", letterSpacing: "0.08em", display: "block", marginBottom: 2 }}>SISTEMA (SEÇÃO)</label>
          <select value={sisId} onChange={e => { setSisId(e.target.value); setSubId("") }} style={{ ...inp, cursor: "pointer" }}>
            <option value="">Todos</option>
            {sistemas.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ color: "var(--text-dim)", fontSize: "0.56rem", letterSpacing: "0.08em", display: "block", marginBottom: 2 }}>SUBSISTEMA</label>
          <select value={subId} onChange={e => setSubId(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
            <option value="">Todos</option>
            {subsistemas.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: "0.85rem" }}>
        <label style={{ color: "var(--text-dim)", fontSize: "0.56rem", letterSpacing: "0.08em", display: "block", marginBottom: 2 }}>BUSCA POR TAREFA (nome)</label>
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          onKeyDown={e => e.key === "Enter" && aplicar()}
          placeholder="Buscar por nome da tarefa COMPDIN..."
          style={inp}
        />
      </div>

      <button onClick={aplicar} className="btn-primary" style={{ width: "100%", fontSize: "0.72rem", padding: "6px" }}>
        Aplicar Filtros
      </button>
    </div>
  )
}

"use client"

import { useState, useTransition } from "react"
import { toggleAtivoAeronave, deletarAeronave } from "./actions"

interface Aeronave {
  id: string
  matricula: string
  modelo: string
  ativo: boolean
  _count: { inspecoes: number }
}

export default function AeronavesList({ aeronaves: init }: { aeronaves: Aeronave[] }) {
  const [aeronaves, setAeronaves] = useState(init)
  const [confirmarDeletar, setConfirmarDeletar] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleToggle(id: string, ativo: boolean) {
    startTransition(async () => {
      await toggleAtivoAeronave(id, !ativo)
      setAeronaves(p => p.map(a => a.id === id ? { ...a, ativo: !ativo } : a))
    })
  }

  function handleDeletar(id: string) {
    startTransition(async () => {
      const r = await deletarAeronave(id)
      if (!r.error) {
        setAeronaves(p => p.filter(a => a.id !== id))
        setConfirmarDeletar(null)
      } else {
        alert(r.error)
        setConfirmarDeletar(null)
      }
    })
  }

  if (aeronaves.length === 0) {
    return (
      <div className="card-mil" style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-dim)", fontSize: "0.8rem" }}>
        Nenhuma aeronave cadastrada.
      </div>
    )
  }

  return (
    <div className="card-mil" style={{ overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["MATRÍCULA", "MODELO", "INSPEÇÕES", "STATUS", "AÇÕES"].map(h => (
              <th key={h} style={{
                padding: "0.5rem 0.75rem",
                textAlign: "left",
                fontSize: "0.58rem",
                letterSpacing: "0.1em",
                color: "var(--text-dim)",
                fontWeight: 700,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {aeronaves.map((a, i) => (
            <>
              <tr
                key={a.id}
                style={{
                  borderBottom: "1px solid var(--border)",
                  background: !a.ativo ? "rgba(0,0,0,0.2)" : i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                  opacity: a.ativo ? 1 : 0.55,
                }}
              >
                <td style={{ padding: "0.6rem 0.75rem" }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "0.95rem", color: "var(--gold-bright)", letterSpacing: "0.1em" }}>
                    {a.matricula}
                  </span>
                </td>
                <td style={{ padding: "0.6rem 0.75rem", color: "var(--text-primary)", fontSize: "0.8rem" }}>{a.modelo}</td>
                <td style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)", fontSize: "0.75rem", fontFamily: "monospace" }}>
                  {a._count.inspecoes}
                </td>
                <td style={{ padding: "0.6rem 0.75rem" }}>
                  <span className={a.ativo ? "badge-green" : "badge-red"} style={{ fontSize: "0.58rem" }}>
                    {a.ativo ? "ATIVA" : "INATIVA"}
                  </span>
                </td>
                <td style={{ padding: "0.6rem 0.75rem" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => handleToggle(a.id, a.ativo)}
                      disabled={isPending}
                      style={{ fontSize: "0.62rem", color: a.ativo ? "rgba(220,80,80,0.8)" : "var(--green-text)", background: "none", border: `1px solid ${a.ativo ? "rgba(220,80,80,0.3)" : "rgba(74,222,128,0.3)"}`, borderRadius: 5, padding: "2px 8px", cursor: "pointer" }}
                    >
                      {a.ativo ? "desativar" : "ativar"}
                    </button>
                    <button
                      onClick={() => setConfirmarDeletar(prev => prev === a.id ? null : a.id)}
                      disabled={isPending}
                      style={{ fontSize: "0.62rem", color: "rgba(220,80,80,0.6)", background: "none", border: "1px solid rgba(220,80,80,0.2)", borderRadius: 5, padding: "2px 8px", cursor: "pointer" }}
                    >
                      excluir
                    </button>
                  </div>
                </td>
              </tr>

              {confirmarDeletar === a.id && (
                <tr key={`${a.id}-del`} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td colSpan={5} style={{ padding: "0.6rem 1rem", background: "rgba(220,80,80,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ color: "var(--red-text)", fontSize: "0.75rem", flex: 1 }}>
                        Excluir aeronave <strong>{a.matricula}</strong> permanentemente?
                        {a._count.inspecoes > 0 && <> Possui {a._count.inspecoes} inspeção(ões) vinculada(s).</>}
                      </span>
                      <button
                        onClick={() => handleDeletar(a.id)}
                        disabled={isPending}
                        className="btn-primary"
                        style={{ fontSize: "0.65rem", padding: "3px 12px", background: "rgba(220,80,80,0.15)", borderColor: "rgba(220,80,80,0.4)", color: "var(--red-text)" }}
                      >
                        {isPending ? "..." : "Confirmar"}
                      </button>
                      <button onClick={() => setConfirmarDeletar(null)} className="btn-ghost" style={{ fontSize: "0.65rem", padding: "3px 10px" }}>
                        Cancelar
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}

"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toggleAtivoAeronave } from "./actions"

interface Aeronave {
  id: string
  matricula: string
  modelo: string
  ativo: boolean
  _count: { inspecoes: number }
}

export default function AeronavesList({ aeronaves }: { aeronaves: Aeronave[] }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleToggle(id: string, ativo: boolean) {
    startTransition(async () => {
      await toggleAtivoAeronave(id, !ativo)
      router.refresh()
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
            <tr
              key={a.id}
              style={{
                borderBottom: i < aeronaves.length - 1 ? "1px solid var(--border)" : undefined,
                background: !a.ativo ? "rgba(0,0,0,0.2)" : i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                opacity: a.ativo ? 1 : 0.55,
              }}
            >
              <td style={{ padding: "0.6rem 0.75rem" }}>
                <span style={{
                  fontFamily: "monospace",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  color: "var(--gold-bright)",
                  letterSpacing: "0.1em",
                }}>
                  {a.matricula}
                </span>
              </td>
              <td style={{ padding: "0.6rem 0.75rem", color: "var(--text-primary)", fontSize: "0.8rem" }}>
                {a.modelo}
              </td>
              <td style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)", fontSize: "0.75rem", fontFamily: "monospace" }}>
                {a._count.inspecoes}
              </td>
              <td style={{ padding: "0.6rem 0.75rem" }}>
                <span className={a.ativo ? "badge-green" : "badge-red"} style={{ fontSize: "0.58rem" }}>
                  {a.ativo ? "ATIVA" : "INATIVA"}
                </span>
              </td>
              <td style={{ padding: "0.6rem 0.75rem" }}>
                <button
                  onClick={() => handleToggle(a.id, a.ativo)}
                  disabled={isPending}
                  style={{
                    fontSize: "0.62rem",
                    color: a.ativo ? "rgba(220,80,80,0.8)" : "var(--green-text)",
                    background: "none",
                    border: `1px solid ${a.ativo ? "rgba(220,80,80,0.3)" : "rgba(74,222,128,0.3)"}`,
                    borderRadius: 5,
                    padding: "2px 8px",
                    cursor: "pointer",
                  }}
                >
                  {a.ativo ? "desativar" : "ativar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

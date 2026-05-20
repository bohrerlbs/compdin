"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { criarAeronave } from "./actions"

export default function NovaAeronaveForm() {
  const [matricula, setMatricula] = useState("")
  const [modelo, setModelo] = useState("H-60L")
  const [erro, setErro] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    startTransition(async () => {
      try {
        await criarAeronave({ matricula, modelo })
        setMatricula("")
        setModelo("H-60L")
        router.refresh()
      } catch (err: unknown) {
        setErro(err instanceof Error ? err.message : "Erro ao cadastrar aeronave.")
      }
    })
  }

  const labelStyle = {
    display: "block",
    fontSize: "0.6rem",
    letterSpacing: "0.12em",
    color: "var(--text-muted)",
    marginBottom: 5,
    fontWeight: 600,
  } as const

  const inputStyle = {
    width: "100%",
    background: "var(--bg-input)",
    border: "1px solid var(--border)",
    borderRadius: 7,
    color: "var(--text-primary)",
    padding: "0.6rem 0.75rem",
    fontSize: "0.85rem",
    outline: "none",
    boxSizing: "border-box",
  } as const

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
        <div>
          <label style={labelStyle}>MATRÍCULA</label>
          <input
            style={{ ...inputStyle, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.1em" }}
            value={matricula}
            onChange={e => setMatricula(e.target.value)}
            placeholder="Ex: 8915"
            required
          />
        </div>
        <div>
          <label style={labelStyle}>MODELO</label>
          <input
            style={inputStyle}
            value={modelo}
            onChange={e => setModelo(e.target.value)}
            placeholder="H-60L"
          />
        </div>
      </div>

      {erro && (
        <p style={{ color: "var(--red-text)", fontSize: "0.78rem", marginBottom: "0.75rem" }}>{erro}</p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary" style={{ width: "100%", fontSize: "0.78rem" }}>
        {isPending ? "CADASTRANDO..." : "CADASTRAR AERONAVE"}
      </button>
    </form>
  )
}

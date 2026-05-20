"use client"

import { useState, useTransition } from "react"
import { alterarSenha } from "./actions"

interface Props {
  userId: string
  onFechado: () => void
}

export default function AlterarSenhaForm({ userId, onFechado }: Props) {
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    startTransition(async () => {
      try {
        await alterarSenha(userId, senha)
        onFechado()
      } catch (err: unknown) {
        setErro(err instanceof Error ? err.message : "Erro.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
      <div style={{ flex: 1 }}>
        <input
          type="password"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          placeholder="Nova senha (mín. 6 caracteres)"
          style={{
            width: "100%",
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
            borderRadius: 7,
            color: "var(--text-primary)",
            padding: "0.5rem 0.75rem",
            fontSize: "0.8rem",
            outline: "none",
            boxSizing: "border-box",
          }}
          required
        />
        {erro && <p style={{ color: "var(--red-text)", fontSize: "0.7rem", marginTop: 3 }}>{erro}</p>}
      </div>
      <button type="submit" disabled={isPending} className="btn-primary" style={{ fontSize: "0.68rem", padding: "0.5rem 1rem" }}>
        {isPending ? "..." : "Salvar"}
      </button>
      <button type="button" onClick={onFechado} className="btn-ghost" style={{ fontSize: "0.68rem", padding: "0.5rem 1rem" }}>
        Cancelar
      </button>
    </form>
  )
}

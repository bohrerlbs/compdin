"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Role } from "@prisma/client"
import { criarUsuario } from "./actions"

const ROLE_LABELS: Record<Role, string> = {
  MECANICO: "Mecânico",
  ENCARREGADO: "Encarregado",
  INSPETOR: "Inspetor",
  ADMIN: "Admin",
}

export default function NovoUsuarioForm() {
  const router = useRouter()
  const [nome, setNome] = useState("")
  const [trigrama, setTrigrama] = useState("")
  const [matricula, setMatricula] = useState("")
  const [senha, setSenha] = useState("")
  const [role, setRole] = useState<Role>("MECANICO")
  const [erro, setErro] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    startTransition(async () => {
      const result = await criarUsuario({ nome, trigrama, matricula, senha, role })
      if (result.error) {
        setErro(result.error)
      } else {
        setNome(""); setTrigrama(""); setMatricula(""); setSenha(""); setRole("MECANICO")
        router.refresh()
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
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>NOME COMPLETO</label>
          <input style={inputStyle} value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Cap João Silva" required />
        </div>
        <div>
          <label style={labelStyle}>TRIGRAMA</label>
          <input
            style={{ ...inputStyle, textTransform: "uppercase", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.2em" }}
            value={trigrama}
            onChange={e => setTrigrama(e.target.value.toUpperCase().slice(0, 3))}
            placeholder="JSI"
            maxLength={3}
            required
          />
        </div>
        <div>
          <label style={labelStyle}>PERFIL</label>
          <select
            style={{ ...inputStyle, cursor: "pointer" }}
            value={role}
            onChange={e => setRole(e.target.value as Role)}
          >
            {(Object.keys(ROLE_LABELS) as Role[]).map(r => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>MATRÍCULA / LOGIN</label>
          <input style={inputStyle} value={matricula} onChange={e => setMatricula(e.target.value)} placeholder="ex: silva01" required />
        </div>
        <div>
          <label style={labelStyle}>SENHA INICIAL</label>
          <input type="password" style={inputStyle} value={senha} onChange={e => setSenha(e.target.value)} placeholder="mín. 6 caracteres" required />
        </div>
      </div>

      {erro && (
        <p style={{ color: "var(--red-text)", fontSize: "0.78rem", marginBottom: "0.75rem" }}>{erro}</p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary" style={{ width: "100%", fontSize: "0.78rem" }}>
        {isPending ? "CRIANDO..." : "CRIAR USUÁRIO"}
      </button>
    </form>
  )
}

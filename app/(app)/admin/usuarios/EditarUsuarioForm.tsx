"use client"

import { useState, useTransition } from "react"
import { Role } from "@prisma/client"
import { editarUsuario } from "./actions"

interface Props {
  usuario: { id: string; nome: string; trigrama: string; matricula: string; role: Role }
  onFechado: () => void
  onSalvo: (dados: { nome: string; trigrama: string; matricula: string; role: Role }) => void
}

const ROLES: Role[] = ["MECANICO", "ENCARREGADO", "INSPETOR", "ADMIN"]
const ROLE_LABELS: Record<Role, string> = {
  MECANICO: "Mecânico",
  ENCARREGADO: "Encarregado",
  INSPETOR: "Inspetor",
  ADMIN: "Admin",
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

export default function EditarUsuarioForm({ usuario, onFechado, onSalvo }: Props) {
  const [nome, setNome] = useState(usuario.nome)
  const [trigrama, setTrigrama] = useState(usuario.trigrama)
  const [matricula, setMatricula] = useState(usuario.matricula)
  const [role, setRole] = useState<Role>(usuario.role)
  const [erro, setErro] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    startTransition(async () => {
      const r = await editarUsuario(usuario.id, { nome, trigrama, matricula, role })
      if (r.error) { setErro(r.error) } else {
        onSalvo({ nome, trigrama: trigrama.toUpperCase(), matricula: matricula.toLowerCase(), role })
        onFechado()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr", gap: 8, marginBottom: 8 }}>
        <div>
          <label style={{ color: "var(--text-dim)", fontSize: "0.56rem", letterSpacing: "0.08em", display: "block", marginBottom: 2 }}>NOME</label>
          <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" style={inp} required />
        </div>
        <div>
          <label style={{ color: "var(--text-dim)", fontSize: "0.56rem", letterSpacing: "0.08em", display: "block", marginBottom: 2 }}>TRIG.</label>
          <input
            value={trigrama}
            onChange={e => setTrigrama(e.target.value.toUpperCase())}
            maxLength={3}
            placeholder="XXX"
            style={{ ...inp, fontFamily: "monospace", fontWeight: 800, textTransform: "uppercase" }}
            required
          />
        </div>
        <div>
          <label style={{ color: "var(--text-dim)", fontSize: "0.56rem", letterSpacing: "0.08em", display: "block", marginBottom: 2 }}>MATRÍCULA</label>
          <input value={matricula} onChange={e => setMatricula(e.target.value)} placeholder="login" style={{ ...inp, fontFamily: "monospace" }} required />
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ color: "var(--text-dim)", fontSize: "0.56rem", letterSpacing: "0.08em", display: "block", marginBottom: 2 }}>PERFIL</label>
        <select
          value={role}
          onChange={e => setRole(e.target.value as Role)}
          style={{ ...inp, cursor: "pointer" }}
        >
          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </div>
      {erro && <p style={{ color: "var(--red-text)", fontSize: "0.7rem", marginBottom: 6 }}>{erro}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={isPending} className="btn-primary" style={{ fontSize: "0.68rem", padding: "0.45rem 1rem" }}>
          {isPending ? "..." : "Salvar"}
        </button>
        <button type="button" onClick={onFechado} className="btn-ghost" style={{ fontSize: "0.68rem", padding: "0.45rem 1rem" }}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

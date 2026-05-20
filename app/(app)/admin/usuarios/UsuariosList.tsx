"use client"

import { useState, useTransition } from "react"
import { Role } from "@prisma/client"
import { toggleAtivo, deletarUsuario } from "./actions"
import AlterarSenhaForm from "./AlterarSenhaForm"
import EditarUsuarioForm from "./EditarUsuarioForm"
import { useRouter } from "next/navigation"

interface Usuario {
  id: string
  nome: string
  trigrama: string
  matricula: string
  role: Role
  ativo: boolean
  criadoEm: string
}

const ROLE_LABELS: Record<Role, string> = {
  MECANICO: "Mecânico",
  ENCARREGADO: "Encarregado",
  INSPETOR: "Inspetor",
  ADMIN: "Admin",
}

const ROLE_BADGE: Record<Role, string> = {
  MECANICO: "badge-red",
  ENCARREGADO: "badge-yellow",
  INSPETOR: "badge-gold",
  ADMIN: "badge-green",
}

export default function UsuariosList({ usuarios: init }: { usuarios: Usuario[] }) {
  const [usuarios, setUsuarios] = useState(init)
  const [expandido, setExpandido] = useState<{ id: string; tipo: "senha" | "editar" } | null>(null)
  const [confirmarDeletar, setConfirmarDeletar] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleToggle(userId: string, ativo: boolean) {
    startTransition(async () => {
      const result = await toggleAtivo(userId, !ativo)
      if (!result.error) setUsuarios(p => p.map(u => u.id === userId ? { ...u, ativo: !ativo } : u))
    })
  }

  function handleDeletar(userId: string) {
    startTransition(async () => {
      const result = await deletarUsuario(userId)
      if (!result.error) {
        setUsuarios(p => p.filter(u => u.id !== userId))
        setConfirmarDeletar(null)
      } else {
        alert(result.error)
        setConfirmarDeletar(null)
      }
    })
  }

  function toggle(id: string, tipo: "senha" | "editar") {
    setExpandido(prev => (prev?.id === id && prev.tipo === tipo) ? null : { id, tipo })
    setConfirmarDeletar(null)
  }

  return (
    <div className="card-mil" style={{ overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["TRIGRAMA", "NOME", "MATRÍCULA", "PERFIL", "STATUS", "AÇÕES"].map(h => (
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
          {usuarios.map((u, i) => (
            <>
              <tr
                key={u.id}
                style={{
                  borderBottom: "1px solid var(--border)",
                  background: !u.ativo ? "rgba(0,0,0,0.2)" : i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                  opacity: u.ativo ? 1 : 0.55,
                }}
              >
                <td style={{ padding: "0.6rem 0.75rem" }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "0.9rem", color: "var(--gold-bright)", letterSpacing: "0.1em" }}>
                    {u.trigrama}
                  </span>
                </td>
                <td style={{ padding: "0.6rem 0.75rem", color: "var(--text-primary)", fontSize: "0.8rem" }}>
                  {u.nome}
                </td>
                <td style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)", fontSize: "0.75rem", fontFamily: "monospace" }}>
                  {u.matricula}
                </td>
                <td style={{ padding: "0.6rem 0.75rem" }}>
                  <span className={ROLE_BADGE[u.role]} style={{ fontSize: "0.58rem" }}>
                    {ROLE_LABELS[u.role]}
                  </span>
                </td>
                <td style={{ padding: "0.6rem 0.75rem" }}>
                  <span className={u.ativo ? "badge-green" : "badge-red"} style={{ fontSize: "0.58rem" }}>
                    {u.ativo ? "ATIVO" : "INATIVO"}
                  </span>
                </td>
                <td style={{ padding: "0.6rem 0.75rem" }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button
                      onClick={() => toggle(u.id, "editar")}
                      style={{ fontSize: "0.62rem", color: "var(--text-muted)", background: "none", border: "1px solid var(--border)", borderRadius: 5, padding: "2px 8px", cursor: "pointer" }}
                    >
                      editar
                    </button>
                    <button
                      onClick={() => toggle(u.id, "senha")}
                      style={{ fontSize: "0.62rem", color: "var(--gold-bright)", background: "none", border: "1px solid var(--border-gold)", borderRadius: 5, padding: "2px 8px", cursor: "pointer" }}
                    >
                      senha
                    </button>
                    <button
                      onClick={() => handleToggle(u.id, u.ativo)}
                      disabled={isPending}
                      style={{ fontSize: "0.62rem", color: u.ativo ? "rgba(220,80,80,0.8)" : "var(--green-text)", background: "none", border: `1px solid ${u.ativo ? "rgba(220,80,80,0.3)" : "rgba(74,222,128,0.3)"}`, borderRadius: 5, padding: "2px 8px", cursor: "pointer" }}
                    >
                      {u.ativo ? "desativar" : "ativar"}
                    </button>
                    <button
                      onClick={() => setConfirmarDeletar(prev => prev === u.id ? null : u.id)}
                      disabled={isPending}
                      style={{ fontSize: "0.62rem", color: "rgba(220,80,80,0.6)", background: "none", border: "1px solid rgba(220,80,80,0.2)", borderRadius: 5, padding: "2px 8px", cursor: "pointer" }}
                    >
                      excluir
                    </button>
                  </div>
                </td>
              </tr>

              {/* Confirmar exclusão */}
              {confirmarDeletar === u.id && (
                <tr key={`${u.id}-del`} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td colSpan={6} style={{ padding: "0.6rem 1rem", background: "rgba(220,80,80,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ color: "var(--red-text)", fontSize: "0.75rem", flex: 1 }}>
                        Excluir <strong>{u.nome}</strong> permanentemente? Esta ação não pode ser desfeita.
                      </span>
                      <button
                        onClick={() => handleDeletar(u.id)}
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

              {/* Editar */}
              {expandido?.id === u.id && expandido.tipo === "editar" && (
                <tr key={`${u.id}-edit`} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td colSpan={6} style={{ padding: "0.75rem 1rem", background: "rgba(190,148,50,0.03)" }}>
                    <EditarUsuarioForm
                      usuario={u}
                      onFechado={() => setExpandido(null)}
                      onSalvo={dados => {
                        setUsuarios(p => p.map(x => x.id === u.id ? { ...x, ...dados } : x))
                        router.refresh()
                      }}
                    />
                  </td>
                </tr>
              )}

              {/* Alterar senha */}
              {expandido?.id === u.id && expandido.tipo === "senha" && (
                <tr key={`${u.id}-senha`} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td colSpan={6} style={{ padding: "0.75rem 1rem", background: "rgba(190,148,50,0.05)" }}>
                    <AlterarSenhaForm userId={u.id} onFechado={() => setExpandido(null)} />
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

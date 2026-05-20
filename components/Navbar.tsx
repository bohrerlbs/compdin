"use client"

import { signOut } from "next-auth/react"
import { Role } from "@prisma/client"
import Link from "next/link"

const ROLE_LABEL: Record<Role, string> = {
  MECANICO: "Mecânico",
  ENCARREGADO: "Encarregado",
  INSPETOR: "Inspetor",
  ADMIN: "Administrador",
}

interface Props {
  user: { name?: string | null; matricula: string; trigrama: string; role: Role }
}

export default function Navbar({ user }: Props) {
  const canReport = user.role === "ENCARREGADO" || user.role === "ADMIN"

  return (
    <header
      style={{
        background: "linear-gradient(180deg, #09101e 0%, #06080e 100%)",
        borderBottom: "1px solid rgba(190,148,50,0.2)",
      }}
      className="sticky top-0 z-20"
    >
      {/* Faixa superior FAB */}
      <div
        style={{
          background: "linear-gradient(90deg, var(--border) 0%, var(--border-gold) 50%, var(--border) 100%)",
          height: "1px",
        }}
      />

      <div className="container mx-auto px-4 max-w-2xl h-14 flex items-center justify-between">
        {/* Logo / branding */}
        <div className="flex items-center gap-3">
          <Link href="/anvs" className="flex items-center gap-2.5">
            {/* Escudo estilizado */}
            <div
              style={{
                width: 32,
                height: 36,
                background: "linear-gradient(160deg, #0d1a30 0%, #081018 100%)",
                border: "1px solid var(--border-gold)",
                clipPath: "polygon(15% 0%, 85% 0%, 100% 15%, 100% 75%, 50% 100%, 0% 75%, 0% 15%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>🐆</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  style={{
                    color: "var(--gold-bright)",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    letterSpacing: "0.12em",
                  }}
                >
                  COMPDIN
                </span>
                <span
                  style={{
                    color: "var(--text-dim)",
                    fontSize: "0.6rem",
                    letterSpacing: "0.08em",
                  }}
                >
                  •
                </span>
                <span
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.6rem",
                    letterSpacing: "0.1em",
                    fontWeight: 600,
                  }}
                >
                  5/8 GAV
                </span>
              </div>
              <div
                style={{
                  color: "var(--text-dim)",
                  fontSize: "0.55rem",
                  letterSpacing: "0.15em",
                  lineHeight: 1,
                  marginTop: 1,
                }}
              >
                PANTERA NEGRA
              </div>
            </div>
          </Link>
        </div>

        {/* Direita */}
        <div className="flex items-center gap-3">
          {canReport && (
            <>
              <Link
                href="/relatorios"
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.72rem",
                  letterSpacing: "0.08em",
                  padding: "4px 10px",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  transition: "all 0.15s",
                }}
                className="hover:border-gold hover:text-gold hidden sm:block"
              >
                RELATÓRIOS
              </Link>
              <Link
                href="/admin/usuarios"
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.72rem",
                  letterSpacing: "0.08em",
                  padding: "4px 10px",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  transition: "all 0.15s",
                }}
                className="hover:border-gold hover:text-gold hidden sm:block"
              >
                USUÁRIOS
              </Link>
            </>
          )}

          {/* Trigrama badge */}
          <div className="flex items-center gap-2">
            <div
              style={{
                background: "var(--gold-dim)",
                border: "1px solid var(--border-gold)",
                borderRadius: 6,
                padding: "3px 8px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: "var(--gold-bright)",
                  fontFamily: "monospace",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  letterSpacing: "0.1em",
                  lineHeight: 1.1,
                }}
              >
                {user.trigrama}
              </div>
              <div
                style={{
                  color: "var(--text-dim)",
                  fontSize: "0.5rem",
                  letterSpacing: "0.06em",
                }}
              >
                {ROLE_LABEL[user.role].toUpperCase()}
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{
                color: "var(--text-muted)",
                fontSize: "0.7rem",
                padding: "5px 10px",
                border: "1px solid var(--border)",
                borderRadius: 6,
                background: "transparent",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              SAIR
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

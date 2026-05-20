"use client"

import { signOut } from "next-auth/react"
import { Role } from "@prisma/client"
import Link from "next/link"
import Image from "next/image"
import NotifBell from "./NotifBell"

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
  const canReport = user.role === "ENCARREGADO" || user.role === "INSPETOR" || user.role === "ADMIN"

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
            {/* Brasão do esquadrão */}
            <Image
              src="/58.jpg"
              alt="5º/8º GAV Pantera Negra"
              width={38}
              height={44}
              style={{ objectFit: "contain", flexShrink: 0 }}
            />
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
                PANTERA
              </div>
            </div>
          </Link>
        </div>

        {/* Direita */}
        <div className="flex items-center gap-3">
          {/* Procedimentos — todos os usuários */}
          <Link
            href="/procedimentos"
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
            PROC.
          </Link>

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
              <Link
                href="/admin/aeronaves"
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
                AERONAVES
              </Link>
            </>
          )}

          {/* Sino de notificações */}
          <NotifBell />

          {/* Trigrama badge */}
          <div className="flex items-center gap-2">
            <Link
              href="/perfil"
              style={{
                background: "var(--gold-dim)",
                border: "1px solid var(--border-gold)",
                borderRadius: 6,
                padding: "3px 8px",
                textAlign: "center",
                textDecoration: "none",
                display: "block",
              }}
              title="Meu perfil"
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
            </Link>

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

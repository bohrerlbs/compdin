"use client"

import { signOut } from "next-auth/react"
import { Role } from "@prisma/client"
import Link from "next/link"
import Image from "next/image"
import NotifBell from "./NotifBell"
import { useEffect, useRef, useState } from "react"

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
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [menuOpen])

  const linkStyle: React.CSSProperties = {
    color: "var(--text-muted)",
    fontSize: "0.72rem",
    letterSpacing: "0.08em",
    padding: "4px 10px",
    border: "1px solid var(--border)",
    borderRadius: 6,
    transition: "all 0.15s",
    textDecoration: "none",
    display: "block",
  }

  const dropLinkStyle: React.CSSProperties = {
    display: "block",
    padding: "0.65rem 1rem",
    color: "var(--text-muted)",
    fontSize: "0.8rem",
    letterSpacing: "0.08em",
    textDecoration: "none",
    borderBottom: "1px solid var(--border)",
    transition: "background 0.1s",
  }

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
        <Link href="/anvs" className="flex items-center gap-2.5">
          <Image
            src="/58.jpg"
            alt="5º/8º GAV Pantera Negra"
            width={38}
            height={44}
            style={{ objectFit: "contain", flexShrink: 0 }}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: "var(--gold-bright)", fontWeight: 800, fontSize: "0.85rem", letterSpacing: "0.12em" }}>
                COMPDIN
              </span>
              <span style={{ color: "var(--text-dim)", fontSize: "0.6rem" }}>•</span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.6rem", letterSpacing: "0.1em", fontWeight: 600 }}>
                5/8 GAV
              </span>
            </div>
            <div style={{ color: "var(--text-dim)", fontSize: "0.55rem", letterSpacing: "0.15em", lineHeight: 1, marginTop: 1 }}>
              PANTERA
            </div>
          </div>
        </Link>

        {/* Direita */}
        <div className="flex items-center gap-2">
          {/* Links desktop (sm+) */}
          <div className="hidden sm:flex items-center gap-2">
            <Link href="/procedimentos" style={linkStyle}>PROC.</Link>
            {canReport && (
              <>
                <Link href="/relatorios" style={linkStyle}>RELATÓRIOS</Link>
                <Link href="/admin/usuarios" style={linkStyle}>USUÁRIOS</Link>
                <Link href="/admin/aeronaves" style={linkStyle}>AERONAVES</Link>
              </>
            )}
          </div>

          {/* Sino */}
          <NotifBell />

          {/* Trigrama badge — sempre visível */}
          <Link
            href="/perfil"
            style={{
              background: "var(--gold-dim)",
              border: "1px solid var(--border-gold)",
              borderRadius: 6,
              padding: "3px 8px",
              textAlign: "center",
              textDecoration: "none",
            }}
            title="Meu perfil"
          >
            <div style={{ color: "var(--gold-bright)", fontFamily: "monospace", fontWeight: 800, fontSize: "0.85rem", letterSpacing: "0.1em", lineHeight: 1.1 }}>
              {user.trigrama}
            </div>
            <div style={{ color: "var(--text-dim)", fontSize: "0.5rem", letterSpacing: "0.06em" }}>
              {ROLE_LABEL[user.role].toUpperCase()}
            </div>
          </Link>

          {/* SAIR — desktop only */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="hidden sm:block"
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

          {/* Hamburger — mobile only */}
          <div ref={menuRef} style={{ position: "relative" }} className="sm:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
              style={{
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "5px 8px",
                cursor: "pointer",
                color: menuOpen ? "var(--gold-bright)" : "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              {menuOpen ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>

            {menuOpen && (
              <div style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                minWidth: 180,
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                overflow: "hidden",
                zIndex: 100,
              }}>
                <Link href="/procedimentos" style={dropLinkStyle} onClick={() => setMenuOpen(false)}>
                  PROC.
                </Link>
                {canReport && (
                  <>
                    <Link href="/relatorios" style={dropLinkStyle} onClick={() => setMenuOpen(false)}>
                      RELATÓRIOS
                    </Link>
                    <Link href="/admin/usuarios" style={dropLinkStyle} onClick={() => setMenuOpen(false)}>
                      USUÁRIOS
                    </Link>
                    <Link href="/admin/aeronaves" style={dropLinkStyle} onClick={() => setMenuOpen(false)}>
                      AERONAVES
                    </Link>
                  </>
                )}
                <button
                  onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/login" }) }}
                  style={{
                    ...dropLinkStyle,
                    width: "100%",
                    textAlign: "left",
                    background: "none",
                    cursor: "pointer",
                    borderBottom: "none",
                    color: "rgba(220,80,80,0.8)",
                  }}
                >
                  SAIR
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

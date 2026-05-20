"use client"

import { useEffect, useRef, useState } from "react"

interface Notif {
  id: string
  tipo: string
  titulo: string
  corpo: string | null
  lido: boolean
  link: string | null
  criadoEm: string
}

function fmtData(iso: string) {
  const d = new Date(iso)
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
}

export default function NotifBell() {
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const unread = notifs.filter((n) => !n.lido).length

  async function fetchNotifs() {
    try {
      const res = await fetch("/api/notificacoes", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setNotifs(data)
      }
    } catch {
      // silently ignore
    }
  }

  useEffect(() => {
    fetchNotifs()
    const id = setInterval(fetchNotifs, 30_000)
    return () => clearInterval(id)
  }, [])

  async function handleOpen() {
    const wasOpen = open
    setOpen(!wasOpen)
    if (!wasOpen && unread > 0) {
      await fetch("/api/notificacoes", { method: "PATCH" })
      setNotifs((prev) => prev.map((n) => ({ ...n, lido: true })))
    }
  }

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      <button
        onClick={handleOpen}
        aria-label="Notificações"
        style={{
          position: "relative",
          background: "none",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "5px 8px",
          cursor: "pointer",
          color: unread > 0 ? "var(--gold-bright)" : "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          transition: "all 0.15s",
        }}
      >
        {/* Bell SVG */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span style={{
            position: "absolute",
            top: -4,
            right: -4,
            background: "var(--red-err)",
            border: "1px solid rgba(248,113,113,0.4)",
            color: "var(--red-text)",
            borderRadius: 9999,
            fontSize: "0.5rem",
            fontWeight: 800,
            minWidth: 14,
            height: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 2px",
          }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: 0,
          width: 300,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          zIndex: 100,
          maxHeight: 400,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{
            padding: "0.6rem 0.85rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span style={{ color: "var(--text-dim)", fontSize: "0.58rem", letterSpacing: "0.12em", fontWeight: 700 }}>
              NOTIFICAÇÕES
            </span>
            {notifs.length > 0 && (
              <span style={{ color: "var(--text-dim)", fontSize: "0.58rem" }}>
                {notifs.length} total
              </span>
            )}
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifs.length === 0 ? (
              <p style={{ color: "var(--text-dim)", fontSize: "0.72rem", textAlign: "center", padding: "1.5rem" }}>
                Nenhuma notificação.
              </p>
            ) : (
              notifs.map((n) => (
                <a
                  key={n.id}
                  href={n.link ?? "#"}
                  onClick={() => setOpen(false)}
                  style={{
                    display: "block",
                    padding: "0.6rem 0.85rem",
                    borderBottom: "1px solid var(--border)",
                    textDecoration: "none",
                    background: n.lido ? "transparent" : "rgba(190,148,50,0.05)",
                    transition: "background 0.1s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                    {!n.lido && (
                      <span style={{
                        width: 6,
                        height: 6,
                        background: "var(--gold)",
                        borderRadius: 9999,
                        flexShrink: 0,
                        marginTop: 4,
                      }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: "var(--text-primary)", fontSize: "0.75rem", fontWeight: n.lido ? 400 : 600, marginBottom: 2 }}>
                        {n.titulo}
                      </p>
                      {n.corpo && (
                        <p style={{ color: "var(--text-muted)", fontSize: "0.68rem", lineHeight: 1.4 }}>
                          {n.corpo}
                        </p>
                      )}
                      <p style={{ color: "var(--text-dim)", fontSize: "0.58rem", marginTop: 3 }}>
                        {fmtData(n.criadoEm)}
                      </p>
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

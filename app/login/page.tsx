"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const [matricula, setMatricula] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await signIn("credentials", {
      matricula,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError("Matrícula ou senha incorretos.")
    } else {
      router.push("/anvs")
      router.refresh()
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 0%, #0b1a30 0%, #06080e 65%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      {/* Linha dourada topo */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: "linear-gradient(90deg, transparent 0%, var(--gold) 30%, var(--gold-bright) 50%, var(--gold) 70%, transparent 100%)",
        }}
      />

      <div style={{ width: "100%", maxWidth: 340 }}>
        {/* Header militar */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          {/* Brasão */}
          <div style={{ margin: "0 auto 1.25rem", display: "flex", justifyContent: "center" }}>
            <Image
              src="/pantera.jpg"
              alt="5º/8º GAV Pantera"
              width={72}
              height={84}
              style={{ objectFit: "contain" }}
            />
          </div>

          <div
            style={{
              color: "var(--gold-bright)",
              fontWeight: 800,
              fontSize: "1.3rem",
              letterSpacing: "0.2em",
              marginBottom: 4,
            }}
          >
            COMPDIN
          </div>
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: "0.65rem",
              letterSpacing: "0.18em",
              fontWeight: 600,
              marginBottom: 2,
            }}
          >
            5° ESQUADRÃO · 8° GRUPO DE AVIAÇÃO
          </div>
          <div
            style={{
              color: "var(--text-dim)",
              fontSize: "0.6rem",
              letterSpacing: "0.15em",
            }}
          >
            FORÇA AÉREA BRASILEIRA
          </div>

          <div
            style={{
              height: 1,
              background: "linear-gradient(90deg, transparent, var(--border-gold), transparent)",
              margin: "1rem 0 0",
            }}
          />
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.65rem",
                letterSpacing: "0.12em",
                color: "var(--text-muted)",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              MATRÍCULA
            </label>
            <input
              type="text"
              autoComplete="username"
              required
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              style={{
                width: "100%",
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text-primary)",
                padding: "0.7rem 1rem",
                fontSize: "0.9rem",
                outline: "none",
                transition: "border-color 0.15s",
                letterSpacing: "0.06em",
              }}
              placeholder="ex: mecanico01"
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.65rem",
                letterSpacing: "0.12em",
                color: "var(--text-muted)",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              SENHA
            </label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text-primary)",
                padding: "0.7rem 1rem",
                fontSize: "0.9rem",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p
              style={{
                color: "var(--red-text)",
                fontSize: "0.8rem",
                textAlign: "center",
                marginBottom: "1rem",
              }}
            >
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", fontSize: "0.8rem", letterSpacing: "0.15em" }}>
            {loading ? "AGUARDE..." : "ACESSAR SISTEMA"}
          </button>
        </form>

        <div
          style={{
            textAlign: "center",
            marginTop: "2rem",
            color: "var(--text-dim)",
            fontSize: "0.58rem",
            letterSpacing: "0.1em",
          }}
        >
          BASE AÉREA DE SANTA MARIA · RS
        </div>
      </div>
    </div>
  )
}

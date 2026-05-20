"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { alterarTrigrama, alterarMatricula, alterarSenhaPropria } from "./actions"
import { signOut } from "next-auth/react"

interface Props {
  trigrama: string
  matricula: string
  nome: string
  role: string
}

const inp: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: 7,
  color: "var(--text-primary)",
  padding: "0.5rem 0.75rem",
  fontSize: "0.82rem",
  outline: "none",
  boxSizing: "border-box",
}

const label: React.CSSProperties = {
  color: "var(--text-dim)",
  fontSize: "0.58rem",
  letterSpacing: "0.1em",
  fontWeight: 700,
  display: "block",
  marginBottom: 4,
}

function SectionHeader({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "0.6rem 0",
        borderBottom: "1px solid var(--border)",
        marginBottom: open ? "0.9rem" : 0,
      }}
    >
      <span style={{ color: "var(--text-dim)", fontSize: "0.6rem", letterSpacing: "0.12em", fontWeight: 700 }}>
        {title}
      </span>
      <span style={{ color: "var(--text-dim)", fontSize: "0.65rem" }}>{open ? "▲" : "▼"}</span>
    </button>
  )
}

export default function PerfilEditor({ trigrama, matricula, nome, role }: Props) {
  const router = useRouter()
  const [openSection, setOpenSection] = useState<"trigrama" | "login" | "senha" | null>(null)

  // Trigrama
  const [novoTrigrama, setNovoTrigrama] = useState("")
  const [senhaTrig, setSenhaTrig] = useState("")
  const [erroTrig, setErroTrig] = useState("")
  const [okTrig, setOkTrig] = useState(false)
  const [pendingTrig, startTrig] = useTransition()

  // Matrícula
  const [novaMatricula, setNovaMatricula] = useState("")
  const [senhaLog, setSenhaLog] = useState("")
  const [erroLog, setErroLog] = useState("")
  const [okLog, setOkLog] = useState(false)
  const [pendingLog, startLog] = useTransition()

  // Senha
  const [senhaAtual, setSenhaAtual] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmSenha, setConfirmSenha] = useState("")
  const [erroSenha, setErroSenha] = useState("")
  const [okSenha, setOkSenha] = useState(false)
  const [pendingSenha, startSenha] = useTransition()

  function toggle(s: typeof openSection) {
    setOpenSection(prev => (prev === s ? null : s))
  }

  function salvarTrigrama() {
    setErroTrig(""); setOkTrig(false)
    startTrig(async () => {
      const r = await alterarTrigrama(senhaTrig, novoTrigrama)
      if (r.error) { setErroTrig(r.error) } else {
        setOkTrig(true); setNovoTrigrama(""); setSenhaTrig(""); router.refresh()
      }
    })
  }

  function salvarLogin() {
    setErroLog(""); setOkLog(false)
    startLog(async () => {
      const r = await alterarMatricula(senhaLog, novaMatricula)
      if (r.error) { setErroLog(r.error) } else {
        setOkLog(true); setNovaMatricula(""); setSenhaLog("")
      }
    })
  }

  function salvarSenha() {
    setErroSenha(""); setOkSenha(false)
    if (novaSenha !== confirmSenha) { setErroSenha("As senhas não coincidem."); return }
    startSenha(async () => {
      const r = await alterarSenhaPropria(senhaAtual, novaSenha)
      if (r.error) { setErroSenha(r.error) } else {
        setOkSenha(true); setSenhaAtual(""); setNovaSenha(""); setConfirmSenha("")
      }
    })
  }

  return (
    <div>
      {/* Dados atuais */}
      <div
        className="card-mil"
        style={{ padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1.25rem" }}
      >
        <div
          style={{
            background: "var(--gold-dim)",
            border: "1px solid var(--border-gold)",
            borderRadius: 8,
            padding: "6px 14px",
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          <div style={{ color: "var(--gold-bright)", fontFamily: "monospace", fontWeight: 800, fontSize: "1.3rem", letterSpacing: "0.12em" }}>
            {trigrama}
          </div>
          <div style={{ color: "var(--text-dim)", fontSize: "0.52rem", letterSpacing: "0.1em" }}>TRIGRAMA</div>
        </div>
        <div>
          <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.9rem" }}>{nome}</div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontFamily: "monospace", marginTop: 2 }}>{matricula}</div>
          <div style={{ color: "var(--text-dim)", fontSize: "0.62rem", marginTop: 2 }}>{role}</div>
        </div>
      </div>

      {/* Aviso re-login */}
      <p style={{ color: "var(--text-dim)", fontSize: "0.68rem", marginBottom: "1.25rem", fontStyle: "italic" }}>
        Alterações de trigrama e login exigem novo acesso para refletir no cabeçalho.
      </p>

      <div className="card-mil" style={{ padding: "0.75rem 1.25rem" }}>

        {/* ── Trigrama ── */}
        <SectionHeader title="ALTERAR TRIGRAMA" open={openSection === "trigrama"} onToggle={() => toggle("trigrama")} />
        {openSection === "trigrama" && (
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={label}>NOVO TRIGRAMA</label>
                <input
                  value={novoTrigrama}
                  onChange={e => setNovoTrigrama(e.target.value.toUpperCase())}
                  maxLength={3}
                  placeholder="XXX"
                  style={{ ...inp, fontFamily: "monospace", fontWeight: 800, fontSize: "1rem", letterSpacing: "0.12em", textTransform: "uppercase" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={label}>SENHA ATUAL</label>
                <input
                  type="password"
                  value={senhaTrig}
                  onChange={e => setSenhaTrig(e.target.value)}
                  placeholder="Confirmar identidade"
                  style={inp}
                />
              </div>
            </div>
            {erroTrig && <p style={{ color: "var(--red-text)", fontSize: "0.7rem", marginBottom: 6 }}>{erroTrig}</p>}
            {okTrig && <p style={{ color: "var(--green-text)", fontSize: "0.7rem", marginBottom: 6 }}>Trigrama alterado. Faça novo acesso para atualizar o cabeçalho.</p>}
            <button
              onClick={salvarTrigrama}
              disabled={pendingTrig || !novoTrigrama.trim() || !senhaTrig}
              className="btn-primary"
              style={{ fontSize: "0.7rem", padding: "5px 16px" }}
            >
              {pendingTrig ? "..." : "Salvar Trigrama"}
            </button>
          </div>
        )}

        {/* ── Login ── */}
        <SectionHeader title="ALTERAR LOGIN (MATRÍCULA)" open={openSection === "login"} onToggle={() => toggle("login")} />
        {openSection === "login" && (
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={label}>NOVA MATRÍCULA</label>
                <input
                  value={novaMatricula}
                  onChange={e => setNovaMatricula(e.target.value)}
                  placeholder="ex: joao.silva"
                  style={{ ...inp, fontFamily: "monospace" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={label}>SENHA ATUAL</label>
                <input
                  type="password"
                  value={senhaLog}
                  onChange={e => setSenhaLog(e.target.value)}
                  placeholder="Confirmar identidade"
                  style={inp}
                />
              </div>
            </div>
            {erroLog && <p style={{ color: "var(--red-text)", fontSize: "0.7rem", marginBottom: 6 }}>{erroLog}</p>}
            {okLog && (
              <p style={{ color: "var(--green-text)", fontSize: "0.7rem", marginBottom: 6 }}>
                Login alterado. Faça novo acesso com a nova matrícula.{" "}
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  style={{ color: "var(--gold)", background: "none", border: "none", cursor: "pointer", fontSize: "0.7rem", textDecoration: "underline" }}
                >
                  Sair agora
                </button>
              </p>
            )}
            <button
              onClick={salvarLogin}
              disabled={pendingLog || !novaMatricula.trim() || !senhaLog}
              className="btn-primary"
              style={{ fontSize: "0.7rem", padding: "5px 16px" }}
            >
              {pendingLog ? "..." : "Salvar Login"}
            </button>
          </div>
        )}

        {/* ── Senha ── */}
        <SectionHeader title="ALTERAR SENHA" open={openSection === "senha"} onToggle={() => toggle("senha")} />
        {openSection === "senha" && (
          <div style={{ marginBottom: "0.5rem" }}>
            <div style={{ marginBottom: 8 }}>
              <label style={label}>SENHA ATUAL</label>
              <input type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} placeholder="Senha atual" style={inp} />
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={label}>NOVA SENHA</label>
                <input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="Mín. 6 caracteres" style={inp} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={label}>CONFIRMAR NOVA SENHA</label>
                <input type="password" value={confirmSenha} onChange={e => setConfirmSenha(e.target.value)} placeholder="Repetir nova senha" style={inp} />
              </div>
            </div>
            {erroSenha && <p style={{ color: "var(--red-text)", fontSize: "0.7rem", marginBottom: 6 }}>{erroSenha}</p>}
            {okSenha && <p style={{ color: "var(--green-text)", fontSize: "0.7rem", marginBottom: 6 }}>Senha alterada com sucesso.</p>}
            <button
              onClick={salvarSenha}
              disabled={pendingSenha || !senhaAtual || !novaSenha || !confirmSenha}
              className="btn-primary"
              style={{ fontSize: "0.7rem", padding: "5px 16px" }}
            >
              {pendingSenha ? "..." : "Salvar Senha"}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

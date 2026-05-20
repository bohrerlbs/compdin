"use client"

import { useState } from "react"
import { adicionarCartaoNaInspecao, excluirCartaoExtra } from "./subsistema-actions"
import { TipoCartao } from "@prisma/client"
import { useRouter } from "next/navigation"

const TIPOS: { value: TipoCartao; label: string }[] = [
  { value: "VISUAL_CHECK", label: "Visual Check" },
  { value: "DETAILED_INSPECTION", label: "Detailed Inspection" },
  { value: "SPECIAL_DETAILED_INSPECTION", label: "Special Detailed Inspection" },
  { value: "SERVICE", label: "Service" },
  { value: "LUBRIFICATION", label: "Lubrification" },
  { value: "BIM_CHECK", label: "BIM Check" },
  { value: "TAP_TEST", label: "Tap Test" },
  { value: "OIL_SAMPLE", label: "Oil Sample" },
]

const inp: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  color: "var(--text-primary)",
  padding: "0.4rem 0.6rem",
  fontSize: "0.78rem",
  outline: "none",
  boxSizing: "border-box",
}

interface Props {
  inspecaoId: string
  sistemaId: string
  subsistemaId: string
  extraCartoes: { id: string; codigo: string; nomePt: string }[]
}

export default function AdicionarCartaoForm({
  inspecaoId,
  sistemaId,
  subsistemaId,
  extraCartoes,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [codigo, setCodigo] = useState("")
  const [nomePt, setNomePt] = useState("")
  const [tipo, setTipo] = useState<TipoCartao>("VISUAL_CHECK")
  const [descricao, setDescricao] = useState("")
  const [permanente, setPermanente] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState("")
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  async function handleAdicionar() {
    if (!codigo.trim() || !nomePt.trim() || !descricao.trim()) {
      setErr("Preencha todos os campos obrigatórios.")
      return
    }
    setSaving(true)
    setErr("")
    const res = await adicionarCartaoNaInspecao({
      inspecaoId,
      subsistemaId,
      sistemaId,
      codigo,
      nomePt,
      tipo,
      descricaoSubitem: descricao,
      permanente,
    })
    setSaving(false)
    if (res.error) { setErr(res.error); return }
    setCodigo(""); setNomePt(""); setDescricao(""); setPermanente(false); setOpen(false)
    router.refresh()
  }

  async function handleExcluir(cartaoId: string) {
    const res = await excluirCartaoExtra(cartaoId, inspecaoId, sistemaId, subsistemaId)
    if (res.error) { setErr(res.error); return }
    setConfirmDelete(null)
    router.refresh()
  }

  return (
    <div style={{ marginTop: "1.5rem" }}>
      {/* Extra cards list */}
      {extraCartoes.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ color: "var(--text-dim)", fontSize: "0.58rem", letterSpacing: "0.1em", marginBottom: 6 }}>
            CARTÕES EXTRAS NESTA INSPEÇÃO
          </p>
          {extraCartoes.map((c) => (
            <div key={c.id}>
              {confirmDelete === c.id ? (
                <div style={{
                  padding: "0.5rem 0.75rem",
                  background: "rgba(127,29,29,0.2)",
                  border: "1px solid rgba(248,113,113,0.3)",
                  borderRadius: 8,
                  marginBottom: 6,
                }}>
                  <p style={{ color: "var(--red-text)", fontSize: "0.72rem", marginBottom: 6 }}>
                    Excluir &quot;{c.codigo} – {c.nomePt}&quot;?
                  </p>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => handleExcluir(c.id)}
                      style={{ fontSize: "0.68rem", padding: "3px 10px", background: "rgba(127,29,29,0.5)", border: "1px solid rgba(248,113,113,0.4)", borderRadius: 6, color: "var(--red-text)", cursor: "pointer" }}
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      style={{ fontSize: "0.68rem", padding: "3px 10px", background: "none", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-muted)", cursor: "pointer" }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.4rem 0.75rem",
                  background: "rgba(190,148,50,0.06)",
                  border: "1px solid var(--border-gold)",
                  borderRadius: 8,
                  marginBottom: 6,
                }}>
                  <span style={{ color: "var(--text-primary)", fontSize: "0.75rem" }}>
                    <span style={{ fontFamily: "monospace", color: "var(--gold)", marginRight: 6 }}>{c.codigo}</span>
                    {c.nomePt}
                  </span>
                  <button
                    onClick={() => setConfirmDelete(c.id)}
                    style={{ fontSize: "0.6rem", color: "rgba(220,80,80,0.7)", background: "none", border: "none", cursor: "pointer" }}
                  >
                    excluir
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      {!open ? (
        <button
          onClick={() => { setOpen(true); setErr("") }}
          style={{
            width: "100%",
            padding: "8px",
            background: "rgba(190,148,50,0.08)",
            border: "1px dashed var(--border-gold)",
            borderRadius: 10,
            color: "var(--gold)",
            fontSize: "0.72rem",
            letterSpacing: "0.06em",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          + Adicionar Cartão Extra
        </button>
      ) : (
        <div style={{
          padding: "0.85rem 1rem",
          background: "var(--bg-card)",
          border: "1px solid var(--border-gold)",
          borderRadius: 10,
        }}>
          <p style={{ color: "var(--gold-bright)", fontSize: "0.62rem", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 12 }}>
            NOVO CARTÃO EXTRA
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8, marginBottom: 8 }}>
            <div>
              <label style={{ color: "var(--text-dim)", fontSize: "0.56rem", letterSpacing: "0.08em", display: "block", marginBottom: 2 }}>CÓDIGO *</label>
              <input value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())} style={inp} placeholder="ex: EXTRA-01" maxLength={20} />
            </div>
            <div>
              <label style={{ color: "var(--text-dim)", fontSize: "0.56rem", letterSpacing: "0.08em", display: "block", marginBottom: 2 }}>TIPO *</label>
              <select value={tipo} onChange={e => setTipo(e.target.value as TipoCartao)} style={{ ...inp, cursor: "pointer" }}>
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ color: "var(--text-dim)", fontSize: "0.56rem", letterSpacing: "0.08em", display: "block", marginBottom: 2 }}>NOME DO CARTÃO *</label>
            <input value={nomePt} onChange={e => setNomePt(e.target.value)} style={inp} placeholder="Descrição do serviço" maxLength={200} />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ color: "var(--text-dim)", fontSize: "0.56rem", letterSpacing: "0.08em", display: "block", marginBottom: 2 }}>DESCRIÇÃO DO SUBITEM A *</label>
            <textarea
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              style={{ ...inp, minHeight: 60, resize: "vertical" }}
              placeholder="Descreva a tarefa a executar..."
              maxLength={500}
            />
          </div>

          {/* Permanente toggle */}
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 12, padding: "0.5rem 0.6rem", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 6 }}>
            <input
              type="checkbox"
              checked={permanente}
              onChange={e => setPermanente(e.target.checked)}
              style={{ accentColor: "var(--gold)", width: 14, height: 14 }}
            />
            <div>
              <span style={{ color: "var(--text-primary)", fontSize: "0.75rem" }}>Adicionar permanentemente ao catálogo</span>
              <p style={{ color: "var(--text-dim)", fontSize: "0.62rem", marginTop: 1 }}>
                {permanente
                  ? "Será incluído em todas as futuras inspeções deste tipo neste subsistema."
                  : "Apenas nesta inspeção. Não aparecerá em inspeções futuras."}
              </p>
            </div>
          </label>

          {err && <p style={{ color: "var(--red-text)", fontSize: "0.7rem", marginBottom: 8 }}>{err}</p>}

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleAdicionar}
              disabled={saving}
              className="btn-primary"
              style={{ flex: 1, fontSize: "0.72rem", padding: "7px" }}
            >
              {saving ? "Adicionando..." : "Adicionar Cartão"}
            </button>
            <button
              onClick={() => { setOpen(false); setErr("") }}
              style={{ fontSize: "0.72rem", padding: "7px 16px", background: "none", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-muted)", cursor: "pointer" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useTransition } from "react"
import { deletarProcedimento, editarProcedimento, adicionarImagem, removerImagem } from "./actions"

interface Imagem {
  id: string
  url: string
  legenda: string | null
  ordem: number
}

interface Procedimento {
  id: string
  titulo: string
  descricao: string | null
  autorId: string
  autorTrigrama: string
  autorNome: string
  criadoEm: string
  imagens: Imagem[]
}

interface Props {
  proc: Procedimento
  userId: string
  userRole: string
  onRemovido: (id: string) => void
  onAtualizado: (p: Procedimento) => void
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

function podeDeletar(autorId: string, userId: string, role: string) {
  return autorId === userId || role === "ADMIN" || role === "ENCARREGADO"
}

export default function ProcedimentoCard({ proc, userId, userRole, onRemovido, onAtualizado }: Props) {
  const [expandido, setExpandido] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)
  const [editando, setEditando] = useState(false)
  const [editTitulo, setEditTitulo] = useState(proc.titulo)
  const [editDesc, setEditDesc] = useState(proc.descricao ?? "")
  const [erroEdit, setErroEdit] = useState("")
  const [pendingEdit, startEdit] = useTransition()

  const [addUrl, setAddUrl] = useState("")
  const [addLeg, setAddLeg] = useState("")
  const [showAddImg, setShowAddImg] = useState(false)
  const [erroImg, setErroImg] = useState("")
  const [pendingImg, startImg] = useTransition()

  const [confirmarDel, setConfirmarDel] = useState(false)
  const [pendingDel, startDel] = useTransition()

  const canEdit = podeDeletar(proc.autorId, userId, userRole)
  const imagens = proc.imagens

  function salvarEdit() {
    setErroEdit("")
    startEdit(async () => {
      const r = await editarProcedimento(proc.id, editTitulo, editDesc)
      if (r.error) { setErroEdit(r.error) } else {
        onAtualizado({ ...proc, titulo: editTitulo.trim(), descricao: editDesc.trim() || null })
        setEditando(false)
      }
    })
  }

  function handleDeletar() {
    startDel(async () => {
      const r = await deletarProcedimento(proc.id)
      if (!r.error) onRemovido(proc.id)
    })
  }

  function addImagem() {
    setErroImg("")
    startImg(async () => {
      const r = await adicionarImagem(proc.id, addUrl, addLeg)
      if (r.error) { setErroImg(r.error) } else {
        const novaImg = { id: Date.now().toString(), url: addUrl.trim(), legenda: addLeg.trim() || null, ordem: imagens.length }
        onAtualizado({ ...proc, imagens: [...imagens, novaImg] })
        setAddUrl(""); setAddLeg(""); setShowAddImg(false)
      }
    })
  }

  function remImg(imgId: string) {
    startImg(async () => {
      const r = await removerImagem(imgId)
      if (!r.error) {
        const novas = imagens.filter(i => i.id !== imgId)
        onAtualizado({ ...proc, imagens: novas })
        if (imgIdx >= novas.length) setImgIdx(Math.max(0, novas.length - 1))
      }
    })
  }

  return (
    <div
      className="card-mil"
      style={{ padding: 0, overflow: "hidden" }}
    >
      {/* Cabeçalho clicável */}
      <button
        onClick={() => { setExpandido(!expandido); setImgIdx(0) }}
        style={{
          width: "100%",
          padding: "0.85rem 1rem",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          textAlign: "left",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.9rem", marginBottom: 2 }}>
            {proc.titulo}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontFamily: "monospace",
              fontWeight: 800,
              fontSize: "0.65rem",
              color: "var(--gold-bright)",
              background: "var(--gold-dim)",
              border: "1px solid var(--border-gold)",
              borderRadius: 4,
              padding: "0px 5px",
            }}>{proc.autorTrigrama}</span>
            <span style={{ color: "var(--text-dim)", fontSize: "0.65rem" }}>
              {new Date(proc.criadoEm).toLocaleDateString("pt-BR")}
            </span>
            {imagens.length > 0 && (
              <span style={{ color: "var(--text-dim)", fontSize: "0.62rem" }}>
                · {imagens.length} imagem{imagens.length !== 1 ? "ns" : ""}
              </span>
            )}
          </div>
        </div>
        <span style={{ color: "var(--text-dim)", fontSize: "0.7rem", flexShrink: 0 }}>{expandido ? "▲" : "▼"}</span>
      </button>

      {/* Conteúdo expandido */}
      {expandido && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "0.85rem 1rem" }}>

          {/* Editar formulário */}
          {editando ? (
            <div style={{ marginBottom: "1rem" }}>
              <input
                value={editTitulo}
                onChange={e => setEditTitulo(e.target.value)}
                placeholder="Título *"
                style={{ ...inp, marginBottom: 6, fontWeight: 700 }}
              />
              <textarea
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                placeholder="Descrição / procedimento..."
                rows={5}
                style={{ ...inp, resize: "vertical", marginBottom: 6, fontFamily: "inherit", lineHeight: 1.5 }}
              />
              {erroEdit && <p style={{ color: "var(--red-text)", fontSize: "0.7rem", marginBottom: 4 }}>{erroEdit}</p>}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={salvarEdit} disabled={pendingEdit || !editTitulo.trim()} className="btn-primary" style={{ flex: 1, fontSize: "0.7rem", padding: "4px" }}>
                  {pendingEdit ? "..." : "Salvar"}
                </button>
                <button onClick={() => { setEditando(false); setEditTitulo(proc.titulo); setEditDesc(proc.descricao ?? "") }} className="btn-ghost" style={{ fontSize: "0.7rem", padding: "4px 10px" }}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              {proc.descricao && (
                <p style={{ color: "var(--text-primary)", fontSize: "0.85rem", lineHeight: 1.6, margin: "0 0 0.85rem", whiteSpace: "pre-wrap" }}>
                  {proc.descricao}
                </p>
              )}
            </>
          )}

          {/* Galeria de imagens */}
          {imagens.length > 0 && !editando && (
            <div style={{ marginBottom: "0.85rem" }}>
              {/* Imagem principal */}
              <div style={{ position: "relative", marginBottom: 6 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagens[imgIdx].url}
                  alt={imagens[imgIdx].legenda ?? `Imagem ${imgIdx + 1}`}
                  style={{
                    width: "100%",
                    maxHeight: 360,
                    objectFit: "contain",
                    borderRadius: 8,
                    background: "rgba(0,0,0,0.4)",
                    display: "block",
                  }}
                  onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                />
                {canEdit && (
                  <button
                    onClick={() => remImg(imagens[imgIdx].id)}
                    disabled={pendingImg}
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      background: "rgba(220,80,80,0.75)",
                      border: "none",
                      borderRadius: 5,
                      color: "#fff",
                      fontSize: "0.65rem",
                      padding: "2px 8px",
                      cursor: "pointer",
                    }}
                  >
                    remover
                  </button>
                )}
              </div>
              {imagens[imgIdx].legenda && (
                <p style={{ color: "var(--text-dim)", fontSize: "0.72rem", textAlign: "center", margin: "0 0 6px", fontStyle: "italic" }}>
                  {imagens[imgIdx].legenda}
                </p>
              )}
              {/* Navegação */}
              {imagens.length > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
                  <button
                    onClick={() => setImgIdx(i => (i - 1 + imagens.length) % imagens.length)}
                    style={{ background: "none", border: "1px solid var(--border)", borderRadius: 5, color: "var(--text-muted)", padding: "2px 10px", cursor: "pointer", fontSize: "0.8rem" }}
                  >
                    ‹
                  </button>
                  <span style={{ color: "var(--text-dim)", fontSize: "0.65rem" }}>
                    {imgIdx + 1} / {imagens.length}
                  </span>
                  <button
                    onClick={() => setImgIdx(i => (i + 1) % imagens.length)}
                    style={{ background: "none", border: "1px solid var(--border)", borderRadius: 5, color: "var(--text-muted)", padding: "2px 10px", cursor: "pointer", fontSize: "0.8rem" }}
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Adicionar imagem */}
          {canEdit && !editando && (
            <div style={{ marginBottom: "0.85rem" }}>
              {showAddImg ? (
                <div style={{ padding: "0.6rem 0.75rem", background: "rgba(190,148,50,0.05)", border: "1px dashed var(--border-gold)", borderRadius: 7 }}>
                  <label style={{ color: "var(--text-dim)", fontSize: "0.58rem", letterSpacing: "0.08em", display: "block", marginBottom: 3 }}>URL DA IMAGEM</label>
                  <input value={addUrl} onChange={e => setAddUrl(e.target.value)} placeholder="https://..." style={{ ...inp, marginBottom: 5, fontFamily: "monospace", fontSize: "0.75rem" }} />
                  <label style={{ color: "var(--text-dim)", fontSize: "0.58rem", letterSpacing: "0.08em", display: "block", marginBottom: 3 }}>LEGENDA (opcional)</label>
                  <input value={addLeg} onChange={e => setAddLeg(e.target.value)} placeholder="Ex: Posição da vedação após instalação" style={{ ...inp, marginBottom: 5 }} />
                  {erroImg && <p style={{ color: "var(--red-text)", fontSize: "0.7rem", marginBottom: 4 }}>{erroImg}</p>}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={addImagem} disabled={pendingImg || !addUrl.trim()} className="btn-primary" style={{ flex: 1, fontSize: "0.65rem", padding: "3px" }}>
                      {pendingImg ? "..." : "Adicionar"}
                    </button>
                    <button onClick={() => { setShowAddImg(false); setAddUrl(""); setAddLeg(""); setErroImg("") }} className="btn-ghost" style={{ fontSize: "0.65rem", padding: "3px 8px" }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddImg(true)}
                  style={{ fontSize: "0.65rem", color: "var(--text-dim)", background: "none", border: "1px dashed var(--border)", borderRadius: 6, padding: "4px 12px", cursor: "pointer", width: "100%" }}
                >
                  + adicionar imagem
                </button>
              )}
            </div>
          )}

          {/* Ações: editar / excluir */}
          {canEdit && !editando && (
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.6rem", display: "flex", gap: 10, alignItems: "center" }}>
              <button
                onClick={() => { setEditando(true); setConfirmarDel(false) }}
                style={{ fontSize: "0.62rem", color: "var(--text-muted)", background: "none", border: "1px solid var(--border)", borderRadius: 5, padding: "2px 10px", cursor: "pointer" }}
              >
                editar
              </button>
              {!confirmarDel ? (
                <button
                  onClick={() => setConfirmarDel(true)}
                  style={{ fontSize: "0.62rem", color: "rgba(220,80,80,0.7)", background: "none", border: "1px solid rgba(220,80,80,0.25)", borderRadius: 5, padding: "2px 10px", cursor: "pointer" }}
                >
                  excluir
                </button>
              ) : (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ color: "var(--red-text)", fontSize: "0.65rem" }}>Confirmar?</span>
                  <button onClick={handleDeletar} disabled={pendingDel} style={{ fontSize: "0.62rem", color: "var(--red-text)", background: "rgba(220,80,80,0.15)", border: "1px solid rgba(220,80,80,0.4)", borderRadius: 5, padding: "2px 8px", cursor: "pointer" }}>
                    {pendingDel ? "..." : "Sim"}
                  </button>
                  <button onClick={() => setConfirmarDel(false)} className="btn-ghost" style={{ fontSize: "0.62rem", padding: "2px 8px" }}>Não</button>
                </div>
              )}
              <span style={{ color: "var(--text-dim)", fontSize: "0.58rem", marginLeft: "auto" }}>
                por {proc.autorNome}
              </span>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

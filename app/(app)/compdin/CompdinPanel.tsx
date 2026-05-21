"use client"

import { useState } from "react"
import { criarTarefa, atualizarStatusTarefa, editarTarefa, deletarTarefa, editarDatasTarefa } from "./actions"
import { StatusTarefa } from "@prisma/client"

interface Tarefa {
  id: string
  titulo: string
  descricao: string | null
  status: StatusTarefa
  autorId: string
  responsavelId: string | null
  iniciadoEm: Date | null
  concluidoEm: Date | null
  criadoEm: Date
  autor: { trigrama: string }
  responsavel: { trigrama: string } | null
  mecanicos: Array<{ mecanico: { id: string; trigrama: string; nome: string } }>
}

interface Props {
  tarefas: Tarefa[]
  userId: string
  userRole: string
  todosMecanicos?: Array<{ id: string; trigrama: string; nome: string }>
}

const PRIVILEGED = ["ADMIN", "ENCARREGADO", "INSPETOR"]

function fmtHora(d: Date) {
  const dt = new Date(d)
  return `${dt.getDate().toString().padStart(2, "0")}/${(dt.getMonth() + 1).toString().padStart(2, "0")} ${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`
}

function fmtLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

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

function StatusBadge({ status }: { status: StatusTarefa }) {
  const cfg = {
    PENDENTE: { bg: "rgba(30,40,60,0.8)", border: "var(--border)", color: "var(--text-dim)", label: "PENDENTE" },
    INICIADA: { bg: "rgba(180,83,9,0.2)", border: "rgba(251,191,36,0.3)", color: "var(--yellow-text)", label: "INICIADA" },
    CONCLUIDA: { bg: "rgba(39,98,58,0.3)", border: "rgba(74,222,128,0.25)", color: "var(--green-text)", label: "CONCLUÍDA" },
  }[status]

  return (
    <span style={{
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      color: cfg.color,
      fontSize: "0.55rem",
      fontWeight: 700,
      letterSpacing: "0.08em",
      padding: "2px 6px",
      borderRadius: 4,
      flexShrink: 0,
    }}>
      {cfg.label}
    </span>
  )
}

export default function CompdinPanel({ tarefas: initial, userId, userRole, todosMecanicos = [] }: Props) {
  const [tarefas, setTarefas] = useState(initial)
  const [criando, setCriando] = useState(false)
  const [novoTitulo, setNovoTitulo] = useState("")
  const [novaDescricao, setNovaDescricao] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitulo, setEditTitulo] = useState("")
  const [editDescricao, setEditDescricao] = useState("")
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [err, setErr] = useState("")
  const [showConcluidas, setShowConcluidas] = useState(false)
  const [pendingDate, setPendingDate] = useState<{ id: string; status: "INICIADA" | "CONCLUIDA" } | null>(null)
  const [dateInput, setDateInput] = useState("")
  const [mecsSelecionados, setMecsSelecionados] = useState<string[]>([])
  const [editDatasId, setEditDatasId] = useState<string | null>(null)
  const [editInicio, setEditInicio] = useState("")
  const [editConclusao, setEditConclusao] = useState("")
  const [erroDatas, setErroDatas] = useState("")

  const ativas = tarefas.filter((t) => t.status !== "CONCLUIDA")
  const concluidas = tarefas.filter((t) => t.status === "CONCLUIDA")

  async function handleCriar() {
    if (!novoTitulo.trim()) { setErr("Título obrigatório."); return }
    setSalvando(true); setErr("")
    const res = await criarTarefa(novoTitulo, novaDescricao)
    setSalvando(false)
    if (res.error) { setErr(res.error); return }
    setNovoTitulo(""); setNovaDescricao(""); setCriando(false)
    window.location.reload()
  }

  function handleClickStatus(tarefa: Tarefa, novoStatus: "INICIADA" | "CONCLUIDA") {
    setPendingDate({ id: tarefa.id, status: novoStatus })
    setDateInput(fmtLocalInput(new Date()))
    setMecsSelecionados([userId])
    setErroDatas("")
  }

  async function handleConfirmarData() {
    if (!pendingDate) return
    const { id, status: novoStatus } = pendingDate
    const extras = mecsSelecionados.filter((mid) => mid !== userId)
    setPendingDate(null)
    const res = await atualizarStatusTarefa(id, novoStatus, dateInput, extras)
    if (res.error) { setErr(res.error); return }
    const dataEfetiva = dateInput ? new Date(dateInput) : new Date()
    setTarefas((prev) => prev.map((t) =>
      t.id === id
        ? {
            ...t,
            status: novoStatus,
            responsavelId: userId,
            responsavel: { trigrama: "..." },
            iniciadoEm: novoStatus === "INICIADA" ? dataEfetiva : t.iniciadoEm,
            concluidoEm: novoStatus === "CONCLUIDA" ? dataEfetiva : null,
            mecanicos: mecsSelecionados.map((mid) => {
              const u = todosMecanicos.find((m) => m.id === mid)
              return { mecanico: u ?? { id: mid, trigrama: "...", nome: "" } }
            }),
          }
        : t,
    ))
  }

  async function handleStatus(tarefa: Tarefa, novoStatus: StatusTarefa) {
    if (novoStatus === "PENDENTE") {
      const res = await atualizarStatusTarefa(tarefa.id, novoStatus)
      if (res.error) { setErr(res.error); return }
      setTarefas((prev) => prev.map((t) =>
        t.id === tarefa.id
          ? { ...t, status: novoStatus, responsavelId: null, responsavel: null, iniciadoEm: null, concluidoEm: null }
          : t,
      ))
    } else {
      handleClickStatus(tarefa, novoStatus as "INICIADA" | "CONCLUIDA")
    }
  }

  function handleAbrirEditDatas(tarefa: Tarefa) {
    setEditDatasId(tarefa.id)
    setEditInicio(tarefa.iniciadoEm ? fmtLocalInput(tarefa.iniciadoEm) : "")
    setEditConclusao(tarefa.concluidoEm ? fmtLocalInput(tarefa.concluidoEm) : "")
    setErroDatas("")
  }

  async function handleSalvarEditDatas(id: string) {
    const res = await editarDatasTarefa(id, editInicio || null, editConclusao || null)
    if (res.error) { setErroDatas(res.error); return }
    setEditDatasId(null)
    // Page will revalidate via revalidatePath in the action
    window.location.reload()
  }

  async function handleEditar(id: string) {
    if (!editTitulo.trim()) { setErr("Título obrigatório."); return }
    const res = await editarTarefa(id, editTitulo, editDescricao)
    if (res.error) { setErr(res.error); return }
    setTarefas((prev) => prev.map((t) => t.id === id ? { ...t, titulo: editTitulo, descricao: editDescricao || null } : t))
    setEditingId(null)
  }

  async function handleDeletar(id: string) {
    const res = await deletarTarefa(id)
    if (res.error) { setErr(res.error); return }
    setTarefas((prev) => prev.filter((t) => t.id !== id))
    setConfirmDelete(null)
  }

  const canModify = (t: Tarefa) => t.autorId === userId || PRIVILEGED.includes(userRole)
  const canReopen = () => PRIVILEGED.includes(userRole)

  function startEdit(t: Tarefa) {
    setEditingId(t.id)
    setEditTitulo(t.titulo)
    setEditDescricao(t.descricao ?? "")
    setErr("")
  }

  function renderTarefa(tarefa: Tarefa) {
    if (editingId === tarefa.id) {
      return (
        <div key={tarefa.id} style={{ padding: "0.75rem", background: "var(--bg-input)", border: "1px solid var(--border-gold)", borderRadius: 10 }}>
          <div style={{ marginBottom: 6 }}>
            <input value={editTitulo} onChange={e => setEditTitulo(e.target.value)} style={inp} maxLength={200} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <textarea value={editDescricao} onChange={e => setEditDescricao(e.target.value)} style={{ ...inp, minHeight: 48, resize: "vertical" }} maxLength={500} placeholder="Descrição (opcional)" />
          </div>
          {err && <p style={{ color: "var(--red-text)", fontSize: "0.7rem", marginBottom: 6 }}>{err}</p>}
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => handleEditar(tarefa.id)} className="btn-primary" style={{ flex: 1, fontSize: "0.7rem", padding: "5px" }}>Salvar</button>
            <button onClick={() => setEditingId(null)} style={{ fontSize: "0.7rem", padding: "5px 12px", background: "none", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-muted)", cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )
    }

    if (confirmDelete === tarefa.id) {
      return (
        <div key={tarefa.id} style={{ padding: "0.6rem 0.75rem", background: "rgba(127,29,29,0.2)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 10 }}>
          <p style={{ color: "var(--red-text)", fontSize: "0.72rem", marginBottom: 8 }}>Excluir &quot;{tarefa.titulo}&quot;?</p>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => handleDeletar(tarefa.id)} style={{ fontSize: "0.7rem", padding: "4px 12px", background: "rgba(127,29,29,0.5)", border: "1px solid rgba(248,113,113,0.4)", borderRadius: 6, color: "var(--red-text)", cursor: "pointer" }}>Confirmar</button>
            <button onClick={() => setConfirmDelete(null)} style={{ fontSize: "0.7rem", padding: "4px 12px", background: "none", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-muted)", cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )
    }

    const isDone = tarefa.status === "CONCLUIDA"
    const isStarted = tarefa.status === "INICIADA"
    const isPending = tarefa.status === "PENDENTE"

    return (
      <div key={tarefa.id} style={{
        padding: "0.65rem 0.85rem",
        background: isDone ? "rgba(39,98,58,0.08)" : isStarted ? "rgba(180,83,9,0.08)" : "var(--bg-card)",
        border: `1px solid ${isDone ? "rgba(74,222,128,0.2)" : isStarted ? "rgba(251,191,36,0.2)" : "var(--border)"}`,
        borderRadius: 10,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          {/* Status badge */}
          <StatusBadge status={tarefa.status} />

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: isDone ? "var(--text-muted)" : "var(--text-primary)", fontSize: "0.82rem", fontWeight: 500, lineHeight: 1.3, textDecoration: isDone ? "line-through" : "none" }}>
              {tarefa.titulo}
            </p>
            {tarefa.descricao && (
              <p style={{ color: "var(--text-dim)", fontSize: "0.7rem", marginTop: 2, lineHeight: 1.4 }}>
                {tarefa.descricao}
              </p>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
              <span style={{ color: "var(--text-dim)", fontSize: "0.6rem", fontFamily: "monospace", fontWeight: 700 }}>
                {tarefa.autor.trigrama}
              </span>
              {tarefa.mecanicos.length > 0 && (
                <>
                  <span style={{ color: "var(--text-dim)", fontSize: "0.58rem" }}>→</span>
                  {tarefa.mecanicos.map((m) => (
                    <span key={m.mecanico.id} style={{ color: isStarted ? "var(--yellow-text)" : "var(--green-text)", fontSize: "0.6rem", fontFamily: "monospace", fontWeight: 700 }}>
                      {m.mecanico.trigrama}
                    </span>
                  ))}
                </>
              )}
              {tarefa.mecanicos.length === 0 && tarefa.responsavel && tarefa.responsavelId !== tarefa.autorId && (
                <>
                  <span style={{ color: "var(--text-dim)", fontSize: "0.58rem" }}>→</span>
                  <span style={{ color: isStarted ? "var(--yellow-text)" : "var(--green-text)", fontSize: "0.6rem", fontFamily: "monospace", fontWeight: 700 }}>
                    {tarefa.responsavel.trigrama}
                  </span>
                </>
              )}
              {tarefa.concluidoEm && (
                <span style={{ color: "var(--green-text)", fontSize: "0.58rem" }}>{fmtHora(tarefa.concluidoEm)}</span>
              )}
              {!tarefa.concluidoEm && tarefa.iniciadoEm && (
                <span style={{ color: "var(--yellow-text)", fontSize: "0.58rem" }}>{fmtHora(tarefa.iniciadoEm)}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flexShrink: 0 }}>
            {isPending && pendingDate?.id !== tarefa.id && (
              <button
                onClick={() => handleClickStatus(tarefa, "INICIADA")}
                style={{ fontSize: "0.62rem", padding: "3px 8px", background: "rgba(180,83,9,0.2)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 5, color: "var(--yellow-text)", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Iniciar
              </button>
            )}
            {isStarted && pendingDate?.id !== tarefa.id && (
              <button
                onClick={() => handleClickStatus(tarefa, "CONCLUIDA")}
                style={{ fontSize: "0.62rem", padding: "3px 8px", background: "rgba(39,98,58,0.3)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 5, color: "var(--green-text)", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Concluir
              </button>
            )}
            {isDone && canReopen() && (
              <button
                onClick={() => handleStatus(tarefa, "PENDENTE")}
                style={{ fontSize: "0.6rem", padding: "3px 8px", background: "none", border: "1px solid var(--border)", borderRadius: 5, color: "var(--text-dim)", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Reabrir
              </button>
            )}
            {canModify(tarefa) && editDatasId !== tarefa.id && (
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => startEdit(tarefa)} style={{ fontSize: "0.58rem", color: "var(--text-dim)", background: "none", border: "none", cursor: "pointer", padding: "2px 3px" }}>editar</button>
                {(tarefa.iniciadoEm || tarefa.concluidoEm) && (
                  <button onClick={() => handleAbrirEditDatas(tarefa)} style={{ fontSize: "0.58rem", color: "var(--text-dim)", background: "none", border: "none", cursor: "pointer", padding: "2px 3px", textDecoration: "underline", textDecorationStyle: "dotted" }}>datas</button>
                )}
                <button onClick={() => setConfirmDelete(tarefa.id)} style={{ fontSize: "0.58rem", color: "rgba(220,80,80,0.6)", background: "none", border: "none", cursor: "pointer", padding: "2px 3px" }}>excluir</button>
              </div>
            )}
          </div>
        </div>

        {/* Date picker inline para INICIAR/CONCLUIR */}
        {pendingDate?.id === tarefa.id && (
          <div style={{
            marginTop: 8,
            padding: "0.65rem 0.75rem",
            background: pendingDate.status === "INICIADA" ? "rgba(180,83,9,0.12)" : "rgba(39,98,58,0.12)",
            border: `1px solid ${pendingDate.status === "INICIADA" ? "rgba(251,191,36,0.25)" : "rgba(74,222,128,0.2)"}`,
            borderRadius: 7,
          }}>
            <p style={{ color: "var(--text-dim)", fontSize: "0.6rem", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 700 }}>
              {pendingDate.status === "INICIADA" ? "DATA/HORA DE INÍCIO" : "DATA/HORA DE CONCLUSÃO"}
            </p>
            <input
              type="datetime-local"
              value={dateInput}
              onChange={e => setDateInput(e.target.value)}
              max={fmtLocalInput(new Date())}
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 5, color: "var(--text-primary)", padding: "0.3rem 0.5rem", fontSize: "0.75rem", outline: "none", width: "100%", boxSizing: "border-box", colorScheme: "dark" }}
            />
            {todosMecanicos.length > 1 && (
              <div style={{ marginTop: 8 }}>
                <p style={{ color: "var(--text-dim)", fontSize: "0.58rem", letterSpacing: "0.08em", marginBottom: 5, fontWeight: 700 }}>MECÂNICOS</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {todosMecanicos.map((m) => {
                    const isMe = m.id === userId
                    const checked = mecsSelecionados.includes(m.id)
                    return (
                      <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 7, cursor: isMe ? "default" : "pointer" }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={isMe}
                          onChange={() => {
                            if (isMe) return
                            setMecsSelecionados((prev) => prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id])
                          }}
                          style={{ accentColor: "var(--gold)", width: 13, height: 13, cursor: isMe ? "default" : "pointer" }}
                        />
                        <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "0.68rem", color: checked ? (pendingDate.status === "INICIADA" ? "var(--yellow-text)" : "var(--green-text)") : "var(--text-dim)", letterSpacing: "0.08em" }}>
                          {m.trigrama}
                        </span>
                        <span style={{ color: "var(--text-dim)", fontSize: "0.62rem" }}>{m.nome}{isMe ? " (você)" : ""}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button
                onClick={handleConfirmarData}
                disabled={!dateInput}
                style={{ flex: 1, fontSize: "0.68rem", fontWeight: 700, padding: "4px 8px", borderRadius: 5, border: "none", background: pendingDate.status === "INICIADA" ? "rgba(180,83,9,0.5)" : "rgba(39,98,58,0.6)", color: pendingDate.status === "INICIADA" ? "var(--yellow-text)" : "var(--green-text)", cursor: !dateInput ? "not-allowed" : "pointer", opacity: !dateInput ? 0.5 : 1 }}
              >
                {pendingDate.status === "INICIADA" ? "Iniciar" : "Concluir"}
              </button>
              <button
                onClick={() => setPendingDate(null)}
                style={{ fontSize: "0.68rem", padding: "4px 10px", borderRadius: 5, background: "none", border: "1px solid var(--border)", color: "var(--text-muted)", cursor: "pointer" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Editar datas existentes */}
        {editDatasId === tarefa.id && (
          <div style={{ marginTop: 8, padding: "0.65rem 0.75rem", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 7 }}>
            <p style={{ color: "var(--text-dim)", fontSize: "0.6rem", letterSpacing: "0.08em", marginBottom: 8, fontWeight: 700 }}>EDITAR DATAS</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {tarefa.iniciadoEm && (
                <div>
                  <label style={{ display: "block", color: "var(--text-dim)", fontSize: "0.58rem", letterSpacing: "0.08em", marginBottom: 3 }}>INÍCIO</label>
                  <input type="datetime-local" value={editInicio} onChange={e => setEditInicio(e.target.value)} max={fmtLocalInput(new Date())} style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 5, color: "var(--text-primary)", padding: "0.3rem 0.5rem", fontSize: "0.75rem", outline: "none", width: "100%", boxSizing: "border-box", colorScheme: "dark" }} />
                </div>
              )}
              {tarefa.concluidoEm && (
                <div>
                  <label style={{ display: "block", color: "var(--text-dim)", fontSize: "0.58rem", letterSpacing: "0.08em", marginBottom: 3 }}>CONCLUSÃO</label>
                  <input type="datetime-local" value={editConclusao} onChange={e => setEditConclusao(e.target.value)} max={fmtLocalInput(new Date())} style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 5, color: "var(--text-primary)", padding: "0.3rem 0.5rem", fontSize: "0.75rem", outline: "none", width: "100%", boxSizing: "border-box", colorScheme: "dark" }} />
                </div>
              )}
              {erroDatas && <p style={{ color: "var(--red-text)", fontSize: "0.65rem", margin: 0 }}>{erroDatas}</p>}
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => handleSalvarEditDatas(tarefa.id)} style={{ fontSize: "0.68rem", fontWeight: 700, padding: "4px 12px", borderRadius: 5, border: "none", background: "rgba(39,98,58,0.5)", color: "var(--green-text)", cursor: "pointer" }}>Salvar</button>
                <button onClick={() => setEditDatasId(null)} style={{ fontSize: "0.68rem", padding: "4px 10px", borderRadius: 5, background: "none", border: "1px solid var(--border)", color: "var(--text-muted)", cursor: "pointer" }}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ marginTop: "1.5rem", marginBottom: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "var(--text-dim)", fontSize: "0.6rem", letterSpacing: "0.12em", fontWeight: 700 }}>
            COMPDIN
          </span>
          {ativas.length > 0 && (
            <span style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              borderRadius: 9999,
              fontSize: "0.58rem",
              fontWeight: 700,
              padding: "1px 6px",
            }}>
              {ativas.length} ativa{ativas.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button
          onClick={() => { setCriando(!criando); setErr("") }}
          style={{ fontSize: "0.62rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.06em" }}
        >
          {criando ? "cancelar" : "+ nova tarefa"}
        </button>
      </div>

      {/* Create form */}
      {criando && (
        <div style={{ marginBottom: 10, padding: "0.75rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10 }}>
          <div style={{ marginBottom: 6 }}>
            <input
              value={novoTitulo}
              onChange={e => setNovoTitulo(e.target.value)}
              style={inp}
              placeholder="Descrição da tarefa*"
              maxLength={200}
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <textarea
              value={novaDescricao}
              onChange={e => setNovaDescricao(e.target.value)}
              style={{ ...inp, minHeight: 48, resize: "vertical" }}
              placeholder="Detalhes adicionais (opcional)"
              maxLength={500}
            />
          </div>
          {err && <p style={{ color: "var(--red-text)", fontSize: "0.7rem", marginBottom: 6 }}>{err}</p>}
          <button onClick={handleCriar} disabled={salvando} className="btn-primary" style={{ width: "100%", fontSize: "0.72rem", padding: "6px" }}>
            {salvando ? "Criando..." : "Criar Tarefa"}
          </button>
        </div>
      )}

      {/* Active tasks */}
      {ativas.length === 0 && !criando && (
        <p style={{ color: "var(--text-dim)", fontSize: "0.7rem", textAlign: "center", padding: "0.5rem 0" }}>
          Nenhuma tarefa ativa.
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {ativas.map(renderTarefa)}
      </div>

      {/* Concluídas (collapsible) */}
      {concluidas.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <button
            onClick={() => setShowConcluidas(!showConcluidas)}
            style={{ fontSize: "0.6rem", color: "var(--text-dim)", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.06em" }}
          >
            {showConcluidas ? "▲" : "▶"} {concluidas.length} concluída{concluidas.length !== 1 ? "s" : ""}
          </button>
          {showConcluidas && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
              {concluidas.map(renderTarefa)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

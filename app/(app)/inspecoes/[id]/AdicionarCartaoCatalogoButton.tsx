"use client"

import { useState, useTransition, useEffect } from "react"
import { adicionarCartaoCatalogo, adicionarCartaoNaInspecao, getSistemasCatalogo } from "./catalogo-inspecao-actions"
import { TipoCartao } from "@prisma/client"

type Sistema = Awaited<ReturnType<typeof getSistemasCatalogo>>[number]

const TIPO_CARTAO_LABEL: Record<string, string> = {
  VISUAL_CHECK: "Visual",
  DETAILED_INSPECTION: "Detalhada",
  SPECIAL_DETAILED_INSPECTION: "Esp. Detalhada",
  SERVICE: "Serviço",
  LUBRIFICATION: "Lubrificação",
  BIM_CHECK: "BIM",
  TAP_TEST: "Tap Test",
  OIL_SAMPLE: "Amostra Óleo",
}

const TIPOS_CARTAO: { value: TipoCartao; label: string }[] = [
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
  background: "var(--bg-input, #1a1a1a)",
  border: "1px solid var(--border, #333)",
  borderRadius: 6,
  color: "var(--text-primary, #fff)",
  padding: "0.4rem 0.6rem",
  fontSize: "0.78rem",
  outline: "none",
  boxSizing: "border-box",
}

export default function AdicionarCartaoCatalogoButton({
  inspecaoId,
  tipo,
}: {
  inspecaoId: string
  tipo: string
}) {
  const isMntNaoProg = tipo === "MNT_NAO_PROG"
  const isEspecial = tipo === "INSP_ESPECIAL" || isMntNaoProg

  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<"catalogo" | "novo">(isMntNaoProg ? "novo" : "catalogo")
  const [sistemas, setSistemas] = useState<Sistema[]>([])

  // Catalog state
  const [sistemaId, setSistemaId] = useState("")
  const [subsistemaId, setSubsistemaId] = useState("")
  const [cartaoId, setCartaoId] = useState("")
  const [catError, setCatError] = useState("")
  const [catSuccess, setCatSuccess] = useState("")
  const [isPendingCat, startCat] = useTransition()

  // New card state
  const [newSistemaId, setNewSistemaId] = useState("")
  const [newSubsistemaId, setNewSubsistemaId] = useState("")
  const [codigo, setCodigo] = useState("")
  const [nomePt, setNomePt] = useState("")
  const [novoTipo, setNovoTipo] = useState<TipoCartao>("VISUAL_CHECK")
  const [descricao, setDescricao] = useState("")
  const [permanente, setPermanente] = useState(false)
  const [newError, setNewError] = useState("")
  const [newSuccess, setNewSuccess] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && sistemas.length === 0) {
      getSistemasCatalogo().then(setSistemas)
    }
  }, [open])

  function handleOpen() {
    setOpen(true)
    setCatError(""); setCatSuccess(""); setNewError(""); setNewSuccess("")
    setSistemaId(""); setSubsistemaId(""); setCartaoId("")
    setNewSistemaId(""); setNewSubsistemaId("")
    setCodigo(""); setNomePt(""); setDescricao(""); setPermanente(false)
    if (isMntNaoProg) setTab("novo")
  }

  function handleSistemaChange(id: string) { setSistemaId(id); setSubsistemaId(""); setCartaoId("") }
  function handleSubsistemaChange(id: string) { setSubsistemaId(id); setCartaoId("") }
  function handleNewSistemaChange(id: string) { setNewSistemaId(id); setNewSubsistemaId("") }

  const catalogSistema = sistemas.find((s) => s.id === sistemaId)
  const catalogSubsistema = catalogSistema?.subsistemas.find((s) => s.id === subsistemaId)
  const newSistema = sistemas.find((s) => s.id === newSistemaId)

  function handleAdicionar() {
    if (!cartaoId) return
    setCatError(""); setCatSuccess("")
    startCat(async () => {
      const result = await adicionarCartaoCatalogo(inspecaoId, cartaoId)
      if (result.error) { setCatError(result.error) }
      else { setCatSuccess("Cartão adicionado à inspeção."); setCartaoId("") }
    })
  }

  async function handleAdicionarNovo() {
    if (!newSubsistemaId || !codigo.trim() || !nomePt.trim() || !descricao.trim()) {
      setNewError("Preencha todos os campos.")
      return
    }
    setSaving(true); setNewError(""); setNewSuccess("")
    const res = await adicionarCartaoNaInspecao({
      inspecaoId,
      subsistemaId: newSubsistemaId,
      sistemaId: newSistemaId,
      codigo,
      nomePt,
      tipo: novoTipo,
      descricaoSubitem: descricao,
      permanente,
    })
    setSaving(false)
    if (res.error) { setNewError(res.error) }
    else {
      setNewSuccess("Cartão criado e adicionado.")
      setNewSistemaId(""); setNewSubsistemaId("")
      setCodigo(""); setNomePt(""); setDescricao(""); setPermanente(false)
    }
  }

  if (!isEspecial) {
    return (
      <details className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <summary className="px-4 py-3 text-sm text-gray-400 cursor-pointer select-none hover:text-white list-none flex items-center gap-2"
          onClick={() => { if (sistemas.length === 0) getSistemasCatalogo().then(setSistemas) }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adicionar cartão do catálogo
        </summary>
        <div className="px-4 pb-4 pt-2">
          <CatalogoSelector
            sistemas={sistemas}
            sistemaId={sistemaId}
            subsistemaId={subsistemaId}
            cartaoId={cartaoId}
            catalogSistema={catalogSistema}
            catalogSubsistema={catalogSubsistema}
            onSistemaChange={handleSistemaChange}
            onSubsistemaChange={handleSubsistemaChange}
            onCartaoChange={setCartaoId}
            onAdicionar={handleAdicionar}
            isPending={isPendingCat}
            error={catError}
            success={catSuccess}
          />
        </div>
      </details>
    )
  }

  return (
    <>
      {!open ? (
        <button
          onClick={handleOpen}
          className="w-full bg-blue-600/20 border border-blue-700 hover:bg-blue-600/30 text-blue-300 rounded-xl px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {isMntNaoProg ? "Criar novo cartão" : "Adicionar / criar cartão"}
        </button>
      ) : (
        <div className="bg-gray-900 border border-blue-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-medium text-sm">
              {isMntNaoProg ? "Criar novo cartão" : "Cartão para a inspeção"}
            </h3>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tab switcher — only for INSP_ESPECIAL */}
          {!isMntNaoProg && (
            <div className="flex gap-1 mb-4 bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setTab("catalogo")}
                className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${tab === "catalogo" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"}`}
              >
                Do catálogo
              </button>
              <button
                onClick={() => setTab("novo")}
                className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${tab === "novo" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"}`}
              >
                Novo cartão
              </button>
            </div>
          )}

          {tab === "catalogo" && (
            <CatalogoSelector
              sistemas={sistemas}
              sistemaId={sistemaId}
              subsistemaId={subsistemaId}
              cartaoId={cartaoId}
              catalogSistema={catalogSistema}
              catalogSubsistema={catalogSubsistema}
              onSistemaChange={handleSistemaChange}
              onSubsistemaChange={handleSubsistemaChange}
              onCartaoChange={setCartaoId}
              onAdicionar={handleAdicionar}
              isPending={isPendingCat}
              error={catError}
              success={catSuccess}
            />
          )}

          {tab === "novo" && (
            <NovoCartaoForm
              sistemas={sistemas}
              sistemaId={newSistemaId}
              subsistemaId={newSubsistemaId}
              subsistemas={newSistema?.subsistemas ?? []}
              onSistemaChange={handleNewSistemaChange}
              onSubsistemaChange={setNewSubsistemaId}
              codigo={codigo}
              nomePt={nomePt}
              tipo={novoTipo}
              descricao={descricao}
              permanente={permanente}
              onCodigo={setCodigo}
              onNomePt={setNomePt}
              onTipo={setNovoTipo}
              onDescricao={setDescricao}
              onPermanente={setPermanente}
              onAdicionar={handleAdicionarNovo}
              saving={saving}
              error={newError}
              success={newSuccess}
            />
          )}
        </div>
      )}
    </>
  )
}

function CatalogoSelector({
  sistemas,
  sistemaId,
  subsistemaId,
  cartaoId,
  catalogSistema,
  catalogSubsistema,
  onSistemaChange,
  onSubsistemaChange,
  onCartaoChange,
  onAdicionar,
  isPending,
  error,
  success,
}: {
  sistemas: Sistema[]
  sistemaId: string
  subsistemaId: string
  cartaoId: string
  catalogSistema: Sistema | undefined
  catalogSubsistema: Sistema["subsistemas"][number] | undefined
  onSistemaChange: (id: string) => void
  onSubsistemaChange: (id: string) => void
  onCartaoChange: (id: string) => void
  onAdicionar: () => void
  isPending: boolean
  error: string
  success: string
}) {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Sistema</label>
        <select
          value={sistemaId}
          onChange={(e) => onSistemaChange(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Selecione o sistema...</option>
          {sistemas.map((s) => (
            <option key={s.id} value={s.id}>{s.codigo} — {s.nomePt}</option>
          ))}
        </select>
      </div>

      {sistemaId && (
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Subsistema</label>
          <select
            value={subsistemaId}
            onChange={(e) => onSubsistemaChange(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Selecione o subsistema...</option>
            {catalogSistema?.subsistemas.map((s) => (
              <option key={s.id} value={s.id}>{s.nomePt}</option>
            ))}
          </select>
        </div>
      )}

      {subsistemaId && (
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Cartão</label>
          <select
            value={cartaoId}
            onChange={(e) => onCartaoChange(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Selecione o cartão...</option>
            {catalogSubsistema?.cartoes.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.codigo}] {c.nomePt} — {TIPO_CARTAO_LABEL[c.tipo] ?? c.tipo}
                {c.duracaoMin ? ` (${Math.floor(c.duracaoMin / 60)}h${c.duracaoMin % 60 > 0 ? (c.duracaoMin % 60) + "m" : ""})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}
      {success && <p className="text-green-400 text-xs">{success}</p>}

      {cartaoId && (
        <button
          onClick={onAdicionar}
          disabled={isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          {isPending ? "Adicionando..." : "Adicionar cartão"}
        </button>
      )}
    </div>
  )
}

function NovoCartaoForm({
  sistemas,
  sistemaId,
  subsistemaId,
  subsistemas,
  onSistemaChange,
  onSubsistemaChange,
  codigo,
  nomePt,
  tipo,
  descricao,
  permanente,
  onCodigo,
  onNomePt,
  onTipo,
  onDescricao,
  onPermanente,
  onAdicionar,
  saving,
  error,
  success,
}: {
  sistemas: Sistema[]
  sistemaId: string
  subsistemaId: string
  subsistemas: Sistema["subsistemas"]
  onSistemaChange: (id: string) => void
  onSubsistemaChange: (id: string) => void
  codigo: string
  nomePt: string
  tipo: TipoCartao
  descricao: string
  permanente: boolean
  onCodigo: (v: string) => void
  onNomePt: (v: string) => void
  onTipo: (v: TipoCartao) => void
  onDescricao: (v: string) => void
  onPermanente: (v: boolean) => void
  onAdicionar: () => void
  saving: boolean
  error: string
  success: string
}) {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Sistema</label>
        <select
          value={sistemaId}
          onChange={(e) => onSistemaChange(e.target.value)}
          style={inp}
        >
          <option value="">Selecione o sistema...</option>
          {sistemas.map((s) => (
            <option key={s.id} value={s.id}>{s.codigo} — {s.nomePt}</option>
          ))}
        </select>
      </div>

      {sistemaId && (
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Subsistema</label>
          <select
            value={subsistemaId}
            onChange={(e) => onSubsistemaChange(e.target.value)}
            style={inp}
          >
            <option value="">Selecione o subsistema...</option>
            {subsistemas.map((s) => (
              <option key={s.id} value={s.id}>{s.nomePt}</option>
            ))}
          </select>
        </div>
      )}

      {subsistemaId && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8 }}>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">CÓDIGO *</label>
              <input value={codigo} onChange={e => onCodigo(e.target.value.toUpperCase())} style={inp} placeholder="ex: MNT-01" maxLength={20} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">TIPO *</label>
              <select value={tipo} onChange={e => onTipo(e.target.value as TipoCartao)} style={{ ...inp, cursor: "pointer" }}>
                {TIPOS_CARTAO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">NOME DO CARTÃO *</label>
            <input value={nomePt} onChange={e => onNomePt(e.target.value)} style={inp} placeholder="Descrição do serviço" maxLength={200} />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">DESCRIÇÃO DO SUBITEM A *</label>
            <textarea
              value={descricao}
              onChange={e => onDescricao(e.target.value)}
              style={{ ...inp, minHeight: 60, resize: "vertical" }}
              placeholder="Descreva a tarefa a executar..."
              maxLength={500}
            />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "0.4rem 0.6rem", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border, #333)", borderRadius: 6 }}>
            <input
              type="checkbox"
              checked={permanente}
              onChange={e => onPermanente(e.target.checked)}
              style={{ accentColor: "var(--gold, #C8A84B)", width: 14, height: 14 }}
            />
            <div>
              <span className="text-xs text-white">Adicionar permanentemente ao catálogo</span>
              <p className="text-xs text-gray-500 mt-0.5">
                {permanente ? "Aparecerá em futuras inspeções deste tipo." : "Apenas nesta inspeção."}
              </p>
            </div>
          </label>
        </>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}
      {success && <p className="text-green-400 text-xs">{success}</p>}

      {subsistemaId && (
        <button
          onClick={onAdicionar}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          {saving ? "Criando..." : "Criar e adicionar cartão"}
        </button>
      )}
    </div>
  )
}

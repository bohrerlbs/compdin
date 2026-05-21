"use client"

import { useState, useTransition, useEffect } from "react"
import { adicionarCartaoCatalogo, getSistemasCatalogo } from "./catalogo-inspecao-actions"

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

export default function AdicionarCartaoCatalogoButton({
  inspecaoId,
  isEspecial,
}: {
  inspecaoId: string
  isEspecial: boolean
}) {
  const [open, setOpen] = useState(false)
  const [sistemas, setSistemas] = useState<Sistema[]>([])
  const [sistemaId, setSistemaId] = useState("")
  const [subsistemaId, setSubsistemaId] = useState("")
  const [cartaoId, setCartaoId] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (open && sistemas.length === 0) {
      getSistemasCatalogo().then(setSistemas)
    }
  }, [open])

  const sistema = sistemas.find((s) => s.id === sistemaId)
  const subsistema = sistema?.subsistemas.find((s) => s.id === subsistemaId)

  function handleOpen() {
    setOpen(true)
    setError("")
    setSuccess("")
    setSistemaId("")
    setSubsistemaId("")
    setCartaoId("")
  }

  function handleSistemaChange(id: string) {
    setSistemaId(id)
    setSubsistemaId("")
    setCartaoId("")
  }

  function handleSubsistemaChange(id: string) {
    setSubsistemaId(id)
    setCartaoId("")
  }

  function handleAdicionar() {
    if (!cartaoId) return
    setError("")
    setSuccess("")
    startTransition(async () => {
      const result = await adicionarCartaoCatalogo(inspecaoId, cartaoId)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess("Cartão adicionado à inspeção.")
        setCartaoId("")
      }
    })
  }

  if (!isEspecial) {
    return (
      <details className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <summary className="px-4 py-3 text-sm text-gray-400 cursor-pointer select-none hover:text-white list-none flex items-center gap-2">
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
            onSistemaChange={handleSistemaChange}
            onSubsistemaChange={handleSubsistemaChange}
            onCartaoChange={setCartaoId}
            onAdicionar={handleAdicionar}
            isPending={isPending}
            error={error}
            success={success}
            onOpen={() => { if (sistemas.length === 0) getSistemasCatalogo().then(setSistemas) }}
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
          Adicionar cartão do catálogo à inspeção
        </button>
      ) : (
        <div className="bg-gray-900 border border-blue-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-medium text-sm">Adicionar cartão à inspeção</h3>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <CatalogoSelector
            sistemas={sistemas}
            sistemaId={sistemaId}
            subsistemaId={subsistemaId}
            cartaoId={cartaoId}
            onSistemaChange={handleSistemaChange}
            onSubsistemaChange={handleSubsistemaChange}
            onCartaoChange={setCartaoId}
            onAdicionar={handleAdicionar}
            isPending={isPending}
            error={error}
            success={success}
            onOpen={() => {}}
          />
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
  onSistemaChange,
  onSubsistemaChange,
  onCartaoChange,
  onAdicionar,
  isPending,
  error,
  success,
  onOpen,
}: {
  sistemas: Sistema[]
  sistemaId: string
  subsistemaId: string
  cartaoId: string
  onSistemaChange: (id: string) => void
  onSubsistemaChange: (id: string) => void
  onCartaoChange: (id: string) => void
  onAdicionar: () => void
  isPending: boolean
  error: string
  success: string
  onOpen: () => void
}) {
  const sistema = sistemas.find((s) => s.id === sistemaId)
  const subsistema = sistema?.subsistemas.find((s) => s.id === subsistemaId)

  return (
    <div className="space-y-2" onClick={onOpen}>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Sistema</label>
        <select
          value={sistemaId}
          onChange={(e) => onSistemaChange(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Selecione o sistema...</option>
          {sistemas.map((s) => (
            <option key={s.id} value={s.id}>
              {s.codigo} — {s.nomePt}
            </option>
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
            {sistema?.subsistemas.map((s) => (
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
            {subsistema?.cartoes.map((c) => (
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

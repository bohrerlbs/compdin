"use client"

import { useState, useTransition } from "react"
import { TipoCartao, InspecaoTipo } from "@prisma/client"
import {
  criarSistema, editarSistema, deletarSistema,
  criarSubsistema, editarSubsistema, deletarSubsistema, moverSubsistema,
  criarCartao, editarCartao, deletarCartao, moverCartao,
  criarSubitem, editarSubitem, deletarSubitem,
  vincularCartaoTipo, desvincularCartaoTipo,
} from "./catalogo-actions"
import type { getCatalogo } from "./catalogo-actions"
import { INSPECAO_SHORT } from "@/lib/inspecao"

type Catalogo = Awaited<ReturnType<typeof getCatalogo>>
type Sistema = Catalogo[number]
type Subsistema = Sistema["subsistemas"][number]
type Cartao = Subsistema["cartoes"][number]

const TIPOS_CARTAO: TipoCartao[] = [
  "VISUAL_CHECK", "DETAILED_INSPECTION", "SPECIAL_DETAILED_INSPECTION",
  "SERVICE", "LUBRIFICATION", "BIM_CHECK", "TAP_TEST", "OIL_SAMPLE",
]

const TIPO_CARTAO_LABEL: Record<TipoCartao, string> = {
  VISUAL_CHECK: "Visual Check",
  DETAILED_INSPECTION: "Detailed Inspection",
  SPECIAL_DETAILED_INSPECTION: "Special Detailed Inspection",
  SERVICE: "Service",
  LUBRIFICATION: "Lubrification",
  BIM_CHECK: "BIM Check",
  TAP_TEST: "Tap Test",
  OIL_SAMPLE: "Oil Sample",
}

const ALL_TIPOS_INSPECAO: InspecaoTipo[] = [
  "INSP_30D","INSP_6M","INSP_90D","INSP_12M","INSP_24M",
  "PMS_40","PMS_120","PMS_360","PMI_480","PMI_960",
  "EP1_ERO","EP2_POU","EP3_PAR","EP5_PRP","INSP_ESPECIAL",
]

const inputCls = "w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-600"
const btnPrimary = "bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
const btnDanger = "bg-red-900/40 hover:bg-red-800/60 text-red-400 text-sm px-2 py-1 rounded transition-colors"
const btnSecondary = "bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-3 py-1.5 rounded-lg transition-colors"

export default function CatalogoManager({
  catalogo: initial,
  role,
}: {
  catalogo: Catalogo
  role: string
}) {
  const [catalogo, setCatalogo] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [expandedSistemas, setExpandedSistemas] = useState<Set<string>>(new Set())
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set())
  const [expandedCartoes, setExpandedCartoes] = useState<Set<string>>(new Set())
  const [editingSistema, setEditingSistema] = useState<string | null>(null)
  const [editingSub, setEditingSub] = useState<string | null>(null)
  const [editingCartao, setEditingCartao] = useState<string | null>(null)
  const [editingSubitem, setEditingSubitem] = useState<string | null>(null)
  const [addingSistema, setAddingSistema] = useState(false)
  const [addingSubOf, setAddingSubOf] = useState<string | null>(null)
  const [addingCartaoOf, setAddingCartaoOf] = useState<string | null>(null)
  const [addingSubitemOf, setAddingSubitemOf] = useState<string | null>(null)
  const [movingCartao, setMovingCartao] = useState<string | null>(null)
  const [movingSub, setMovingSub] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const isAdmin = role === "ADMIN"

  async function reload() {
    const res = await fetch("/admin/catalogo?json=1")
    if (res.ok) setCatalogo(await res.json())
  }

  function run(action: () => Promise<{ error?: string }>) {
    setError("")
    setSuccess("")
    startTransition(async () => {
      const r = await action()
      if (r?.error) setError(r.error)
      else { setSuccess("Salvo com sucesso."); await reload() }
    })
  }

  const toggleSistema = (id: string) => setExpandedSistemas(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleSub = (id: string) => setExpandedSubs(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleCartao = (id: string) => setExpandedCartoes(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  return (
    <div className="space-y-3">
      {error && <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-2 text-red-400 text-sm">{error}</div>}
      {success && <div className="bg-green-900/30 border border-green-800 rounded-lg px-4 py-2 text-green-400 text-sm">{success}</div>}

      {/* Adicionar Sistema */}
      {addingSistema ? (
        <form
          className="bg-gray-900 border border-blue-800 rounded-xl p-4 space-y-2"
          action={async (fd) => { run(() => criarSistema(fd)); setAddingSistema(false) }}
        >
          <p className="text-white text-sm font-medium mb-2">Novo Sistema</p>
          <input name="codigo" placeholder="Código (ex: 007)" required className={inputCls} />
          <input name="nomePt" placeholder="Nome em PT-BR" required className={inputCls} />
          <input name="nomeEn" placeholder="Name in English" required className={inputCls} />
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className={btnPrimary}>Criar</button>
            <button type="button" onClick={() => setAddingSistema(false)} className={btnSecondary}>Cancelar</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAddingSistema(true)} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Novo Sistema
        </button>
      )}

      {/* Lista de Sistemas */}
      {catalogo.map((sistema) => (
        <div key={sistema.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {/* Header Sistema */}
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => toggleSistema(sistema.id)}
              className="flex items-center gap-2 text-left flex-1"
            >
              <svg className={`w-4 h-4 text-gray-500 transition-transform ${expandedSistemas.has(sistema.id) ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
              <span className="text-xs text-gray-500 font-mono">{sistema.codigo}</span>
              <span className="text-white font-medium text-sm">{sistema.nomePt}</span>
              <span className="text-gray-500 text-xs hidden sm:inline">· {sistema.nomeEn}</span>
            </button>
            <div className="flex items-center gap-1 ml-2">
              <button onClick={() => setEditingSistema(editingSistema === sistema.id ? null : sistema.id)} className={btnSecondary}>Editar</button>
              {isAdmin && (
                <button onClick={() => { if (confirm("Deletar sistema?")) run(() => deletarSistema(sistema.id)) }} className={btnDanger}>✕</button>
              )}
            </div>
          </div>

          {/* Editar Sistema inline */}
          {editingSistema === sistema.id && (
            <form
              className="px-4 pb-4 space-y-2 border-t border-gray-800 pt-3"
              action={async (fd) => { run(() => editarSistema(sistema.id, fd)); setEditingSistema(null) }}
            >
              <input name="codigo" defaultValue={sistema.codigo} required className={inputCls} placeholder="Código" />
              <input name="nomePt" defaultValue={sistema.nomePt} required className={inputCls} placeholder="Nome PT" />
              <input name="nomeEn" defaultValue={sistema.nomeEn} required className={inputCls} placeholder="Name EN" />
              <div className="flex gap-2">
                <button type="submit" disabled={isPending} className={btnPrimary}>Salvar</button>
                <button type="button" onClick={() => setEditingSistema(null)} className={btnSecondary}>Cancelar</button>
              </div>
            </form>
          )}

          {/* Subsistemas */}
          {expandedSistemas.has(sistema.id) && (
            <div className="border-t border-gray-800">
              {sistema.subsistemas.map((sub) => (
                <div key={sub.id} className="border-b border-gray-800 last:border-b-0">
                  {/* Header Sub */}
                  <div className="flex items-center justify-between px-4 py-2 pl-8">
                    <button onClick={() => toggleSub(sub.id)} className="flex items-center gap-2 flex-1 text-left">
                      <svg className={`w-3 h-3 text-gray-600 transition-transform ${expandedSubs.has(sub.id) ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                      </svg>
                      <span className="text-gray-200 text-sm">{sub.nomePt}</span>
                      <span className="text-gray-500 text-xs">({sub.cartoes.length} cartões)</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditingSub(editingSub === sub.id ? null : sub.id)} className="text-xs text-gray-500 hover:text-white px-2 py-1">Editar</button>
                      <button onClick={() => setMovingSub(movingSub === sub.id ? null : sub.id)} className="text-xs text-gray-500 hover:text-blue-400 px-2 py-1">Mover</button>
                      {isAdmin && (
                        <button onClick={() => { if (confirm("Deletar subsistema?")) run(() => deletarSubsistema(sub.id)) }} className="text-xs text-red-600 hover:text-red-400 px-2 py-1">✕</button>
                      )}
                    </div>
                  </div>

                  {/* Editar Sub */}
                  {editingSub === sub.id && (
                    <form className="px-4 pb-3 pl-12 space-y-2" action={async (fd) => { run(() => editarSubsistema(sub.id, fd)); setEditingSub(null) }}>
                      <input name="nomePt" defaultValue={sub.nomePt} required className={inputCls} placeholder="Nome PT" />
                      <input name="nomeEn" defaultValue={sub.nomeEn} required className={inputCls} placeholder="Name EN" />
                      <div className="flex gap-2">
                        <button type="submit" disabled={isPending} className={btnPrimary}>Salvar</button>
                        <button type="button" onClick={() => setEditingSub(null)} className={btnSecondary}>Cancelar</button>
                      </div>
                    </form>
                  )}

                  {/* Mover Sub */}
                  {movingSub === sub.id && (
                    <div className="px-4 pb-3 pl-12">
                      <select
                        className={inputCls}
                        defaultValue=""
                        onChange={(e) => { if (e.target.value) { run(() => moverSubsistema(sub.id, e.target.value)); setMovingSub(null) } }}
                      >
                        <option value="">Mover para sistema...</option>
                        {catalogo.filter(s => s.id !== sistema.id).map(s => (
                          <option key={s.id} value={s.id}>{s.codigo} — {s.nomePt}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Cartões */}
                  {expandedSubs.has(sub.id) && (
                    <div className="pl-12 pr-4 pb-3 space-y-1">
                      {sub.cartoes.map((cartao) => (
                        <CartaoItem
                          key={cartao.id}
                          cartao={cartao}
                          catalogo={catalogo}
                          sub={sub}
                          isAdmin={isAdmin}
                          isPending={isPending}
                          expanded={expandedCartoes.has(cartao.id)}
                          onToggle={() => toggleCartao(cartao.id)}
                          editingCartao={editingCartao}
                          setEditingCartao={setEditingCartao}
                          editingSubitem={editingSubitem}
                          setEditingSubitem={setEditingSubitem}
                          addingSubitemOf={addingSubitemOf}
                          setAddingSubitemOf={setAddingSubitemOf}
                          movingCartao={movingCartao}
                          setMovingCartao={setMovingCartao}
                          run={run}
                          inputCls={inputCls}
                          btnPrimary={btnPrimary}
                          btnSecondary={btnSecondary}
                          btnDanger={btnDanger}
                        />
                      ))}

                      {/* Adicionar Cartão */}
                      {addingCartaoOf === sub.id ? (
                        <form
                          className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 space-y-2 mt-2"
                          action={async (fd) => { run(() => criarCartao(sub.id, fd)); setAddingCartaoOf(null) }}
                        >
                          <p className="text-white text-xs font-medium">Novo Cartão</p>
                          <div className="grid grid-cols-2 gap-2">
                            <input name="codigo" placeholder="Código" required className={inputCls} />
                            <select name="tipo" required className={inputCls}>
                              {TIPOS_CARTAO.map(t => <option key={t} value={t}>{TIPO_CARTAO_LABEL[t]}</option>)}
                            </select>
                          </div>
                          <input name="nomePt" placeholder="Nome em PT-BR" required className={inputCls} />
                          <input name="nomeEn" placeholder="Name in English" className={inputCls} />
                          <div className="grid grid-cols-3 gap-2">
                            <input name="publicacao" placeholder="Publicação" className={inputCls} />
                            <input name="wp" placeholder="WP" className={inputCls} />
                            <input name="duracaoMin" type="number" placeholder="Duração (min)" className={inputCls} />
                          </div>
                          <input name="qtdRecursos" type="number" defaultValue="1" placeholder="Qtd Recursos" className={inputCls} />
                          <textarea name="descricaoSubitem" placeholder="Descrição do subitem A (obrigatório)" rows={2} required className={inputCls} />
                          <textarea name="observacao" placeholder="Observação (opcional)" rows={2} className={inputCls} />
                          <div className="flex gap-2">
                            <button type="submit" disabled={isPending} className={btnPrimary}>Criar</button>
                            <button type="button" onClick={() => setAddingCartaoOf(null)} className={btnSecondary}>Cancelar</button>
                          </div>
                        </form>
                      ) : (
                        <button
                          onClick={() => setAddingCartaoOf(sub.id)}
                          className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1 mt-1"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                          Novo cartão neste subsistema
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Adicionar Subsistema */}
              {addingSubOf === sistema.id ? (
                <form
                  className="px-4 pb-3 pl-8 space-y-2 border-t border-gray-800 pt-3"
                  action={async (fd) => { run(() => criarSubsistema(sistema.id, fd)); setAddingSubOf(null) }}
                >
                  <p className="text-white text-xs font-medium">Novo Subsistema</p>
                  <input name="nomePt" placeholder="Nome em PT-BR" required className={inputCls} />
                  <input name="nomeEn" placeholder="Name in English" required className={inputCls} />
                  <div className="flex gap-2">
                    <button type="submit" disabled={isPending} className={btnPrimary}>Criar</button>
                    <button type="button" onClick={() => setAddingSubOf(null)} className={btnSecondary}>Cancelar</button>
                  </div>
                </form>
              ) : (
                <div className="px-4 pb-2 pl-8">
                  <button onClick={() => setAddingSubOf(sistema.id)} className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                    Novo subsistema
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function CartaoItem({
  cartao, catalogo, sub, isAdmin, isPending, expanded, onToggle,
  editingCartao, setEditingCartao, editingSubitem, setEditingSubitem,
  addingSubitemOf, setAddingSubitemOf, movingCartao, setMovingCartao,
  run, inputCls, btnPrimary, btnSecondary, btnDanger,
}: {
  cartao: Cartao
  catalogo: Awaited<ReturnType<typeof getCatalogo>>
  sub: Subsistema
  isAdmin: boolean
  isPending: boolean
  expanded: boolean
  onToggle: () => void
  editingCartao: string | null
  setEditingCartao: (id: string | null) => void
  editingSubitem: string | null
  setEditingSubitem: (id: string | null) => void
  addingSubitemOf: string | null
  setAddingSubitemOf: (id: string | null) => void
  movingCartao: string | null
  setMovingCartao: (id: string | null) => void
  run: (action: () => Promise<{ error?: string }>) => void
  inputCls: string
  btnPrimary: string
  btnSecondary: string
  btnDanger: string
}) {
  const tiposVinculados = cartao.inspecaoTipos.map(t => t.inspecaoTipo)

  return (
    <div className="bg-gray-800/40 border border-gray-700 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2">
        <button onClick={onToggle} className="flex items-center gap-2 flex-1 text-left">
          <svg className={`w-3 h-3 text-gray-600 transition-transform ${expanded ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
          </svg>
          <span className="text-xs font-mono text-blue-400">[{cartao.codigo}]</span>
          <span className="text-gray-200 text-xs">{cartao.nomePt}</span>
        </button>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-600 hidden sm:inline">{cartao.tipo}</span>
          <button onClick={() => setEditingCartao(editingCartao === cartao.id ? null : cartao.id)} className="text-xs text-gray-500 hover:text-white px-1.5 py-1">✎</button>
          <button onClick={() => setMovingCartao(movingCartao === cartao.id ? null : cartao.id)} className="text-xs text-gray-500 hover:text-blue-400 px-1.5 py-1">↗</button>
          {isAdmin && (
            <button onClick={() => { if (confirm("Deletar cartão?")) run(() => deletarCartao(cartao.id)) }} className="text-xs text-red-700 hover:text-red-400 px-1.5 py-1">✕</button>
          )}
        </div>
      </div>

      {editingCartao === cartao.id && (
        <form className="px-3 pb-3 space-y-2 border-t border-gray-700 pt-2" action={async (fd) => { run(() => editarCartao(cartao.id, fd)); setEditingCartao(null) }}>
          <div className="grid grid-cols-2 gap-2">
            <input name="codigo" defaultValue={cartao.codigo} required className={inputCls} placeholder="Código" />
            <select name="tipo" defaultValue={cartao.tipo} required className={inputCls}>
              {TIPOS_CARTAO.map(t => <option key={t} value={t}>{TIPO_CARTAO_LABEL[t]}</option>)}
            </select>
          </div>
          <input name="nomePt" defaultValue={cartao.nomePt} required className={inputCls} placeholder="Nome PT" />
          <input name="nomeEn" defaultValue={cartao.nomeEn} className={inputCls} placeholder="Name EN" />
          <div className="grid grid-cols-3 gap-2">
            <input name="publicacao" defaultValue={cartao.publicacao ?? ""} className={inputCls} placeholder="Publicação" />
            <input name="wp" defaultValue={cartao.wp ?? ""} className={inputCls} placeholder="WP" />
            <input name="duracaoMin" type="number" defaultValue={cartao.duracaoMin ?? ""} className={inputCls} placeholder="Min" />
          </div>
          <input name="qtdRecursos" type="number" defaultValue={cartao.qtdRecursos ?? 1} className={inputCls} placeholder="Qtd Recursos" />
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className={btnPrimary}>Salvar</button>
            <button type="button" onClick={() => setEditingCartao(null)} className={btnSecondary}>Cancelar</button>
          </div>
        </form>
      )}

      {movingCartao === cartao.id && (
        <div className="px-3 pb-2 border-t border-gray-700 pt-2">
          <p className="text-xs text-gray-500 mb-1">Mover cartão para:</p>
          <select
            className={inputCls}
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                run(() => moverCartao(cartao.id, e.target.value))
                setMovingCartao(null)
              }
            }}
          >
            <option value="">Selecione subsistema...</option>
            {catalogo.flatMap(s => s.subsistemas).filter(ss => ss.id !== sub.id).map(ss => (
              <option key={ss.id} value={ss.id}>{ss.nomePt}</option>
            ))}
          </select>
        </div>
      )}

      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-700 pt-2 space-y-2">
          {/* Subitens */}
          <p className="text-xs text-gray-500 font-medium">Subitens</p>
          {cartao.subitens.map((subitem) => (
            <div key={subitem.id} className="bg-gray-900/50 rounded p-2">
              {editingSubitem === subitem.id ? (
                <form className="space-y-1" action={async (fd) => { run(() => editarSubitem(subitem.id, fd)); setEditingSubitem(null) }}>
                  <div className="flex gap-2">
                    <input name="letra" defaultValue={subitem.letra} required className={`w-12 ${inputCls}`} />
                    <input name="referencia" defaultValue={subitem.referencia ?? ""} className={`flex-1 ${inputCls}`} placeholder="Referência" />
                  </div>
                  <textarea name="descricaoPt" defaultValue={subitem.descricaoPt} required rows={2} className={inputCls} />
                  <input name="descricaoEn" defaultValue={subitem.descricaoEn ?? ""} className={inputCls} placeholder="Description EN" />
                  <div className="flex gap-2">
                    <button type="submit" disabled={isPending} className={btnPrimary}>Salvar</button>
                    <button type="button" onClick={() => setEditingSubitem(null)} className={btnSecondary}>Cancelar</button>
                    {isAdmin && (
                      <button type="button" onClick={() => { if (confirm("Deletar subitem?")) { run(() => deletarSubitem(subitem.id)); setEditingSubitem(null) } }} className={btnDanger}>Deletar</button>
                    )}
                  </div>
                </form>
              ) : (
                <div className="flex items-start gap-2">
                  <span className="text-blue-400 font-mono text-xs w-4 shrink-0">{subitem.letra}.</span>
                  <span className="text-gray-300 text-xs flex-1">{subitem.descricaoPt}</span>
                  <button onClick={() => setEditingSubitem(subitem.id)} className="text-gray-600 hover:text-white text-xs shrink-0">✎</button>
                </div>
              )}
            </div>
          ))}

          {/* Adicionar Subitem */}
          {addingSubitemOf === cartao.id ? (
            <form className="space-y-1" action={async (fd) => { run(() => criarSubitem(cartao.id, fd)); setAddingSubitemOf(null) }}>
              <div className="flex gap-2">
                <input name="letra" placeholder="Letra" required className={`w-16 ${inputCls}`} />
                <input name="referencia" placeholder="Referência" className={`flex-1 ${inputCls}`} />
              </div>
              <textarea name="descricaoPt" placeholder="Descrição PT (obrigatório)" rows={2} required className={inputCls} />
              <input name="descricaoEn" placeholder="Description EN" className={inputCls} />
              <div className="flex gap-2">
                <button type="submit" disabled={isPending} className={btnPrimary}>Adicionar</button>
                <button type="button" onClick={() => setAddingSubitemOf(null)} className={btnSecondary}>Cancelar</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setAddingSubitemOf(cartao.id)} className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
              Novo subitem
            </button>
          )}

          {/* Vínculos de inspeção */}
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Aplicável em:</p>
            <div className="flex flex-wrap gap-1">
              {ALL_TIPOS_INSPECAO.map(tipo => {
                const vinculado = tiposVinculados.includes(tipo)
                return (
                  <button
                    key={tipo}
                    onClick={() => run(() => vinculado ? desvincularCartaoTipo(cartao.id, tipo) : vincularCartaoTipo(cartao.id, tipo))}
                    disabled={isPending}
                    className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                      vinculado
                        ? "bg-green-900/40 border-green-700 text-green-400"
                        : "bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600"
                    }`}
                  >
                    {INSPECAO_SHORT[tipo]}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

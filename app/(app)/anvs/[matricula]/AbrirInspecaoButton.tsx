"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { InspecaoTipo } from "@prisma/client"
import { TIPOS_INSPECAO_AGRUPADOS } from "@/lib/inspecao"

export default function AbrirInspecaoButton({
  anvId,
  role,
}: {
  anvId: string
  role: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<InspecaoTipo>("PMS_40")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleAbrir() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/inspecoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anvId, tipo }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Erro ao abrir inspeção.")
        return
      }
      const { id } = await res.json()
      setOpen(false)
      router.push(`/inspecoes/${id}`)
      router.refresh()
    } catch {
      setError("Erro de conexão.")
    } finally {
      setLoading(false)
    }
  }

  // ENCARREGADO só pode abrir INSP_ESPECIAL
  const grupos = role === "ENCARREGADO"
    ? TIPOS_INSPECAO_AGRUPADOS.filter((g) => g.grupo === "Inspeções Especiais").map((g) => ({
        ...g,
        tipos: g.tipos.filter((t) => t.value === "INSP_ESPECIAL"),
      }))
    : TIPOS_INSPECAO_AGRUPADOS

  return (
    <>
      <button
        onClick={() => {
          if (role === "ENCARREGADO") setTipo("INSP_ESPECIAL")
          setOpen(true)
        }}
        className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
      >
        + Abrir Inspeção
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Abrir Inspeção</h3>

            <label className="block text-sm text-gray-400 mb-1">Tipo de Inspeção</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as InspecaoTipo)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {grupos.map((grupo) => (
                <optgroup key={grupo.grupo} label={grupo.grupo}>
                  {grupo.tipos.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>

            {tipo === "INSP_ESPECIAL" && (
              <p className="text-yellow-400 text-xs mb-3 bg-yellow-900/20 border border-yellow-800 rounded-lg px-3 py-2">
                Inspeção Especial abre sem cartões. O inspetor ou encarregado adiciona sistemas, subsistemas e cartões conforme necessário.
              </p>
            )}

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => { setOpen(false); setError("") }}
                className="flex-1 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 py-2.5 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAbrir}
                disabled={loading}
                className="flex-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                {loading ? "Abrindo..." : "Abrir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

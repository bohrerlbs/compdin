"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { InspecaoTipo } from "@prisma/client"

const TIPOS_INSPECAO: { value: InspecaoTipo; label: string }[] = [
  { value: "INSP_30D", label: "INSP-30D (Calendário 30 dias)" },
  { value: "INSP_6M", label: "INSP-6M (Calendário 6 meses)" },
  { value: "INSP_90D", label: "INSP-90D (Calendário 90 dias)" },
  { value: "INSP_12M", label: "INSP-12M (Calendário 12 meses)" },
  { value: "INSP_24M", label: "INSP-24M (Calendário 24 meses)" },
  { value: "PMS_40", label: "PMS-40H (Periódica 40 horas)" },
  { value: "PMS_120", label: "PMS-120H (Periódica 120 horas)" },
  { value: "PMS_360", label: "PMS-360H (Periódica 360 horas)" },
  { value: "PMI_480", label: "PMI-480H (Maior 480 horas)" },
  { value: "PMI_960", label: "PMI-960H (Maior 960 horas)" },
]

export default function AbrirInspecaoButton({ anvId }: { anvId: string }) {
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
      setOpen(false)
      router.refresh()
    } catch {
      setError("Erro de conexão.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
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
              {TIPOS_INSPECAO.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
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

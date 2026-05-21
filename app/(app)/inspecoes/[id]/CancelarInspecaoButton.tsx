"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function CancelarInspecaoButton({
  inspecaoId,
  anvMatricula,
}: {
  inspecaoId: string
  anvMatricula: string
}) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleCancelar() {
    setLoading(true)
    setError("")
    const res = await fetch(`/api/inspecoes/${inspecaoId}/cancelar`, { method: "PATCH" })
    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "Erro ao cancelar.")
      return
    }
    router.push(`/anvs/${anvMatricula}`)
    router.refresh()
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="w-full text-sm text-red-400 border border-red-900 hover:bg-red-900/20 py-3 rounded-xl transition-colors"
      >
        Cancelar Inspeção
      </button>
    )
  }

  return (
    <div className="bg-gray-900 border border-red-900 rounded-xl p-4">
      <p className="text-white text-sm mb-1 text-center font-medium">Cancelar esta inspeção?</p>
      <p className="text-gray-500 text-xs text-center mb-4">
        A inspeção ficará marcada como cancelada e não poderá ser reaberta.
      </p>
      {error && <p className="text-red-400 text-xs text-center mb-3">{error}</p>}
      <div className="flex gap-3">
        <button
          onClick={() => { setConfirm(false); setError("") }}
          className="flex-1 text-sm text-gray-400 bg-gray-800 hover:bg-gray-700 py-2.5 rounded-lg transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={handleCancelar}
          disabled={loading}
          className="flex-1 text-sm bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          {loading ? "Cancelando..." : "Confirmar Cancelamento"}
        </button>
      </div>
    </div>
  )
}

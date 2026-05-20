"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function FecharInspecaoButton({ inspecaoId }: { inspecaoId: string }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleFechar() {
    setLoading(true)
    await fetch(`/api/inspecoes/${inspecaoId}/fechar`, { method: "PATCH" })
    setLoading(false)
    router.refresh()
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="w-full text-sm text-green-400 border border-green-800 hover:bg-green-900/30 py-3 rounded-xl transition-colors"
      >
        Concluir Inspeção
      </button>
    )
  }

  return (
    <div className="bg-gray-900 border border-green-800 rounded-xl p-4">
      <p className="text-white text-sm mb-4 text-center">Confirmar conclusão da inspeção?</p>
      <div className="flex gap-3">
        <button
          onClick={() => setConfirm(false)}
          className="flex-1 text-sm text-gray-400 bg-gray-800 hover:bg-gray-700 py-2.5 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleFechar}
          disabled={loading}
          className="flex-1 text-sm bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          {loading ? "Concluindo..." : "Confirmar"}
        </button>
      </div>
    </div>
  )
}

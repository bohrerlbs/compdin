import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import React from "react"
import { getCatalogo } from "./catalogo-actions"
import CatalogoManager from "./CatalogoManager"

const PRIVILEGED = ["ADMIN", "ENCARREGADO", "INSPETOR"]

export const dynamic = "force-dynamic"

export default async function CatalogoPage({ searchParams }: { searchParams: Promise<{ json?: string }> }) {
  const session = await auth()
  if (!session || !PRIVILEGED.includes(session.user.role)) redirect("/anvs")

  const catalogo = await getCatalogo()
  const params = await searchParams
  if (params.json === "1") {
    return Response.json(catalogo) as unknown as React.ReactElement
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/anvs" className="hover:text-white">Início</Link>
        <span>/</span>
        <span className="text-white font-medium">Catálogo</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Catálogo de Inspeções</h1>
          <p className="text-gray-400 text-sm">Gerencie sistemas, subsistemas, cartões e subitens</p>
        </div>
      </div>

      <div className="mb-4 p-3 bg-gray-900/50 border border-gray-800 rounded-lg text-xs text-gray-500">
        <strong className="text-gray-400">Como usar:</strong> Clique em um sistema para expandir seus subsistemas. Clique em um subsistema para ver e gerenciar seus cartões. Cartões exibem subitens e vínculos de inspeção quando expandidos. Ações de deletar estão disponíveis apenas para ADMIN.
      </div>

      <CatalogoManager catalogo={catalogo} role={session.user.role} />
    </div>
  )
}

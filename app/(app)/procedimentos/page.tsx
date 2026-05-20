import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import ProcedimentosList from "./ProcedimentosList"

export default async function ProcedimentosPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const procedimentos = await prisma.procedimentoPadrao.findMany({
    include: {
      autor: { select: { trigrama: true, nome: true } },
      imagens: { orderBy: { ordem: "asc" } },
    },
    orderBy: { criadoEm: "desc" },
  })

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/anvs" style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>← Voltar</Link>
        <h1 style={{ color: "var(--gold-bright)", fontWeight: 800, fontSize: "1.1rem", letterSpacing: "0.12em", margin: "8px 0 4px" }}>
          PROCEDIMENTOS PADRÃO
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", margin: 0 }}>
          Referências técnicas compartilhadas · COMPDIN
        </p>
      </div>

      <ProcedimentosList
        procedimentos={procedimentos.map(p => ({
          id: p.id,
          titulo: p.titulo,
          descricao: p.descricao,
          autorId: p.autorId,
          autorTrigrama: p.autor.trigrama,
          autorNome: p.autor.nome,
          criadoEm: p.criadoEm.toISOString(),
          imagens: p.imagens.map(i => ({ id: i.id, url: i.url, legenda: i.legenda, ordem: i.ordem })),
        }))}
        userId={session.user.id}
        userRole={session.user.role}
      />
    </div>
  )
}

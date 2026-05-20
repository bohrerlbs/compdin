import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import NovaAeronaveForm from "./NovaAeronaveForm"
import AeronavesList from "./AeronavesList"

export default async function AeronavesPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const { role } = session.user
  if (role !== "ENCARREGADO" && role !== "ADMIN") redirect("/anvs")

  const aeronaves = await prisma.anv.findMany({
    select: {
      id: true,
      matricula: true,
      modelo: true,
      ativo: true,
      _count: { select: { inspecoes: true } },
    },
    orderBy: { matricula: "asc" },
  })

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Link href="/anvs" style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
            ← Voltar
          </Link>
        </div>
        <h1 style={{
          color: "var(--gold-bright)",
          fontWeight: 800,
          fontSize: "1.1rem",
          letterSpacing: "0.12em",
          margin: 0,
        }}>
          AERONAVES
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", margin: "4px 0 0" }}>
          Gerenciamento de aeronaves · COMPDIN
        </p>
      </div>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{
          fontSize: "0.6rem",
          letterSpacing: "0.14em",
          color: "var(--text-dim)",
          fontWeight: 700,
          margin: "0 0 0.75rem",
        }}>
          NOVA AERONAVE
        </h2>
        <div className="card-mil" style={{ padding: "1rem" }}>
          <NovaAeronaveForm />
        </div>
      </section>

      <section>
        <h2 style={{
          fontSize: "0.6rem",
          letterSpacing: "0.14em",
          color: "var(--text-dim)",
          fontWeight: 700,
          margin: "0 0 0.75rem",
        }}>
          AERONAVES CADASTRADAS ({aeronaves.length})
        </h2>
        <AeronavesList aeronaves={aeronaves} />
      </section>
    </div>
  )
}

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import NovoUsuarioForm from "./NovoUsuarioForm"
import UsuariosList from "./UsuariosList"

export default async function UsuariosPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const { role } = session.user
  if (role !== "ENCARREGADO" && role !== "INSPETOR" && role !== "ADMIN") redirect("/anvs")

  const usuarios = await prisma.user.findMany({
    select: {
      id: true,
      nome: true,
      trigrama: true,
      matricula: true,
      role: true,
      ativo: true,
      criadoEm: true,
    },
    orderBy: [{ role: "asc" }, { nome: "asc" }],
  })

  return (
    <div>
      {/* Header */}
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
          USUÁRIOS
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", margin: "4px 0 0" }}>
          Gerenciamento de acesso · COMPDIN
        </p>
      </div>

      {/* Formulário de novo usuário */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{
          fontSize: "0.6rem",
          letterSpacing: "0.14em",
          color: "var(--text-dim)",
          fontWeight: 700,
          margin: "0 0 0.75rem",
        }}>
          NOVO USUÁRIO
        </h2>
        <div className="card-mil" style={{ padding: "1rem" }}>
          <NovoUsuarioForm />
        </div>
      </section>

      {/* Lista de usuários */}
      <section>
        <h2 style={{
          fontSize: "0.6rem",
          letterSpacing: "0.14em",
          color: "var(--text-dim)",
          fontWeight: 700,
          margin: "0 0 0.75rem",
        }}>
          USUÁRIOS CADASTRADOS ({usuarios.length})
        </h2>
        <UsuariosList usuarios={usuarios.map(u => ({
          ...u,
          criadoEm: u.criadoEm.toISOString(),
        }))} />
      </section>
    </div>
  )
}

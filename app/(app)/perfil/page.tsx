import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import PerfilEditor from "./PerfilEditor"
import { Role } from "@prisma/client"

const ROLE_LABEL: Record<Role, string> = {
  MECANICO: "Mecânico",
  ENCARREGADO: "Encarregado",
  INSPETOR: "Inspetor",
  ADMIN: "Administrador",
}

export default async function PerfilPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { nome: true, trigrama: true, matricula: true, role: true },
  })
  if (!user) redirect("/login")

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/anvs" style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>← Voltar</Link>
        <h1 style={{ color: "var(--gold-bright)", fontWeight: 800, fontSize: "1.1rem", letterSpacing: "0.12em", margin: "8px 0 4px" }}>
          MEU PERFIL
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", margin: 0 }}>
          Alterar dados de acesso · COMPDIN
        </p>
      </div>

      <PerfilEditor
        nome={user.nome}
        trigrama={user.trigrama}
        matricula={user.matricula}
        role={ROLE_LABEL[user.role]}
      />
    </div>
  )
}

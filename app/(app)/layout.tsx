import { auth } from "@/auth"
import { redirect } from "next/navigation"
import SessionProvider from "@/components/SessionProvider"
import Navbar from "@/components/Navbar"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <SessionProvider>
      <div className="min-h-screen flex flex-col bg-gray-950">
        <Navbar user={session.user} />
        <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
          {children}
        </main>
      </div>
    </SessionProvider>
  )
}

import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import "./globals.css"

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "COMPDIN — 5/8 GAV Pantera",
  description: "Gestão de inspeções COMPDIN - H-60L Black Hawk",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "COMPDIN" },
}

export const viewport: Viewport = {
  themeColor: "#1a3a5c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full`}>
      <body className="h-full bg-gray-950 text-gray-100 antialiased">{children}</body>
    </html>
  )
}

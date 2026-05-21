import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const dbUrl = process.env.DATABASE_URL ?? ""
  const masked = dbUrl
    ? `${dbUrl.slice(0, 20)}...${dbUrl.slice(-20)}`
    : "(vazio)"

  try {
    const count = await prisma.user.count()
    return NextResponse.json({ db: "ok", users: count, url: masked })
  } catch (err) {
    return NextResponse.json(
      { db: "fail", error: String(err).slice(0, 200), url: masked },
      { status: 500 },
    )
  }
}

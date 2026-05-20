import webpush from "web-push"
import { prisma } from "./prisma"

webpush.setVapidDetails(
  "mailto:leonardobohrer@gmail.com",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

interface PushPayload {
  titulo: string
  corpo: string
  link?: string
  tipo?: string
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subs = await prisma.pushSubscription.findMany({
    where: { userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  })

  const body = JSON.stringify(payload)

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
        )
      } catch (err: unknown) {
        if (err && typeof err === "object" && "statusCode" in err) {
          const code = (err as { statusCode: number }).statusCode
          if (code === 410 || code === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
          }
        }
      }
    }),
  )
}

export async function sendPushToRole(
  role: string,
  payload: PushPayload,
  excludeUserId?: string,
) {
  const users = await prisma.user.findMany({
    where: {
      role: role as never,
      ativo: true,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  })
  await Promise.allSettled(users.map((u) => sendPushToUser(u.id, payload)))
}

"use client"

import { useEffect, useRef } from "react"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export default function PushSubscriber() {
  const tried = useRef(false)

  useEffect(() => {
    if (tried.current) return
    tried.current = true

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return
    if (Notification.permission !== "granted") return
    if (!VAPID_PUBLIC_KEY) return

    ;(async () => {
      try {
        const reg = await navigator.serviceWorker.ready
        // Only subscribe via push-sw.js registration
        const existing = await reg.pushManager.getSubscription()
        const sub = existing ?? await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        })
      } catch {
        // push not available or permission denied — silently ignore
      }
    })()
  }, [])

  return null
}

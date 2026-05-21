const pad = (n: number) => String(n).padStart(2, "0")

function parts(d: Date) {
  return {
    dd: pad(d.getDate()),
    mm: pad(d.getMonth() + 1),
    yy: String(d.getFullYear()).slice(-2),
    yyyy: String(d.getFullYear()),
    hh: pad(d.getHours()),
    min: pad(d.getMinutes()),
  }
}

/** DD/MM/AAAA */
export function fmtDate(iso: string | Date): string {
  if (typeof iso === "string" && !iso.includes("T")) {
    const [y, m, d] = iso.split("-")
    return `${d}/${m}/${y}`
  }
  const d = typeof iso === "string" ? new Date(iso) : iso
  const { dd, mm, yyyy } = parts(d)
  return `${dd}/${mm}/${yyyy}`
}

/** DD/MM/AA */
export function fmtDateShort(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso
  const { dd, mm, yy } = parts(d)
  return `${dd}/${mm}/${yy}`
}

/** DD/MM/AA HH:mm */
export function fmtDateTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso
  const { dd, mm, yy, hh, min } = parts(d)
  return `${dd}/${mm}/${yy} ${hh}:${min}`
}

/** DD/MM HH:mm */
export function fmtHora(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso
  const { dd, mm, hh, min } = parts(d)
  return `${dd}/${mm} ${hh}:${min}`
}

/** YYYY-MM-DDTHH:mm  (for datetime-local inputs) */
export function fmtLocalInput(d: Date): string {
  const { dd, mm, yyyy, hh, min } = parts(d)
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

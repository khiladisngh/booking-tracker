const DEVICE_ID_KEY = 'booking_device_id'

// Generate a short opaque ID per install. Survives across PWA launches; a
// reinstall (or cleared storage) creates a new one, which is fine — the admin
// sees "who's currently online" not long-term identity.
export function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = (crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 10))
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

// Pretty device label from userAgent — "Chrome on Android", "Safari on iPhone",
// "Edge on Windows", etc. Falls back to the raw UA when parsing fails.
export function describeDevice(ua = navigator.userAgent) {
  const platform =
    /iPhone/i.test(ua)      ? 'iPhone'   :
    /iPad/i.test(ua)        ? 'iPad'     :
    /Android/i.test(ua)     ? 'Android'  :
    /Macintosh/i.test(ua)   ? 'macOS'    :
    /Windows/i.test(ua)     ? 'Windows'  :
    /Linux/i.test(ua)       ? 'Linux'    : 'Unknown'

  const browser =
    /EdgA?\//i.test(ua)                         ? 'Edge'    :
    /OPR\//i.test(ua)                           ? 'Opera'   :
    /Firefox\//i.test(ua)                       ? 'Firefox' :
    /Chrome\//i.test(ua) && !/Edg/i.test(ua)    ? 'Chrome'  :
    /Safari\//i.test(ua)                        ? 'Safari'  : 'Browser'

  return `${browser} on ${platform}`
}

export async function fetchPublicIp() {
  try {
    const res = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return data.ip ?? null
  } catch {
    return null
  }
}

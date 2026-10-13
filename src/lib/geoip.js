// Looks up the viewer's approximate location from their IP (city level). Free tier, no key.
export async function lookupIP() {
  try {
    const r = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) })
    if (!r.ok) return null
    const j = await r.json()
    if (!j || j.error || typeof j.latitude !== 'number') return null
    const region = j.country_code === 'US' || j.country_code === 'CA' ? (j.region_code || j.region) : j.country_name
    return { lat: j.latitude, lng: j.longitude, city: [j.city, region].filter(Boolean).join(', ') }
  } catch { return null }
}

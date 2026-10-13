import * as si from 'simple-icons'
// resource name -> simple-icons slug (+ optional display color override)
const MAP = {
  'claude': ['siAnthropic', 'D97757'], 'chatgpt': ['siOpenai', 'FFFFFF'], 'stripe': ['siStripe'], 'meta business manager': ['siMeta'],
  'meta ads library': ['siFacebook'], 'google ads': ['siGoogleads'], 'canva': ['siCanva'], 'loom': ['siLoom'], 'discord': ['siDiscord'],
  'instagram': ['siInstagram'], 'vimeo': ['siVimeo'], 'notion': ['siNotion', 'FFFFFF'], 'zapier': ['siZapier'], 'n8n': ['siN8n'],
  'tiktok creative center': ['siTiktok', 'FFFFFF'], 'youtube': ['siYoutube'], 'linkedin': ['siLinkedin'], 'calendly': ['siCalendly'],
  'slack': ['siSlack'], 'gmail': ['siGmail'], 'google workspace': ['siGoogle'], 'hyros': [], 'gohighlevel': [], 'base44': [], 'wise': ['siWise'], 'square': ['siSquare', 'FFFFFF'], 'google ads transparency center': ['siGoogleads'],
}
export function iconFor(name, slugOverride) {
  const key = (name || '').trim().toLowerCase()
  const [slug, color] = slugOverride ? [slugOverride] : (MAP[key] || [])
  const ic = slug && si[slug]
  if (!ic) return null
  return { path: ic.path, color: '#' + (color || ic.hex) }
}

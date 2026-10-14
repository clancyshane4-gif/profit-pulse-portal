// Emails the support inbox when a student sends a support message (needs RESEND_API_KEY; silently skips otherwise).
import { createClient } from '@supabase/supabase-js'
export default async (req) => {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  const sb = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://uettsffafwzxnlahcllp.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  const { data: { user } } = await sb.auth.getUser(token)
  if (!user) return new Response('{"error":"Not signed in"}', { status: 401 })
  const { body } = await req.json().catch(() => ({}))
  const { data: cfg } = await sb.from('settings').select('value').eq('key', 'support').maybeSingle()
  const to = cfg?.value?.email || 'support@aiprofitpulse.com'
  const { data: p } = await sb.from('profiles').select('name,email').eq('id', user.id).maybeSingle()
  const resend = process.env.RESEND_API_KEY, from = process.env.EMAIL_FROM || 'Profit Pulse AI <noreply@profitpulsebootcamp.com>'
  if (!resend) return new Response('{"sent":false,"reason":"no RESEND_API_KEY"}', { headers: { 'content-type': 'application/json' } })
  const site = process.env.SITE_URL || 'https://profit-pulse-portal.netlify.app'
  const html = `<p><b>${p?.name || 'A student'}</b> (${p?.email || user.email}) wrote in the portal support chat:</p><blockquote>${String(body || '').replace(/</g, '&lt;')}</blockquote><p>Reply in <a href="${site}/admin">Admin → Support</a>.</p>`
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: `Bearer ${resend}`, 'content-type': 'application/json' }, body: JSON.stringify({ from, to, reply_to: p?.email, subject: `Support: ${p?.name || user.email}`, html }) })
  return new Response(JSON.stringify({ sent: r.ok }), { headers: { 'content-type': 'application/json' } })
}

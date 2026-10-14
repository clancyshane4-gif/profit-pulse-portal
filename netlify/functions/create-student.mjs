// Creates a student account with a temporary password (or resets one). Callers must be setter, coach or admin.
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { createClient } from '@supabase/supabase-js'

const WORDS = ['pulse', 'profit', 'build', 'launch', 'client', 'agent', 'scale', 'close', 'pitch', 'brand', 'offer', 'niche']
const tempPassword = () => { const r = crypto.getRandomValues(new Uint32Array(3)); return `${WORDS[r[0] % WORDS.length]}-${WORDS[r[1] % WORDS.length]}-${1000 + (r[2] % 9000)}` }


// Email the login. With RESEND_API_KEY: a branded email containing the temporary password.
// Without it: Supabase's own "set your password" email (built-in sender, limited to a few per hour).
async function emailLogin(admin, { email, name, password, site, reset }) {
  const resend = process.env.RESEND_API_KEY, from = process.env.EMAIL_FROM || 'Profit Pulse AI <noreply@profitpulsebootcamp.com>'
  if (resend) {
    const first = (name || '').split(' ')[0] || 'there'
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111;line-height:1.5">
      <p>Hey ${first},</p>
      <p>${reset ? 'Here is your new temporary password for the Profit Pulse AI portal.' : 'Your Profit Pulse AI portal login is ready.'}</p>
      <p><b>Link:</b> <a href="${site}">${site}</a><br><b>Email:</b> ${email}<br><b>Temporary password:</b> <code style="font-size:16px">${password}</code></p>
      <p>It will ask you to set your own password the first time you sign in, then add a photo and you're in.</p>
      <p>See you on the calls.<br>Profit Pulse AI</p></div>`
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: `Bearer ${resend}`, 'content-type': 'application/json' }, body: JSON.stringify({ from, to: email, subject: reset ? 'Your new Profit Pulse AI login' : 'Your Profit Pulse AI portal login', html }) })
    return r.ok ? 'resend' : ''
  }
  // fallback: Supabase recovery email -> /set-password (user picks their own password, no temp password needed)
  const { error } = await admin.auth.resetPasswordForEmail(email, { redirectTo: site + '/set-password' })
  return error ? '' : 'supabase'
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://uettsffafwzxnlahcllp.supabase.co'), service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !service) return json({ error: 'Server is missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY' }, 500)
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Not signed in' }, 401)

  const admin = createClient(url, service, { auth: { persistSession: false } })
  const { data: { user }, error: uErr } = await admin.auth.getUser(token)
  if (uErr || !user) return json({ error: 'Not signed in' }, 401)
  const { data: caller } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!caller || !['admin', 'coach', 'setter'].includes(caller.role)) return json({ error: 'Reps only' }, 403)

  let body = {}; try { body = await req.json() } catch {}
  const action = body.action || 'create'
  const email = String(body.email || '').trim().toLowerCase(), name = String(body.name || '').trim()
  if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: 'Enter a valid email' }, 400)
  const password = tempPassword()
  const site = process.env.SITE_URL || 'https://profit-pulse-portal.netlify.app'
  const wantEmail = body.send_email !== false

  if (action === 'reset') {
    const { data: prof } = await admin.from('profiles').select('id,role').eq('email', email).maybeSingle()
    if (!prof) return json({ error: 'No account with that email' }, 404)
    if (prof.role !== 'student' && caller.role !== 'admin') return json({ error: 'Only admins can reset staff passwords' }, 403)
    const { error } = await admin.auth.admin.updateUserById(prof.id, { password })
    if (error) return json({ error: error.message }, 400)
    await admin.from('profiles').update({ must_change_password: true }).eq('id', prof.id)
    const emailed = wantEmail ? await emailLogin(admin, { email, name, password, site, reset: true }) : ''
    return json({ ok: true, email, password, reset: true, emailed })
  }

  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } })
  if (error) {
    if (/already|exists|registered/i.test(error.message)) return json({ error: 'That email already has an account. Use "Reset password" to give them a new temporary one.' }, 409)
    return json({ error: error.message }, 400)
  }
  // role: only admins may create staff; everyone else creates students
  const wanted = String(body.role || 'student'); const role = caller.role === 'admin' && ['student', 'setter', 'coach', 'admin'].includes(wanted) ? wanted : 'student'
  const patch = { name, must_change_password: true, added_by: user.id }; if (role !== 'student') patch.role = role
  await admin.from('profiles').update(patch).eq('id', data.user.id)
  if (role === 'admin') await admin.from('admin_emails').insert({ email }).then(() => {}, () => {})
  const emailed = wantEmail ? await emailLogin(admin, { email, name, password, site }) : ''
  return json({ ok: true, email, password, id: data.user.id, emailed })
}
const json = (b, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'content-type': 'application/json' } })

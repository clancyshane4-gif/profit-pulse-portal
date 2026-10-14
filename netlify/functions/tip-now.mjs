// Admin-only: post the next tip immediately. POST with the admin's session token.
import { db, postNextTip } from './lib/tip.mjs'
export default async (req) => {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  const sb = db()
  const { data: { user } } = await sb.auth.getUser(token)
  if (!user) return new Response(JSON.stringify({ error: 'Not signed in' }), { status: 401 })
  const { data: prof } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (prof?.role !== 'admin') return new Response(JSON.stringify({ error: 'Admins only' }), { status: 403 })
  const r = await postNextTip({ force: true })
  return new Response(JSON.stringify(r), { headers: { 'content-type': 'application/json' } })
}

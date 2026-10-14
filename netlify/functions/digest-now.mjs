// Admin-only manual trigger: POST with the admin's session token. ?dry=1 reports what would happen without sending.
import { createClient } from '@supabase/supabase-js'
import { runDigest } from './lib/digest.mjs'
export default async (req) => {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  const { data: { user } } = await admin.auth.getUser(token)
  if (!user) return new Response(JSON.stringify({ error: 'Not signed in' }), { status: 401 })
  const { data: prof } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (prof?.role !== 'admin') return new Response(JSON.stringify({ error: 'Admins only' }), { status: 403 })
  const dry = new URL(req.url).searchParams.get('dry') === '1'
  const r = await runDigest({ dryRun: dry })
  return new Response(JSON.stringify(r), { headers: { 'content-type': 'application/json' } })
}

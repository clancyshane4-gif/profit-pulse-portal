// Daily tip bot: posts the next unposted tip as an announcement once per day at the configured Eastern hour.
import { createClient } from '@supabase/supabase-js'

export function db() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://uettsffafwzxnlahcllp.supabase.co'
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!service) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, service, { auth: { persistSession: false } })
}
const etParts = (d = new Date()) => {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit' })
  const o = {}; f.formatToParts(d).forEach(p => { o[p.type] = p.value }); return { hour: Number(o.hour) % 24, day: `${o.year}-${o.month}-${o.day}` }
}

// force: post regardless of schedule/time (admin "post now")
export async function postNextTip({ force = false } = {}) {
  const sb = db()
  const { data: cfgRow } = await sb.from('settings').select('value').eq('key', 'auto_tip').maybeSingle()
  const cfg = { enabled: true, hour_et: 9, ...(cfgRow?.value || {}) }
  const now = etParts()
  if (!force) {
    if (!cfg.enabled) return { posted: false, reason: 'auto tip is off' }
    if (now.hour !== Number(cfg.hour_et)) return { posted: false, reason: `not the hour (ET ${now.hour}, want ${cfg.hour_et})` }
    // already posted today (ET)?
    const { data: last } = await sb.from('announcements').select('created_at').eq('kind', 'tip').order('created_at', { ascending: false }).limit(1)
    if (last?.[0] && etParts(new Date(last[0].created_at)).day === now.day) return { posted: false, reason: 'already posted today' }
  }
  let { data: next } = await sb.from('tips').select('*').eq('active', true).is('posted_at', null).order('sort').limit(1)
  if (!next?.length) {
    // bank exhausted: start the rotation over
    await sb.from('tips').update({ posted_at: null }).eq('active', true)
    const r = await sb.from('tips').select('*').eq('active', true).order('sort').limit(1); next = r.data
  }
  const tip = next?.[0]
  if (!tip) return { posted: false, reason: 'no tips in the bank' }
  // only the newest tip stays active so the popup doesn't stack old ones
  await sb.from('announcements').update({ active: false }).eq('kind', 'tip').eq('active', true)
  const { error } = await sb.from('announcements').insert({ title: tip.title, body: tip.body, kind: 'tip', active: true, link_url: '', link_label: '' })
  if (error) return { posted: false, reason: error.message }
  await sb.from('tips').update({ posted_at: new Date().toISOString() }).eq('id', tip.id)
  return { posted: true, title: tip.title, category: tip.category }
}

// Shared logic for the daily job: Discord top 10 + wins, streak reminders, Phase 1 Discord role.
import { createClient } from '@supabase/supabase-js'

export async function runDigest({ dryRun = false } = {}) {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://uettsffafwzxnlahcllp.supabase.co'), service = process.env.SUPABASE_SERVICE_ROLE_KEY
  const site = process.env.SITE_URL || 'https://profit-pulse-portal.netlify.app'
  if (!url || !service) return { error: 'Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY' }
  const db = createClient(url, service, { auth: { persistSession: false } })
  const out = { discord: 'skipped (no DISCORD_WEBHOOK_URL)', reminders: 'skipped (no RESEND_API_KEY)', roles: 'skipped (no DISCORD_BOT_TOKEN)', details: {} }

  // ---- top 10 + today's wins to Discord (webhook) ----
  const { data: board } = await db.from('leaderboard').select('name,points').order('points', { ascending: false }).limit(10)
  const since = new Date(Date.now() - 864e5).toISOString()
  const { data: wins } = await db.from('wins').select('name,title,points,won_at').gte('won_at', since).order('won_at', { ascending: false })
  const hook = process.env.DISCORD_WEBHOOK_URL
  if (hook) {
    const medal = i => ['🥇', '🥈', '🥉'][i] || `**#${i + 1}**`
    const top = (board || []).map((b, i) => `${medal(i)} ${b.name} — **${b.points}** pts`).join('\n') || 'No points yet.'
    const w = (wins || []).map(x => `• **${x.name}** ${x.title.toLowerCase()} (+${x.points})`).join('\n')
    const embeds = [{ title: '🏆 Profit Pulse leaderboard — top 10', description: top, color: 0x22e36b, url: site + '/leaderboard' }]
    if (w) embeds.push({ title: '🔥 Wins in the last 24 hours', description: w, color: 0xf5c652 })
    if (!dryRun) { const r = await fetch(hook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'Profit Pulse', embeds }) }); out.discord = r.ok ? 'posted' : `failed (${r.status})` } else out.discord = 'would post'
    out.details.wins = (wins || []).length
  }

  // ---- streak reminders by email (Resend) ----
  const resend = process.env.RESEND_API_KEY, from = process.env.EMAIL_FROM || 'Profit Pulse AI <noreply@profitpulsebootcamp.com>'
  const { data: streaks } = await db.rpc('streak_days')
  const today = new Date().toISOString().slice(0, 10)
  const atRisk = (streaks || []).filter(s => s.streak >= 3 && s.last_day < today) // active yesterday, nothing yet today
  out.details.at_risk = atRisk.length
  if (resend) {
    let sent = 0
    for (const s of atRisk) {
      const { data: p } = await db.from('profiles').select('last_streak_reminder').eq('id', s.profile_id).maybeSingle()
      if (p?.last_streak_reminder === today || !s.email) continue
      const html = `<p>Hey ${(s.name || '').split(' ')[0] || 'there'},</p><p>Your <b>${s.streak}-day streak</b> ends tonight if you don't earn points today. One lesson or one proof submission keeps it alive.</p><p><a href="${site}">Open the portal</a></p><p>— Profit Pulse AI</p>`
      if (!dryRun) {
        const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: `Bearer ${resend}`, 'content-type': 'application/json' }, body: JSON.stringify({ from, to: s.email, subject: `Your ${s.streak}-day streak ends tonight`, html }) })
        if (r.ok) { sent++; await db.from('profiles').update({ last_streak_reminder: today }).eq('id', s.profile_id) }
      } else sent++
    }
    out.reminders = `${dryRun ? 'would send' : 'sent'} ${sent}`
  }

  // ---- Phase 1 complete → Discord role (bot) ----
  const bot = process.env.DISCORD_BOT_TOKEN, guild = process.env.DISCORD_GUILD_ID, role = process.env.DISCORD_PHASE1_ROLE_ID
  if (bot && guild && role) {
    const { data: p1 } = await db.from('modules').select('id').eq('phase_id', 'p1')
    const ids = (p1 || []).map(m => m.id)
    const { data: cands } = await db.from('profiles').select('id,discord,name').eq('role', 'student').eq('discord_role_granted', false).neq('discord', '')
    let granted = 0, missing = []
    for (const c of cands || []) {
      const { data: done } = await db.from('lesson_progress').select('module_id').eq('profile_id', c.id).in('module_id', ids)
      if (!ids.length || (done || []).length < ids.length) continue
      const h = { authorization: `Bot ${bot}` }
      const s = await fetch(`https://discord.com/api/v10/guilds/${guild}/members/search?query=${encodeURIComponent(c.discord)}&limit=5`, { headers: h }).then(r => r.json()).catch(() => [])
      const m = (Array.isArray(s) ? s : []).find(x => (x.user?.username || '').toLowerCase() === c.discord.toLowerCase()) || (Array.isArray(s) ? s[0] : null)
      if (!m) { missing.push(c.discord); continue }
      if (!dryRun) { const r = await fetch(`https://discord.com/api/v10/guilds/${guild}/members/${m.user.id}/roles/${role}`, { method: 'PUT', headers: h }); if (r.ok || r.status === 204) { granted++; await db.from('profiles').update({ discord_role_granted: true }).eq('id', c.id) } } else granted++
    }
    out.roles = `${dryRun ? 'would grant' : 'granted'} ${granted}${missing.length ? `, not found in server: ${missing.join(', ')}` : ''}`
  }
  return out
}

import { supabase, DEMO } from './supabase'

export const esc = s => String(s ?? '')
export const initials = n => (n || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
export const todayKey = () => new Date().toISOString().slice(0, 10)

export function tierOf(points, tiers) {
  let t = 'New member', idx = -1
  tiers.forEach(([n, v], i) => { if (points >= v) { t = n; idx = i } })
  return { t, next: tiers[idx + 1] || null, base: idx >= 0 ? tiers[idx][1] : 0 }
}

// ---------- settings ----------
export async function loadSettings() {
  const { data } = await supabase.from('settings').select('key,value')
  const s = {}; (data || []).forEach(r => { s[r.key] = r.value })
  return s
}

// ---------- profile ----------
export async function loadMyProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  return data
}
export async function saveMyProfile(userId, patch) {
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId)
  if (error) throw error
}
export async function uploadAvatar(userId, blob) {
  if (DEMO) return await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob) })
  const path = `${userId}/avatar.jpg`
  const { error } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
  if (error) throw error
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl + '?v=' + Date.now()
}
export function fileToSquareBlob(file) {
  return new Promise((res, rej) => {
    const img = new Image(); const url = URL.createObjectURL(file)
    img.onload = () => {
      const s = Math.min(img.width, img.height); const c = document.createElement('canvas'); c.width = c.height = 400
      c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 400, 400)
      URL.revokeObjectURL(url); c.toBlob(b => b ? res(b) : rej(new Error('encode')), 'image/jpeg', 0.85)
    }
    img.onerror = () => rej(new Error('bad image')); img.src = url
  })
}

// ---------- course ----------
export async function loadModules() {
  const { data } = await supabase.from('modules').select('*').eq('published', true).order('sort')
  return data || []
}
export async function loadMyProgress(userId) {
  const { data } = await supabase.from('lesson_progress').select('module_id,completed_at').eq('profile_id', userId)
  const m = {}; (data || []).forEach(r => { m[r.module_id] = r.completed_at }); return m
}
export async function completeModule(userId, moduleId, points) {
  const { error } = await supabase.from('lesson_progress').insert({ profile_id: userId, module_id: moduleId })
  if (error && error.code !== '23505') throw error
  await bumpActivity(userId, points)
}
export async function bumpActivity(userId, points) {
  const day = todayKey()
  const { data } = await supabase.from('activity_days').select('points').eq('profile_id', userId).eq('day', day).maybeSingle()
  if (data) await supabase.from('activity_days').update({ points: (data.points || 0) + points }).eq('profile_id', userId).eq('day', day)
  else await supabase.from('activity_days').insert({ profile_id: userId, day, points })
}
export async function loadMyActivity(userId) {
  const { data } = await supabase.from('activity_days').select('day,points').eq('profile_id', userId)
  const m = {}; (data || []).forEach(r => { m[r.day] = r.points }); return m
}

// ---------- achievements ----------
export async function loadAchievements() {
  const { data } = await supabase.from('achievements').select('*').order('sort'); return data || []
}
export async function loadMySubmissions(userId) {
  const { data } = await supabase.from('submissions').select('*').eq('profile_id', userId)
  const m = {}; (data || []).forEach(r => { m[r.achievement_key] = r }); return m
}
export async function submitProof(userId, key, proof) {
  const { error } = await supabase.from('submissions').insert({ profile_id: userId, achievement_key: key, proof })
  if (error) throw error
}

// ---------- leaderboard ----------
export async function loadLeaderboard() {
  const { data } = await supabase.from('leaderboard').select('*').order('points', { ascending: false })
  return data || []
}
export async function loadStreaks() {
  const { data } = await supabase.from('activity_days').select('profile_id,day')
  const byUser = {}; (data || []).forEach(r => { (byUser[r.profile_id] ||= new Set()).add(r.day) })
  const out = {}
  for (const id in byUser) {
    let s = 0; const d = new Date(); let k = d.toISOString().slice(0, 10)
    if (!byUser[id].has(k)) d.setDate(d.getDate() - 1)
    for (let i = 0; i < 400; i++) { k = d.toISOString().slice(0, 10); if (!byUser[id].has(k)) break; s++; d.setDate(d.getDate() - 1) }
    out[id] = s
  }
  return out
}

// ---------- admin ----------
export async function adminLoadMembers() {
  const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }); return data || []
}
export async function adminLoadPending() {
  const { data } = await supabase.from('submissions').select('*, profiles(name), achievements(title,points)').eq('status', 'pending').order('created_at')
  return data || []
}
export async function adminReview(id, status) {
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('submissions').update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}
export async function adminUpdateProfile(id, patch) {
  const { error } = await supabase.from('profiles').update(patch).eq('id', id); if (error) throw error
}
export async function adminUpdateModule(id, patch) {
  const { error } = await supabase.from('modules').update(patch).eq('id', id); if (error) throw error
}
export async function repCreateStudent(email, name, action = 'create') {
  if (DEMO) return { ok: true, email, password: 'pulse-build-' + Math.floor(1000 + Math.random() * 9000), reset: action === 'reset' }
  const { data: { session } } = await supabase.auth.getSession()
  const r = await fetch('/.netlify/functions/create-student', {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ email, name, action })
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.error || `Request failed (${r.status})`)
  return j
}
export async function repLoadMyStudents(userId, all) {
  let q = supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (!all) q = q.eq('added_by', userId)
  const { data } = await q; return data || []
}
export async function clearMustChange(userId) { await supabase.from('profiles').update({ must_change_password: false }).eq('id', userId) }

// ---------- watch progress ----------
export async function loadWatch(userId, moduleId) {
  const { data } = await supabase.from('watch_progress').select('seconds,duration').eq('profile_id', userId).eq('module_id', moduleId).maybeSingle()
  return data || { seconds: 0, duration: 0 }
}
export async function saveWatch(userId, moduleId, seconds, duration) {
  const { data } = await supabase.from('watch_progress').select('seconds').eq('profile_id', userId).eq('module_id', moduleId).maybeSingle()
  if (data) await supabase.from('watch_progress').update({ seconds, duration, updated_at: new Date().toISOString() }).eq('profile_id', userId).eq('module_id', moduleId)
  else await supabase.from('watch_progress').insert({ profile_id: userId, module_id: moduleId, seconds, duration })
}
// a module is locked until every earlier core module is complete (bonus modules stay open)
export function isLocked(mods, prog, m) {
  if (m.group_key !== 'core') return false
  const core = mods.filter(x => x.group_key === 'core')
  const i = core.findIndex(x => x.id === m.id)
  return core.slice(0, i).some(x => !prog[x.id])
}

// ---------- phases / quizzes ----------
export async function loadPhases() { const { data } = await supabase.from('phases').select('*').order('sort'); return data || [] }
export async function loadMyQuizAttempts(userId) {
  const { data } = await supabase.from('quiz_attempts').select('module_id,score_pct,passed,created_at').eq('profile_id', userId).order('created_at', { ascending: false })
  const m = {}; (data || []).forEach(r => { if (!m[r.module_id] || r.passed) m[r.module_id] = r }); return m
}
export async function recordQuizAttempt(userId, moduleId, scorePct, passed) {
  await supabase.from('quiz_attempts').insert({ profile_id: userId, module_id: moduleId, score_pct: scorePct, passed })
}

// ---------- calendar ----------
export async function loadEvents() { const { data } = await supabase.from('events').select('*').eq('active', true).order('sort'); return data || [] }
export async function adminSaveEvent(ev) {
  const { id, ...rest } = ev
  if (id) { const { error } = await supabase.from('events').update(rest).eq('id', id); if (error) throw error }
  else { const { error } = await supabase.from('events').insert(rest); if (error) throw error }
}
export async function adminDeleteEvent(id) { await supabase.from('events').delete().eq('id', id) }

// ---------- recordings ----------
export async function loadRecordings() { const { data } = await supabase.from('recordings').select('*').order('held_on', { ascending: false }); return data || [] }
export async function loadMyWatches(userId) { const { data } = await supabase.from('recording_watches').select('recording_id').eq('profile_id', userId); return new Set((data || []).map(r => r.recording_id)) }
export async function setWatched(userId, recId, on) {
  if (on) { await supabase.from('recording_watches').insert({ profile_id: userId, recording_id: recId }); await bumpActivity(userId, 0) }
  else await supabase.from('recording_watches').delete().eq('profile_id', userId).eq('recording_id', recId)
}
export async function adminSaveRecording(rec) {
  const { id, ...rest } = rec
  if (id) { const { error } = await supabase.from('recordings').update(rest).eq('id', id); if (error) throw error }
  else { const { error } = await supabase.from('recordings').insert(rest); if (error) throw error }
}
export async function adminDeleteRecording(id) { await supabase.from('recordings').delete().eq('id', id) }

// ---------- leaderboard extras ----------
export async function loadLeaderboardSince(sinceIso) {
  if (DEMO) return loadLeaderboard()
  const { data } = await supabase.rpc('leaderboard_since', { since: sinceIso })
  return (data || []).sort((a, b) => b.points - a.points)
}
export async function loadBreakdown(profileId) {
  const [{ data: lp }, { data: sb }, { data: ad }, mods, ach] = await Promise.all([
    supabase.from('lesson_progress').select('module_id,completed_at').eq('profile_id', profileId),
    supabase.from('submissions').select('achievement_key,reviewed_at,created_at').eq('profile_id', profileId).eq('status', 'approved'),
    supabase.from('activity_days').select('day').eq('profile_id', profileId),
    loadModules(), loadAchievements()])
  const items = []
  ;(sb || []).forEach(s => { const a = ach.find(x => x.key === s.achievement_key); if (a) items.push({ t: a.title, k: a.category === 'revenue' ? 'Results' : 'Implementation', p: a.points, at: s.reviewed_at || s.created_at }) })
  ;(lp || []).forEach(l => { const m = mods.find(x => x.id === l.module_id); if (m) items.push({ t: m.title, k: 'Course', p: m.points, at: l.completed_at }) })
  const days = (ad || []).length; if (days) items.push({ t: 'Daily activity', k: `${days} active days`, p: days * 3, at: null })
  items.sort((a, b) => b.p - a.p)
  return items
}

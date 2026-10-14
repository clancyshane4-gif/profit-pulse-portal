import { useEffect, useState } from 'react'
import { useApp } from '../App'
import { adminLoadMembers, adminLoadPending, repCreateStudent, adminReviewV2, adminUpdateProfile, loadAchievements, adminSaveAchievement, adminDeleteAchievement, loadModules, adminUpdateModule, loadLeaderboard, loadPhases, loadEvents, adminSaveEvent, adminDeleteEvent, loadRecordings, adminSaveRecording, adminDeleteRecording, loadAnnouncements, adminSaveAnnouncement, adminDeleteAnnouncement, adminRunDigest, loadTips, adminSaveTip, adminDeleteTip, adminSaveSetting, adminPostTipNow, loadSettings, adminLoadSupportInbox, sendSupport, markSupportRead } from '../lib/data'
import { supabase } from '../lib/supabase'
import Avatar from '../components/Avatar'

export default function Admin() {
  const [tab, setTab] = useState('members')
  return (
    <section className="page">
      <div className="head"><div><h1>Admin</h1><p>Manage members and roles, approve proof, and manage module videos. Reps add students from the Rep panel.</p></div></div>
      <div className="tabs">{[['members', 'Members'], ['review', 'Pending reviews'], ['ach', 'Achievements'], ['modules', 'Lessons & videos'], ['calls', 'Call schedule'], ['recordings', 'Recordings'], ['announce', 'Announcements'], ['support', 'Support'], ['affiliate', 'Affiliate tools'], ['resources', 'Resources'], ['auto', 'Automations']].map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === 'members' && <Members />}
      {tab === 'review' && <Review />}
      {tab === 'ach' && <AchievementsAdmin />}
      {tab === 'modules' && <Modules />}
      {tab === 'calls' && <Calls />}
      {tab === 'recordings' && <RecordingsAdmin />}
      {tab === 'announce' && <Announcements />}
      {tab === 'support' && <SupportInbox />}
      {tab === 'affiliate' && <AffiliateAdmin />}
      {tab === 'resources' && <ResourcesAdmin />}
      {tab === 'auto' && <Automations />}
    </section>
  )
}

function Members() {
  const { user } = useApp(); const [list, setList] = useState([]); const [board, setBoard] = useState({})
  const load = () => { adminLoadMembers().then(setList); loadLeaderboard().then(b => { const m = {}; b.forEach(x => { m[x.id] = x.points }); setBoard(m) }) }
  useEffect(load, [])
  async function toggle(m) { await adminUpdateProfile(m.id, { active: !m.active }); load() }
  async function role(m, r) { await adminUpdateProfile(m.id, { role: r }); load() }
  const [nw, setNw] = useState({ name: '', email: '', role: 'student' }); const [busy, setBusy] = useState(false); const [result, setResult] = useState(null); const [err, setErr] = useState(''); const [copied, setCopied] = useState(false)
  async function create(e) {
    e.preventDefault(); setBusy(true); setErr(''); setResult(null); setCopied(false)
    try { const r = await repCreateStudent(nw.email, nw.name, 'create', nw.role); setResult({ ...r, role: nw.role }); setNw({ name: '', email: '', role: 'student' }); load() } catch (ex) { setErr(ex.message) }
    setBusy(false)
  }
  async function reset(m) { setErr(''); setResult(null); setCopied(false); try { setResult(await repCreateStudent(m.email, m.name, 'reset')) } catch (ex) { setErr(ex.message) } }
  const handoff = result ? `Here's your Profit Pulse AI portal login.\nLink: ${location.origin}\nEmail: ${result.email}\nTemporary password: ${result.password}\nIt will ask you to set your own password the first time you sign in.` : ''
  async function copy() { try { await navigator.clipboard.writeText(handoff); setCopied(true) } catch { setCopied(false) } }
  const roleLabel = { student: 'Student', setter: 'Rep (setter)', coach: 'Coach', admin: 'Admin' }
  return (<>
    <form className="card" onSubmit={create} style={{ marginBottom: 14 }}><b>Add a member</b><div className="note">Creates the login and gives you a temporary password to send them. Reps can also add students from the Rep panel.</div>
      <div className="grid2" style={{ marginTop: 12 }}>
        <div><label className="f" htmlFor="aName">Name</label><input id="aName" type="text" value={nw.name} onChange={e => setNw({ ...nw, name: e.target.value })} placeholder="First and last" required /></div>
        <div><label className="f" htmlFor="aEmail">Email</label><input id="aEmail" type="email" value={nw.email} onChange={e => setNw({ ...nw, email: e.target.value })} placeholder="person@email.com" autoComplete="off" required /></div>
        <div><label className="f" htmlFor="aRole">Role</label><select id="aRole" value={nw.role} onChange={e => setNw({ ...nw, role: e.target.value })}>{Object.entries(roleLabel).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
      </div>
      <div className="row" style={{ gap: 10, marginTop: 12, flexWrap: 'wrap' }}><button className="btn primary" disabled={busy}>{busy ? 'Creating…' : 'Create login'}</button><span className="err" style={{ minHeight: 0 }}>{err}</span></div>
    </form>
    {result && <div className="card" style={{ marginBottom: 14, borderColor: 'rgba(34,227,107,.35)' }}>
      <div className="row spread" style={{ flexWrap: 'wrap', gap: 8 }}><b>{result.reset ? 'New temporary password' : `${roleLabel[result.role] || 'Login'} created`}</b><span className="pill">Shown once</span></div>
      <div className="grid2" style={{ marginTop: 10 }}>
        <div><div className="note">Email</div><div className="num" style={{ fontSize: 15 }}>{result.email}</div></div>
        <div><div className="note">Temporary password</div><div className="num" style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{result.password}</div></div>
      </div>
      <div className="note" style={{ margin: '12px 0 6px' }}>Message to send them</div>
      <textarea readOnly value={handoff} style={{ minHeight: 120 }} onFocus={e => e.target.select()} />
      <div className="row" style={{ gap: 8, marginTop: 8 }}><button type="button" className="btn sm primary" onClick={copy}>{copied ? 'Copied' : 'Copy message'}</button></div>
    </div>}
    <div className="card"><div className="row spread"><b>Members</b><span className="note">{list.length} total</span></div>
      {list.map(m => <div key={m.id} className="coachrow"><Avatar name={m.name} url={m.photo_url} /><div style={{ minWidth: 0 }}>
        <b>{m.name || '(no name yet)'}</b> <span className="note">· {m.email} · {m.city || 'no city'}{m.discord ? ` · @${m.discord}` : ''} · {board[m.id] ?? 0} pts · joined {new Date(m.created_at).toLocaleDateString()}</span>
        <div className="note">{m.must_change_password ? "Hasn't signed in yet" : m.onboarded ? 'Photo added' : 'Signed in, photo not added yet'}</div>
        <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {m.id !== user.id && <><button className="btn sm" onClick={() => toggle(m)}>{m.active ? 'Disable' : 'Enable'}</button>
            <select value={m.role} onChange={e => role(m, e.target.value)} style={{ width: 'auto', padding: '6px 10px' }}><option value="student">Student</option><option value="setter">Rep (setter)</option><option value="coach">Coach</option><option value="admin">Admin</option></select>
            <button className="btn sm" onClick={() => reset(m)}>Reset password</button></>}
        </div></div>
        <span className={`pill ${m.active ? (m.onboarded ? '' : 'warn') : 'grey'}`}>{!m.active ? 'Disabled' : m.onboarded ? 'Onboarded' : 'Incomplete'}</span></div>)}
      {!list.length && <div className="note" style={{ padding: '10px 0' }}>No members yet.</div>}
    </div>
  </>)
}

function Review() {
  const [list, setList] = useState([]); const [rej, setRej] = useState(null); const [note, setNote] = useState(''); const [zoom, setZoom] = useState('')
  const load = () => adminLoadPending().then(setList)
  useEffect(() => { load() }, [])
  async function act(id, status, n = '') { await adminReviewV2(id, status, n); setRej(null); setNote(''); load() }
  const quick = ['Screenshot is cut off, send the full page.', 'This looks like a template, show your own version.', 'Need proof it is live (URL or dashboard view).', 'Wrong achievement for this proof.']
  return (
    <div className="card"><b>Pending submissions</b><div className="list" style={{ marginTop: 10 }}>
      {list.length ? list.map(s => <div key={s.id} className="revrow" style={{ flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, flex: 1 }}><b>{s.profiles?.name}</b> · {s.achievements?.title} <span className="note">(+{s.achievements?.points}) · {new Date(s.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
          {s.proof && <div className="note" style={{ wordBreak: 'break-word', marginTop: 4 }}>{/^https?:\/\//.test(s.proof) ? <a href={s.proof} target="_blank" rel="noopener">{s.proof}</a> : s.proof}</div>}
          {Array.isArray(s.images) && s.images.length > 0 && <div className="thumbs" style={{ marginTop: 8 }}>{s.images.map((u, i) => <div key={i}><img src={u} alt="" onClick={() => setZoom(u)} style={{ cursor: 'zoom-in' }} /></div>)}</div>}
          {rej === s.id && <div style={{ marginTop: 10 }}>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>{quick.map(q => <button key={q} className="btn sm" onClick={() => setNote(q)}>{q}</button>)}</div>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Tell them what to fix. They see this and can resubmit." style={{ minHeight: 60 }} />
            <div className="row" style={{ gap: 6, marginTop: 6 }}><button className="btn sm primary" onClick={() => act(s.id, 'rejected', note.trim())}>Send rejection</button><button className="btn sm" onClick={() => { setRej(null); setNote('') }}>Cancel</button></div>
          </div>}
        </div>
        {rej !== s.id && <div className="row" style={{ gap: 6 }}><button className="btn sm primary" onClick={() => act(s.id, 'approved')}>Approve</button><button className="btn sm" onClick={() => { setRej(s.id); setNote('') }}>Reject…</button></div>}
      </div>)
        : <div className="note">Nothing waiting.</div>}
    </div>
    {zoom && <div className="gate" onClick={() => setZoom('')}><img src={zoom} alt="" style={{ maxWidth: '92vw', maxHeight: '90vh', borderRadius: 14, border: '1px solid var(--line-2)' }} /></div>}
    </div>
  )
}

function AchievementsAdmin() {
  const [list, setList] = useState([]); const [draft, setDraft] = useState(null); const [msg, setMsg] = useState('')
  const load = () => loadAchievements().then(setList)
  useEffect(() => { load() }, [])
  const flash = s => { setMsg(s); setTimeout(() => setMsg(''), 2500) }
  const blank = () => ({ key: '', title: '', how: '', points: 10, category: 'implement', icon: '⭐', sort: (Math.max(0, ...list.map(a => a.sort)) + 1), auto_metric: '', auto_threshold: 0 })
  async function save(e) {
    e.preventDefault(); const d = { ...draft, key: (draft.key || draft.title).toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24), points: Number(draft.points), sort: Number(draft.sort), auto_threshold: Number(draft.auto_threshold) || 0 }
    if (!d.key || !d.title) { flash('Needs a title'); return }
    try { await adminSaveAchievement(d); setDraft(null); load(); flash(`Saved ${d.title}`) } catch (ex) { flash(ex.message) }
  }
  async function del(a) { if (!confirm(`Delete "${a.title}"? Students who earned it lose those points.`)) return; try { await adminDeleteAchievement(a.key); load(); flash('Deleted') } catch (ex) { flash(ex.message) } }
  const cats = [['implement', 'Build / implementation'], ['revenue', 'Close & earn (milestone)']]
  return (
    <div className="card">
      <div className="row spread" style={{ marginBottom: 10 }}><div><b>Achievements</b><div className="note">What students can earn, how many points, and the order on their path. Outreach badges unlock automatically from the counter.</div></div><button className="btn sm primary" onClick={() => setDraft(blank())}>+ New achievement</button></div>
      {draft && <form onSubmit={save} className="card" style={{ marginBottom: 12, background: 'var(--glass-2)' }}>
        <div className="grid2">
          <div><label className="f">Title</label><input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="Launch your first ad" required /></div>
          <div><label className="f">Icon (emoji)</label><input value={draft.icon} onChange={e => setDraft({ ...draft, icon: e.target.value })} maxLength={4} /></div>
        </div>
        <div style={{ marginTop: 8 }}><label className="f">How to earn it</label><textarea value={draft.how} onChange={e => setDraft({ ...draft, how: e.target.value })} placeholder="What proof should they submit?" style={{ minHeight: 56 }} /></div>
        <div className="grid2" style={{ marginTop: 8 }}>
          <div><label className="f">Points</label><input type="number" value={draft.points} onChange={e => setDraft({ ...draft, points: e.target.value })} /></div>
          <div><label className="f">Order on the path</label><input type="number" value={draft.sort} onChange={e => setDraft({ ...draft, sort: e.target.value })} /></div>
          <div><label className="f">Group</label><select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}>{cats.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
          <div><label className="f">Unlock automatically</label><select value={draft.auto_metric} onChange={e => setDraft({ ...draft, auto_metric: e.target.value })}><option value="">No, needs proof</option><option value="outreach">When outreach counter reaches…</option></select></div>
          {draft.auto_metric === 'outreach' && <div><label className="f">Outreach threshold</label><input type="number" value={draft.auto_threshold} onChange={e => setDraft({ ...draft, auto_threshold: e.target.value })} /></div>}
          {!list.some(a => a.key === draft.key) && <div><label className="f">Key (short id, optional)</label><input value={draft.key} onChange={e => setDraft({ ...draft, key: e.target.value })} placeholder="auto from title" /></div>}
        </div>
        <div className="row" style={{ gap: 8, marginTop: 12 }}><button className="btn primary" type="submit">Save</button><button className="btn" type="button" onClick={() => setDraft(null)}>Cancel</button></div>
      </form>}
      <div className="list">
        {[...list].sort((a, b) => a.sort - b.sort).map(a => <div key={a.key} className="coachrow">
          <div className="medal" style={{ width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 20, background: 'var(--glass-2)', border: '1px solid var(--line-2)' }}>{a.icon || '⭐'}</div>
          <div style={{ minWidth: 0, flex: 1 }}><b>{a.sort}. {a.title}</b> <span className="pill" style={{ marginLeft: 6 }}>+{a.points}</span> <span className="note">· {a.category === 'revenue' ? 'milestone' : 'build'}{a.auto_metric ? ` · auto at ${a.auto_threshold} outreach` : ''}</span><div className="note">{a.how}</div></div>
          <div className="row" style={{ gap: 6 }}><button className="btn sm" onClick={() => setDraft({ ...a })}>Edit</button><button className="btn sm" onClick={() => del(a)}>Delete</button></div>
        </div>)}
      </div>
      {msg && <div className="toast">{msg}</div>}
    </div>
  )
}

function Modules() {
  const [mods, setMods] = useState([]); const [phases, setPhases] = useState([]); const [draft, setDraft] = useState({}); const [msg, setMsg] = useState(''); const [adding, setAdding] = useState(false)
  const [nw, setNw] = useState({ title: '', phase_id: '', kind: 'video', minutes: 10, points: 3, video_url: '' })
  const load = () => { loadModules().then(setMods); loadPhases().then(setPhases) }
  useEffect(load, [])
  const flash = s => { setMsg(s); setTimeout(() => setMsg(''), 2500) }
  async function save(m) {
    const d = draft[m.id] || {}; let quiz = m.quiz
    if (d.quiz !== undefined) { try { quiz = JSON.parse(d.quiz || '[]') } catch { flash('Quiz JSON is not valid'); return } }
    await adminUpdateModule(m.id, { video_url: toEmbed(d.video_url ?? m.video_url), minutes: Number(d.minutes ?? m.minutes), points: Number(d.points ?? m.points), phase_id: d.phase_id ?? m.phase_id, title: d.title ?? m.title, quiz, pass_pct: Number(d.pass_pct ?? m.pass_pct ?? 80) })
    setDraft(x => ({ ...x, [m.id]: {} })); load(); flash(`Saved ${m.title}`)
  }
  async function add(e) {
    e.preventDefault(); const id = 'l' + Date.now().toString(36); const sort = (Math.max(0, ...mods.map(m => m.sort)) + 1)
    const ph = phases.find(p => p.id === nw.phase_id)
    const { error } = await supabase.from('modules').insert({ id, sort, group_key: ph?.group_key || 'core', phase: ph?.title || '', title: nw.title, phase_id: nw.phase_id, kind: nw.kind, minutes: Number(nw.minutes), points: Number(nw.points), video_url: toEmbed(nw.video_url), quiz: [], published: true })
    if (error) { flash(error.message); return }
    setNw({ title: '', phase_id: '', kind: 'video', minutes: 10, points: 3, video_url: '' }); setAdding(false); load(); flash('Lesson added')
  }
  async function remove(m) { await supabase.from('modules').delete().eq('id', m.id); load(); flash('Removed') }
  const byPhase = phases.map(p => [p, mods.filter(m => m.phase_id === p.id)])
  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}><div className="row spread" style={{ flexWrap: 'wrap', gap: 8 }}><div><b>Lessons &amp; videos</b><div className="note">Paste a YouTube, Vimeo, Loom or Bunny link per lesson. Quizzes take a list of questions; see the format under any quiz.</div></div><button className="btn sm primary" onClick={() => setAdding(a => !a)}>{adding ? 'Cancel' : '+ Add lesson or quiz'}</button></div>
        {adding && <form onSubmit={add} className="grid" style={{ gridTemplateColumns: '2fr 1.3fr 1fr 80px 80px', gap: 8, marginTop: 14, alignItems: 'end' }}>
          <div><label className="f">Title</label><input type="text" value={nw.title} onChange={e => setNw({ ...nw, title: e.target.value })} required /></div>
          <div><label className="f">Phase</label><select value={nw.phase_id} onChange={e => setNw({ ...nw, phase_id: e.target.value })} required><option value="">Pick a phase</option>{phases.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
          <div><label className="f">Type</label><select value={nw.kind} onChange={e => setNw({ ...nw, kind: e.target.value })}><option value="video">Video</option><option value="quiz">Quiz</option></select></div>
          <div><label className="f">Min</label><input type="number" value={nw.minutes} onChange={e => setNw({ ...nw, minutes: e.target.value })} /></div>
          <div><label className="f">Pts</label><input type="number" value={nw.points} onChange={e => setNw({ ...nw, points: e.target.value })} /></div>
          <div style={{ gridColumn: '1 / 4' }}><label className="f">Video link (optional)</label><input type="text" value={nw.video_url} onChange={e => setNw({ ...nw, video_url: e.target.value })} placeholder="https://youtu.be/..." /></div>
          <button className="btn primary" style={{ gridColumn: '4 / 6' }}>Add</button>
        </form>}
      </div>
      {byPhase.map(([p, ls]) => <div key={p.id} className="card" style={{ marginBottom: 14 }}><div className="row" style={{ gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, display: 'inline-block' }} /><b>{p.title}</b><span className="note">· {ls.length} lessons</span></div>
        {ls.map(m => { const d = draft[m.id] || {}; const set = patch => setDraft({ ...draft, [m.id]: { ...d, ...patch } }); return (
          <div key={m.id} className="coachrow" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}><div style={{ minWidth: 0 }}>
            <div className="grid" style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr) 70px 70px', gap: 8 }}>
              <input type="text" value={d.title ?? m.title} onChange={e => set({ title: e.target.value })} />
              <select value={d.phase_id ?? m.phase_id ?? ''} onChange={e => set({ phase_id: e.target.value })}>{phases.map(x => <option key={x.id} value={x.id}>{x.title}</option>)}</select>
              <input type="number" title="Minutes" value={d.minutes ?? m.minutes} onChange={e => set({ minutes: e.target.value })} />
              <input type="number" title="Points" value={d.points ?? m.points} onChange={e => set({ points: e.target.value })} />
            </div>
            {m.kind === 'quiz'
              ? <div style={{ marginTop: 8 }}><div className="row" style={{ gap: 8 }}><span className="pill teal">Quiz</span><span className="note">Pass at</span><input type="number" style={{ width: 70, padding: '6px 8px' }} value={d.pass_pct ?? m.pass_pct ?? 80} onChange={e => set({ pass_pct: e.target.value })} /><span className="note">%</span></div>
                <textarea style={{ marginTop: 8, fontFamily: 'var(--mono)', fontSize: 12, minHeight: 110 }} value={d.quiz ?? JSON.stringify(m.quiz || [], null, 1)} onChange={e => set({ quiz: e.target.value })} />
                <div className="note">Format: [{'{'}"q":"Question?","options":["A","B","C"],"answer":0{'}'}] where answer is the index of the right option (0 = first).</div></div>
              : <input type="text" style={{ marginTop: 8 }} placeholder="Video link (YouTube, Vimeo, Loom, Bunny)" value={d.video_url ?? m.video_url ?? ''} onChange={e => set({ video_url: e.target.value })} />}
          </div>
          <div className="row" style={{ gap: 6, flexDirection: 'column' }}><button className="btn sm primary" onClick={() => save(m)}>Save</button><button className="btn sm" onClick={() => remove(m)}>Remove</button></div></div>) })}
      </div>)}
      <div className="note">{msg}</div>
    </div>
  )
}

function Automations() {
  const [res, setRes] = useState(null); const [busy, setBusy] = useState(false)
  async function run(dry) { setBusy(true); setRes(await adminRunDigest(dry)); setBusy(false) }
  return (
    <div className="card"><b>Daily automations</b>
      <div className="note" style={{ margin: '4px 0 14px' }}>Runs every day at 6 PM ET. Each piece switches on when its key is set in Netlify → Environment variables.</div>
      <div className="list" style={{ gap: 12 }}>
        <div><b style={{ fontSize: 14 }}>Discord: top 10 + today's wins</b><div className="note">Needs <code>DISCORD_WEBHOOK_URL</code> (Discord → channel settings → Integrations → Webhooks → New webhook → copy URL).</div></div>
        <div><b style={{ fontSize: 14 }}>Streak reminders by email</b><div className="note">Emails anyone with a 3+ day streak who hasn't earned points today. Needs <code>RESEND_API_KEY</code> and <code>EMAIL_FROM</code> (a sender on a domain you've verified at resend.com).</div></div>
        <div><b style={{ fontSize: 14 }}>Discord role when Phase 1 is done</b><div className="note">Needs a bot in the server with Manage Roles: <code>DISCORD_BOT_TOKEN</code>, <code>DISCORD_GUILD_ID</code>, <code>DISCORD_PHASE1_ROLE_ID</code>. Matches students by the Discord username they entered at onboarding.</div></div>
      </div>
      <div className="row" style={{ gap: 8, marginTop: 16, flexWrap: 'wrap' }}><button className="btn sm" disabled={busy} onClick={() => run(true)}>Preview (dry run)</button><button className="btn sm primary" disabled={busy} onClick={() => run(false)}>Run now</button></div>
      {res && <pre style={{ marginTop: 12, fontSize: 12, background: 'rgba(0,0,0,.3)', padding: 12, borderRadius: 10, whiteSpace: 'pre-wrap' }}>{JSON.stringify(res, null, 2)}</pre>}
    </div>
  )
}

function Announcements() {
  const [list, setList] = useState([]); const [edit, setEdit] = useState(null); const [msg, setMsg] = useState('')
  const load = () => loadAnnouncements(true).then(setList); useEffect(() => { load() }, [])
  const blank = { title: '', body: '', link_url: '', link_label: 'Join here', active: true }
  async function save(e) { e.preventDefault(); try { await adminSaveAnnouncement(edit); setEdit(null); load(); setMsg('Posted. Students see it the next time they open the portal.'); setTimeout(() => setMsg(''), 3000) } catch (ex) { setMsg(ex.message) } }
  return (<>
    <DailyTip />
    <div className="card"><div className="row spread" style={{ flexWrap: 'wrap', gap: 8 }}><div><b>Announcements</b><div className="note">The newest active one pops up in the corner for every student until they dismiss it.</div></div><button className="btn sm primary" onClick={() => setEdit(blank)}>+ New announcement</button></div>
      {edit && <form onSubmit={save} className="list" style={{ marginTop: 14 }}>
        <div><label className="f">Title</label><input type="text" value={edit.title} onChange={e => setEdit({ ...edit, title: e.target.value })} placeholder="LIVE CLASS @ 7pm ET Wednesday 10/15" required /></div>
        <div><label className="f">Message</label><textarea value={edit.body} onChange={e => setEdit({ ...edit, body: e.target.value })} placeholder="Join the Lead Gen call with Coach Adriel. Link below." /></div>
        <div className="grid g2" style={{ gap: 8 }}><div><label className="f">Link (optional)</label><input type="text" value={edit.link_url} onChange={e => setEdit({ ...edit, link_url: e.target.value })} placeholder="https://zoom.us/..." /></div><div><label className="f">Button text</label><input type="text" value={edit.link_label} onChange={e => setEdit({ ...edit, link_label: e.target.value })} /></div></div>
        <div className="row" style={{ gap: 8 }}><button className="btn primary">{edit.id ? 'Save' : 'Post announcement'}</button><button type="button" className="btn" onClick={() => setEdit(null)}>Cancel</button></div>
      </form>}
      {list.filter(a => a.kind !== 'tip').map(a => <div key={a.id} className="coachrow" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}><div><b>{a.title}</b> <span className="note">· {new Date(a.created_at).toLocaleDateString()}{a.active ? '' : ' · hidden'}</span><div className="note" style={{ whiteSpace: 'pre-wrap' }}>{a.body}</div></div>
        <div className="row" style={{ gap: 6 }}><button className="btn sm" onClick={() => setEdit(a)}>Edit</button><button className="btn sm" onClick={async () => { await adminSaveAnnouncement({ ...a, active: !a.active }); load() }}>{a.active ? 'Hide' : 'Show'}</button><button className="btn sm" onClick={async () => { await adminDeleteAnnouncement(a.id); load() }}>Delete</button></div></div>)}
      {!list.filter(a => a.kind !== 'tip').length && <div className="note" style={{ padding: '10px 0' }}>Nothing posted yet.</div>}
      <div className="note" style={{ marginTop: 8 }}>{msg}</div>
    </div>
  </>)
}

const HOURS = Array.from({ length: 24 }, (_, h) => [h, new Date(2000, 0, 1, h).toLocaleTimeString([], { hour: 'numeric' }) + ' ET'])
function DailyTip() {
  const [tips, setTips] = useState([]); const [cfg, setCfg] = useState({ enabled: true, hour_et: 9 }); const [edit, setEdit] = useState(null); const [msg, setMsg] = useState(''); const [showAll, setShowAll] = useState(false); const [busy, setBusy] = useState(false)
  const load = () => { loadTips().then(setTips); loadSettings().then(s => { if (s.auto_tip) setCfg({ enabled: true, hour_et: 9, ...s.auto_tip }) }) }
  useEffect(() => { load() }, [])
  const flash = t => { setMsg(t); setTimeout(() => setMsg(''), 3000) }
  async function saveCfg(next) { setCfg(next); try { await adminSaveSetting('auto_tip', next); flash('Saved') } catch (ex) { flash(ex.message) } }
  async function save(e) { e.preventDefault(); try { await adminSaveTip({ ...edit, sort: Number(edit.sort) }); setEdit(null); load(); flash('Saved') } catch (ex) { flash(ex.message) } }
  async function postNow() { setBusy(true); try { const r = await adminPostTipNow(); flash(r.posted ? `Posted: ${r.title}` : `Not posted: ${r.reason || r.error}`); load() } catch (ex) { flash(ex.message) } setBusy(false) }
  const queue = tips.filter(t => t.active && !t.posted_at); const next = queue[0]; const posted = tips.filter(t => t.posted_at).length
  const cats = Array.from(new Set(tips.map(t => t.category).filter(Boolean)))
  const blank = () => ({ category: cats[0] || 'Mindset', title: '', body: '', sort: (Math.max(0, ...tips.map(t => t.sort)) + 1), active: true, posted_at: null })
  const shown = showAll ? tips : queue.slice(0, 8)
  return (
    <div className="card glow-green" style={{ marginBottom: 14 }}>
      <div className="row spread" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div><b>💡 Daily tip bot</b><div className="note">Posts one tip from the bank every day as the announcement popup. {queue.length} queued · {posted} posted · loops back to the start when it runs out.</div></div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <label className="row" style={{ gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={!!cfg.enabled} onChange={e => saveCfg({ ...cfg, enabled: e.target.checked })} /> On</label>
          <select value={cfg.hour_et} onChange={e => saveCfg({ ...cfg, hour_et: Number(e.target.value) })} style={{ width: 'auto', padding: '6px 10px' }}>{HOURS.map(([h, l]) => <option key={h} value={h}>{l}</option>)}</select>
          <button className="btn sm" disabled={busy || !tips.length} onClick={postNow}>{busy ? 'Posting…' : 'Post next now'}</button>
          <button className="btn sm primary" onClick={() => setEdit(blank())}>+ Add tip</button>
        </div>
      </div>
      {next && <div className="note" style={{ marginTop: 10 }}>Next up: <b style={{ color: 'var(--fg)' }}>{next.title}</b> — {next.body}</div>}
      {edit && <form onSubmit={save} className="card" style={{ marginTop: 12, background: 'var(--glass-2)' }}>
        <div className="grid2">
          <div><label className="f">Title</label><input type="text" value={edit.title} onChange={e => setEdit({ ...edit, title: e.target.value })} placeholder="Send 20 before you check results" required /></div>
          <div className="grid2"><div><label className="f">Category</label><input type="text" list="tipcats" value={edit.category} onChange={e => setEdit({ ...edit, category: e.target.value })} /><datalist id="tipcats">{cats.map(c => <option key={c} value={c} />)}</datalist></div><div><label className="f">Order</label><input type="number" value={edit.sort} onChange={e => setEdit({ ...edit, sort: e.target.value })} /></div></div>
        </div>
        <div style={{ marginTop: 8 }}><label className="f">Tip</label><textarea value={edit.body} onChange={e => setEdit({ ...edit, body: e.target.value })} placeholder="Two or three sentences. Plain, direct, something a student can do today." style={{ minHeight: 70 }} required /></div>
        <div className="row" style={{ gap: 8, marginTop: 10 }}><button className="btn primary">Save</button><button type="button" className="btn" onClick={() => setEdit(null)}>Cancel</button>{edit.id && edit.posted_at && <button type="button" className="btn" onClick={async () => { await adminSaveTip({ id: edit.id, posted_at: null }); setEdit(null); load() }}>Put back in queue</button>}</div>
      </form>}
      <div className="list" style={{ marginTop: 12 }}>
        {shown.map(t => <div key={t.id} className="coachrow" style={{ gridTemplateColumns: '44px minmax(0,1fr) auto', padding: '10px 0' }}>
          <span className="note num" style={{ paddingTop: 2 }}>{t.sort}</span>
          <div style={{ minWidth: 0 }}><b>{t.title}</b> <span className="pill" style={{ marginLeft: 6 }}>{t.category}</span>{t.posted_at && <span className="note"> · posted {new Date(t.posted_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>}{!t.active && <span className="note"> · off</span>}<div className="note">{t.body}</div></div>
          <div className="row" style={{ gap: 6 }}><button className="btn sm" onClick={() => setEdit({ ...t })}>Edit</button><button className="btn sm" onClick={async () => { await adminSaveTip({ id: t.id, active: !t.active }); load() }}>{t.active ? 'Skip' : 'Enable'}</button><button className="btn sm" onClick={async () => { if (confirm('Delete this tip?')) { await adminDeleteTip(t.id); load() } }}>Delete</button></div>
        </div>)}
      </div>
      <div className="row" style={{ gap: 10, marginTop: 8 }}><button className="btn sm" onClick={() => setShowAll(v => !v)}>{showAll ? 'Show next 8 only' : `Show all ${tips.length} tips`}</button><span className="note">{msg}</span></div>
    </div>
  )
}

const WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
function Calls() {
  const [evs, setEvs] = useState([]); const [edit, setEdit] = useState(null); const [msg, setMsg] = useState('')
  const load = () => loadEvents().then(setEvs); useEffect(() => { load() }, [])
  const blank = { title: '', coach: '', description: '', weekday: 1, start_time: '19:00', duration_min: 60, color: '#22e36b', join_url: '', active: true, sort: evs.length + 1 }
  async function save(e) { e.preventDefault(); try { await adminSaveEvent({ ...edit, weekday: Number(edit.weekday), duration_min: Number(edit.duration_min) }); setEdit(null); load(); setMsg('Saved'); setTimeout(() => setMsg(''), 2000) } catch (ex) { setMsg(ex.message) } }
  return (
    <div className="card"><div className="row spread" style={{ flexWrap: 'wrap', gap: 8 }}><div><b>Weekly calls</b><div className="note">Times are Eastern. Students see them converted to their own timezone.</div></div><button className="btn sm primary" onClick={() => setEdit(blank)}>+ Add call</button></div>
      {edit && <form onSubmit={save} className="grid" style={{ gridTemplateColumns: 'repeat(6, minmax(0,1fr))', gap: 8, marginTop: 14, alignItems: 'end' }}>
        <div style={{ gridColumn: 'span 2' }}><label className="f">Title</label><input type="text" value={edit.title} onChange={e => setEdit({ ...edit, title: e.target.value })} required /></div>
        <div style={{ gridColumn: 'span 2' }}><label className="f">Coach</label><input type="text" value={edit.coach} onChange={e => setEdit({ ...edit, coach: e.target.value })} /></div>
        <div><label className="f">Day</label><select value={edit.weekday} onChange={e => setEdit({ ...edit, weekday: e.target.value })}>{WD.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></div>
        <div><label className="f">Start (ET)</label><input type="text" value={edit.start_time} onChange={e => setEdit({ ...edit, start_time: e.target.value })} placeholder="19:00" /></div>
        <div><label className="f">Minutes</label><input type="number" value={edit.duration_min} onChange={e => setEdit({ ...edit, duration_min: e.target.value })} /></div>
        <div><label className="f">Color</label><input type="text" value={edit.color} onChange={e => setEdit({ ...edit, color: e.target.value })} /></div>
        <div style={{ gridColumn: 'span 4' }}><label className="f">Join link (Zoom / Discord)</label><input type="text" value={edit.join_url} onChange={e => setEdit({ ...edit, join_url: e.target.value })} /></div>
        <div style={{ gridColumn: '1 / -1' }}><label className="f">What's covered</label><textarea value={edit.description} onChange={e => setEdit({ ...edit, description: e.target.value })} style={{ minHeight: 70 }} /></div>
        <div className="row" style={{ gap: 8, gridColumn: '1 / -1' }}><button className="btn primary">Save call</button><button type="button" className="btn" onClick={() => setEdit(null)}>Cancel</button></div>
      </form>}
      {evs.map(ev => <div key={ev.id} className="coachrow" style={{ gridTemplateColumns: '14px minmax(0,1fr) auto' }}><span style={{ width: 12, height: 12, borderRadius: 4, background: ev.color, marginTop: 4 }} /><div><b>{ev.title}</b> <span className="note">· {ev.coach} · {WD[ev.weekday]} {ev.start_time.slice(0, 5)} ET · {ev.duration_min} min{ev.join_url ? '' : ' · no join link yet'}</span><div className="note">{ev.description}</div></div>
        <div className="row" style={{ gap: 6 }}><button className="btn sm" onClick={() => setEdit({ ...ev, start_time: ev.start_time.slice(0, 5) })}>Edit</button><button className="btn sm" onClick={async () => { await adminDeleteEvent(ev.id); load() }}>Delete</button></div></div>)}
      <div className="note" style={{ marginTop: 8 }}>{msg}</div>
    </div>
  )
}

function RecordingsAdmin() {
  const [recs, setRecs] = useState([]); const [edit, setEdit] = useState(null); const [msg, setMsg] = useState('')
  const load = () => loadRecordings().then(setRecs); useEffect(() => { load() }, [])
  const blank = { title: '', coach: '', category: 'Q&A', held_on: new Date().toISOString().slice(0, 10), duration_min: 60, video_url: '', notes: '', color: '#22e36b' }
  async function save(e) { e.preventDefault(); try { await adminSaveRecording({ ...edit, duration_min: Number(edit.duration_min), video_url: toEmbed(edit.video_url) }); setEdit(null); load(); setMsg('Saved'); setTimeout(() => setMsg(''), 2000) } catch (ex) { setMsg(ex.message) } }
  return (
    <div className="card"><div className="row spread" style={{ flexWrap: 'wrap', gap: 8 }}><div><b>Call recordings</b><div className="note">Add each recording after the call. Category groups them on the Recordings page.</div></div><button className="btn sm primary" onClick={() => setEdit(blank)}>+ Add recording</button></div>
      {edit && <form onSubmit={save} className="grid" style={{ gridTemplateColumns: 'repeat(6, minmax(0,1fr))', gap: 8, marginTop: 14, alignItems: 'end' }}>
        <div style={{ gridColumn: 'span 2' }}><label className="f">Title</label><input type="text" value={edit.title} onChange={e => setEdit({ ...edit, title: e.target.value })} required /></div>
        <div><label className="f">Coach</label><input type="text" value={edit.coach} onChange={e => setEdit({ ...edit, coach: e.target.value })} /></div>
        <div><label className="f">Category</label><input type="text" value={edit.category} onChange={e => setEdit({ ...edit, category: e.target.value })} /></div>
        <div><label className="f">Date</label><input type="text" value={edit.held_on} onChange={e => setEdit({ ...edit, held_on: e.target.value })} placeholder="2026-10-13" /></div>
        <div><label className="f">Minutes</label><input type="number" value={edit.duration_min} onChange={e => setEdit({ ...edit, duration_min: e.target.value })} /></div>
        <div style={{ gridColumn: 'span 5' }}><label className="f">Video link</label><input type="text" value={edit.video_url} onChange={e => setEdit({ ...edit, video_url: e.target.value })} /></div>
        <div><label className="f">Color</label><input type="text" value={edit.color} onChange={e => setEdit({ ...edit, color: e.target.value })} /></div>
        <div style={{ gridColumn: '1 / -1' }}><label className="f">Notes</label><textarea value={edit.notes} onChange={e => setEdit({ ...edit, notes: e.target.value })} style={{ minHeight: 60 }} /></div>
        <div className="row" style={{ gap: 8, gridColumn: '1 / -1' }}><button className="btn primary">Save recording</button><button type="button" className="btn" onClick={() => setEdit(null)}>Cancel</button></div>
      </form>}
      {recs.map(r => <div key={r.id} className="coachrow" style={{ gridTemplateColumns: '14px minmax(0,1fr) auto' }}><span style={{ width: 12, height: 12, borderRadius: 4, background: r.color, marginTop: 4 }} /><div><b>{r.title}</b> <span className="note">· {r.category} · {r.held_on} · {r.duration_min} min{r.video_url ? '' : ' · no link yet'}</span></div>
        <div className="row" style={{ gap: 6 }}><button className="btn sm" onClick={() => setEdit(r)}>Edit</button><button className="btn sm" onClick={async () => { await adminDeleteRecording(r.id); load() }}>Delete</button></div></div>)}
      <div className="note" style={{ marginTop: 8 }}>{msg}</div>
    </div>
  )
}

// turn common share links into embeddable iframe URLs
export function toEmbed(u) {
  u = (u || '').trim(); if (!u) return ''
  let m
  if ((m = u.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([a-z0-9]+))?/i))) return `https://player.vimeo.com/video/${m[1]}${m[2] ? `?h=${m[2]}` : ''}`
  if ((m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/))) return `https://www.youtube.com/embed/${m[1]}?rel=0`
  if ((m = u.match(/loom\.com\/(?:share|embed)\/([a-f0-9]+)/i))) return `https://www.loom.com/embed/${m[1]}`
  if ((m = u.match(/iframe\.mediadelivery\.net\/(?:embed|play)\/(\d+)\/([\w-]+)/))) return `https://iframe.mediadelivery.net/embed/${m[1]}/${m[2]}`
  return u
}


function SupportInbox() {
  const { user } = useApp(); const [threads, setThreads] = useState([]); const [sel, setSel] = useState(null); const [text, setText] = useState(''); const [busy, setBusy] = useState(false)
  const [cfg, setCfg] = useState({ email: 'support@aiprofitpulse.com', auto_reply: '', hours: '' }); const [msg, setMsg] = useState('')
  const load = () => adminLoadSupportInbox().then(t => { setThreads(t); if (sel) setSel(t.find(x => x.profile_id === sel.profile_id) || null) })
  useEffect(() => { load(); loadSettings().then(s => { if (s.support) setCfg(c => ({ ...c, ...s.support })) }); const i = setInterval(load, 30000); return () => clearInterval(i) }, [])
  async function open(t) { setSel(t); if (t.unread) { await markSupportRead(t.profile_id, false); load() } }
  async function reply(e) { e.preventDefault(); if (!text.trim() || !sel) return; setBusy(true); try { await sendSupport(sel.profile_id, user.id, text.trim(), true); setText(''); await load() } catch (ex) { alert(ex.message) } setBusy(false) }
  async function saveCfg(e) { e.preventDefault(); try { await adminSaveSetting('support', cfg); setMsg('Saved'); setTimeout(() => setMsg(''), 2000) } catch (ex) { setMsg(ex.message) } }
  const unread = threads.reduce((n, t) => n + t.unread, 0)
  return (<>
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="row spread"><div><b>Support inbox</b><div className="note">Messages from the chat bubble students see. {unread ? `${unread} waiting for a reply.` : 'Nothing waiting.'}</div></div></div>
      <div className="inbox" style={{ marginTop: 12 }}>
        <div className="inbox-list">
          {threads.map(t => <div key={t.profile_id} className={`inbox-row ${sel?.profile_id === t.profile_id ? 'on' : ''}`} onClick={() => open(t)}><Avatar name={t.profile.name} url={t.profile.photo_url} size={34} /><div style={{ minWidth: 0, flex: 1 }}><b>{t.profile.name || t.profile.email}</b><small>{t.last.from_staff ? 'You: ' : ''}{t.last.body}</small></div>{t.unread > 0 && <span className="fab-badge" style={{ position: 'static' }}>{t.unread}</span>}</div>)}
          {!threads.length && <div className="note" style={{ padding: 10 }}>No messages yet.</div>}
        </div>
        <div className="inbox-thread">
          {sel ? <>
            <div className="row spread" style={{ marginBottom: 8 }}><b>{sel.profile.name}</b><a className="note" href={`mailto:${sel.profile.email}`}>{sel.profile.email}</a></div>
            <div className="support-body" style={{ maxHeight: 420, border: '1px solid var(--line)', borderRadius: 14 }}>{sel.msgs.map(m => <div key={m.id} className={`msg ${m.from_staff ? 'me' : 'staff'}`}>{!m.from_staff && <b>{sel.profile.name?.split(' ')[0]}</b>}{m.body}<small>{new Date(m.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</small></div>)}</div>
            <form className="support-form" style={{ padding: '10px 0 0' }} onSubmit={reply}><textarea value={text} onChange={e => setText(e.target.value)} placeholder="Reply as a coach…" rows={2} /><button className="btn primary sm" disabled={busy || !text.trim()}>Send</button></form>
          </> : <div className="empty"><div className="ic">💬</div><b>Pick a conversation</b><span>Replies show up in the student's chat bubble and they get a red badge.</span></div>}
        </div>
      </div>
    </div>
    <form className="card" onSubmit={saveCfg}><b>Support settings</b>
      <div className="grid2" style={{ marginTop: 10 }}>
        <div><label className="f">Support email (notified on every new message, needs RESEND_API_KEY)</label><input type="email" value={cfg.email} onChange={e => setCfg({ ...cfg, email: e.target.value })} /></div>
        <div><label className="f">Hours shown in the chat</label><input type="text" value={cfg.hours} onChange={e => setCfg({ ...cfg, hours: e.target.value })} placeholder="Mon–Fri, 9am–6pm ET" /></div>
      </div>
      <div style={{ marginTop: 8 }}><label className="f">Automatic reply (shown instantly after a student sends)</label><textarea value={cfg.auto_reply} onChange={e => setCfg({ ...cfg, auto_reply: e.target.value })} style={{ minHeight: 60 }} /></div>
      <div className="row" style={{ gap: 10, marginTop: 10 }}><button className="btn primary">Save</button><span className="note">{msg}</span></div>
    </form>
  </>)
}

function AffiliateAdmin() {
  const { settings } = useApp(); const [tools, setTools] = useState(settings.affiliate_tools || []); const [msg, setMsg] = useState('')
  const F = ['Name', 'Description', 'Category', 'Affiliate link', 'Price', 'Commission', 'Logo domain']
  const set = (i, j, v) => setTools(t => t.map((row, k) => k === i ? row.map((c, l) => l === j ? v : c) : row))
  async function save() { try { await adminSaveSetting('affiliate_tools', tools); setMsg('Saved. Students see it on refresh.'); setTimeout(() => setMsg(''), 3000) } catch (ex) { setMsg(ex.message) } }
  return (
    <div className="card"><div className="row spread" style={{ flexWrap: 'wrap', gap: 8 }}><div><b>Affiliate tools</b><div className="note">Paid tools on the Affiliate tools page. Paste your affiliate links here; the logo pulls from the domain.</div></div><div className="row" style={{ gap: 8 }}><button className="btn sm" onClick={() => setTools(t => [...t, ['', '', 'Builder', 'https://', '', '', '']])}>+ Add tool</button><button className="btn sm primary" onClick={save}>Save all</button></div></div>
      <div className="list" style={{ marginTop: 12 }}>{tools.map((row, i) => <div key={i} className="card" style={{ background: 'var(--glass-2)' }}>
        <div className="grid2">{F.map((f, j) => <div key={f} style={j === 1 ? { gridColumn: 'span 2' } : {}}><label className="f">{f}</label>{j === 1 ? <textarea value={row[j] || ''} onChange={e => set(i, j, e.target.value)} style={{ minHeight: 48 }} /> : <input type="text" value={row[j] || ''} onChange={e => set(i, j, e.target.value)} />}</div>)}</div>
        <div className="row" style={{ gap: 8, marginTop: 8 }}><button className="btn sm" onClick={() => setTools(t => t.filter((_, k) => k !== i))}>Remove</button>{i > 0 && <button className="btn sm" onClick={() => setTools(t => { const c = [...t]; [c[i - 1], c[i]] = [c[i], c[i - 1]]; return c })}>Move up</button>}</div>
      </div>)}</div>
      <div className="note" style={{ marginTop: 8 }}>{msg}</div>
    </div>
  )
}


function ResourcesAdmin() {
  const { settings } = useApp(); const [rows, setRows] = useState(settings.resources || []); const [msg, setMsg] = useState('')
  const F = ['Name', 'Description', 'Category', 'Link']
  const set = (i, j, v) => setRows(t => t.map((row, k) => k === i ? row.map((c, l) => l === j ? v : c) : row))
  async function save() { try { await adminSaveSetting('resources', rows); setMsg('Saved. Students see it on refresh.'); setTimeout(() => setMsg(''), 3000) } catch (ex) { setMsg(ex.message) } }
  return (
    <div className="card"><div className="row spread" style={{ flexWrap: 'wrap', gap: 8 }}><div><b>Resources</b><div className="note">The free tools list on the Resources page. The logo comes from the link's domain automatically.</div></div><div className="row" style={{ gap: 8 }}><button className="btn sm" onClick={() => setRows(t => [...t, ['', '', 'AI & Automation', 'https://']])}>+ Add resource</button><button className="btn sm primary" onClick={save}>Save all</button></div></div>
      <div className="list" style={{ marginTop: 12 }}>{rows.map((row, i) => <div key={i} className="card" style={{ background: 'var(--glass-2)' }}>
        <div className="grid2">{F.map((f, j) => <div key={f} style={j === 1 ? { gridColumn: 'span 2' } : {}}><label className="f">{f}</label>{j === 1 ? <textarea value={row[j] || ''} onChange={e => set(i, j, e.target.value)} style={{ minHeight: 48 }} /> : <input type="text" value={row[j] || ''} onChange={e => set(i, j, e.target.value)} />}</div>)}</div>
        <div className="row" style={{ gap: 8, marginTop: 8 }}><button className="btn sm" onClick={() => setRows(t => t.filter((_, k) => k !== i))}>Remove</button>{i > 0 && <button className="btn sm" onClick={() => setRows(t => { const c = [...t]; [c[i - 1], c[i]] = [c[i], c[i - 1]]; return c })}>Move up</button>}</div>
      </div>)}</div>
      <div className="note" style={{ marginTop: 8 }}>{msg}</div>
    </div>
  )
}

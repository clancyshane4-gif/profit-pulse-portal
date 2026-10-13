import { useEffect, useState } from 'react'
import { useApp } from '../App'
import { adminLoadMembers, adminLoadPending, adminReview, adminUpdateProfile, loadModules, adminUpdateModule, loadLeaderboard, loadPhases, loadEvents, adminSaveEvent, adminDeleteEvent, loadRecordings, adminSaveRecording, adminDeleteRecording } from '../lib/data'
import { supabase } from '../lib/supabase'
import Avatar from '../components/Avatar'

export default function Admin() {
  const [tab, setTab] = useState('members')
  return (
    <section className="page">
      <div className="head"><div><h1>Admin</h1><p>Manage members and roles, approve proof, and manage module videos. Reps add students from the Rep panel.</p></div></div>
      <div className="tabs">{[['members', 'Members'], ['review', 'Pending reviews'], ['modules', 'Lessons & videos'], ['calls', 'Call schedule'], ['recordings', 'Recordings']].map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === 'members' && <Members />}
      {tab === 'review' && <Review />}
      {tab === 'modules' && <Modules />}
      {tab === 'calls' && <Calls />}
      {tab === 'recordings' && <RecordingsAdmin />}
    </section>
  )
}

function Members() {
  const { user } = useApp(); const [list, setList] = useState([]); const [board, setBoard] = useState({})
  const load = () => { adminLoadMembers().then(setList); loadLeaderboard().then(b => { const m = {}; b.forEach(x => { m[x.id] = x.points }); setBoard(m) }) }
  useEffect(load, [])
  async function toggle(m) { await adminUpdateProfile(m.id, { active: !m.active }); load() }
  async function role(m, r) { await adminUpdateProfile(m.id, { role: r }); load() }
  return (
    <div className="card"><div className="row spread"><b>Members</b><span className="note">{list.length} total</span></div>
      {list.map(m => <div key={m.id} className="coachrow"><Avatar name={m.name} url={m.photo_url} /><div style={{ minWidth: 0 }}>
        <b>{m.name || '(no name yet)'}</b> <span className="note">· {m.email} · {m.city || 'no city'}{m.discord ? ` · @${m.discord}` : ''} · {board[m.id] ?? 0} pts · joined {new Date(m.created_at).toLocaleDateString()}</span>
        <div className="note">{m.must_change_password ? "Hasn't signed in yet" : m.onboarded ? 'Photo added' : 'Signed in, photo not added yet'}</div>
        <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {m.id !== user.id && <><button className="btn sm" onClick={() => toggle(m)}>{m.active ? 'Disable' : 'Enable'}</button>
            <select value={m.role} onChange={e => role(m, e.target.value)} style={{ width: 'auto', padding: '6px 10px' }}><option value="student">Student</option><option value="setter">Rep (setter)</option><option value="coach">Coach</option><option value="admin">Admin</option></select></>}
        </div></div>
        <span className={`pill ${m.active ? (m.onboarded ? '' : 'warn') : 'grey'}`}>{!m.active ? 'Disabled' : m.onboarded ? 'Onboarded' : 'Incomplete'}</span></div>)}
      {!list.length && <div className="note" style={{ padding: '10px 0' }}>No members yet.</div>}
    </div>
  )
}

function Review() {
  const [list, setList] = useState([])
  const load = () => adminLoadPending().then(setList)
  useEffect(() => { load() }, [])
  async function act(id, status) { await adminReview(id, status); load() }
  return (
    <div className="card"><b>Pending submissions</b><div className="list" style={{ marginTop: 10 }}>
      {list.length ? list.map(s => <div key={s.id} className="pending"><div style={{ minWidth: 0 }}><b>{s.profiles?.name}</b> · {s.achievements?.title} <span className="note">(+{s.achievements?.points})</span><div className="note" style={{ wordBreak: 'break-word' }}>{/^https?:\/\//.test(s.proof) ? <a href={s.proof} target="_blank" rel="noopener">{s.proof}</a> : s.proof}</div></div>
        <div className="row" style={{ gap: 6 }}><button className="btn sm primary" onClick={() => act(s.id, 'approved')}>Approve</button><button className="btn sm" onClick={() => act(s.id, 'rejected')}>Reject</button></div></div>)
        : <div className="note">Nothing waiting.</div>}
    </div></div>
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

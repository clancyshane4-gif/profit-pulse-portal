import { useEffect, useState } from 'react'
import { useApp } from '../App'
import { adminLoadMembers, adminLoadPending, adminReview, adminUpdateProfile, loadModules, adminUpdateModule, loadLeaderboard } from '../lib/data'
import Avatar from '../components/Avatar'

export default function Admin() {
  const [tab, setTab] = useState('members')
  return (
    <section className="page">
      <div className="head"><div><h1>Admin</h1><p>Manage members and roles, approve proof, and manage module videos. Reps add students from the Rep panel.</p></div></div>
      <div className="tabs">{[['members', 'Members'], ['review', 'Pending reviews'], ['modules', 'Modules & videos']].map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === 'members' && <Members />}
      {tab === 'review' && <Review />}
      {tab === 'modules' && <Modules />}
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
  const [mods, setMods] = useState([]); const [draft, setDraft] = useState({}); const [msg, setMsg] = useState('')
  useEffect(() => { loadModules().then(setMods) }, [])
  async function save(m) {
    const d = draft[m.id] || {}; await adminUpdateModule(m.id, { video_url: toEmbed(d.video_url ?? m.video_url), minutes: Number(d.minutes ?? m.minutes), points: Number(d.points ?? m.points) })
    setMods(await loadModules()); setMsg(`Saved ${m.title}`); setTimeout(() => setMsg(''), 2000)
  }
  return (
    <div className="card"><b>Modules &amp; videos</b><div className="note" style={{ margin: '2px 0 12px' }}>Paste a Vimeo, YouTube, Loom or Bunny link per module. Normal share links are converted to embed links on save. Leave blank to keep linking to Skool.</div>
      {mods.map(m => { const d = draft[m.id] || {}; return (
        <div key={m.id} className="coachrow" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}><div style={{ minWidth: 0 }}><b>{m.title}</b> <span className="note">· {m.phase}</span>
          <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 90px 90px', gap: 8, marginTop: 8 }}>
            <input type="text" placeholder="Video link (embed URL)" value={d.video_url ?? m.video_url ?? ''} onChange={e => setDraft({ ...draft, [m.id]: { ...d, video_url: e.target.value } })} />
            <input type="number" title="Minutes" value={d.minutes ?? m.minutes} onChange={e => setDraft({ ...draft, [m.id]: { ...d, minutes: e.target.value } })} />
            <input type="number" title="Points" value={d.points ?? m.points} onChange={e => setDraft({ ...draft, [m.id]: { ...d, points: e.target.value } })} />
          </div></div>
          <button className="btn sm primary" onClick={() => save(m)}>Save</button></div>) })}
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

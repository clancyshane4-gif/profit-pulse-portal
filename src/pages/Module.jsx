import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { loadModules, loadMyProgress, completeModule } from '../lib/data'

export default function Module() {
  const { id } = useParams(); const { user } = useApp(); const nav = useNavigate()
  const [mods, setMods] = useState([]); const [prog, setProg] = useState({}); const [busy, setBusy] = useState(false); const [toast, setToast] = useState('')
  useEffect(() => { loadModules().then(setMods); loadMyProgress(user.id).then(setProg) }, [user.id])
  const m = mods.find(x => x.id === id)
  if (!m) return <section className="page"><span className="note">Loading…</span></section>
  const idx = mods.indexOf(m); const next = mods[idx + 1]; const done = !!prog[m.id]
  async function mark() {
    setBusy(true)
    try { await completeModule(user.id, m.id, m.points); setProg({ ...prog, [m.id]: new Date().toISOString() }); setToast(`+${m.points} points`); setTimeout(() => setToast(''), 2200) }
    catch (e) { setToast('Could not save. Try again.'); setTimeout(() => setToast(''), 2500) }
    setBusy(false)
  }
  return (
    <section className="page">
      <Link className="btn sm" to="/courses" style={{ marginBottom: 14 }}>← All courses</Link>
      <div className="eyebrow">{m.phase}</div>
      <h1 style={{ fontSize: 26, margin: '6px 0 4px' }}>{m.title}</h1>
      <p className="muted" style={{ margin: '0 0 16px' }}>{m.description}</p>
      <div className="course-layout">
        <div className="card" style={{ padding: 10 }}><div className="note" style={{ padding: '6px 12px 10px', fontWeight: 700 }}>{Object.keys(prog).length} of {mods.length} done</div>
          <div className="lesson-list">{mods.map((x, i) => <Link key={x.id} to={`/courses/${x.id}`} className={`lesson ${prog[x.id] ? 'done' : ''} ${x.id === m.id ? 'on' : ''}`} style={{ textDecoration: 'none' }}><span className="n">{prog[x.id] ? '✓' : i + 1}</span><span className="t"><b>{x.title}</b><small>{x.points} pts · {x.minutes} min</small></span></Link>)}</div></div>
        <div>
          {m.video_url
            ? <div className="player"><iframe src={m.video_url} title={m.title} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen /></div>
            : <a className="player" href={m.external_url || '#'} target="_blank" rel="noopener">{m.cover_url && <img src={m.cover_url} alt="" />}<div className="play"><svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></div><span className="open">{m.external_url ? 'Watch on Skool ↗' : 'Video coming soon'}</span></a>}
          <div className="card" style={{ marginTop: 14 }}>
            <h3 style={{ fontSize: 18 }}>{m.title}</h3>
            <div className="note" style={{ margin: '4px 0 10px' }}>{m.points} points · {m.minutes} minutes</div>
            {(m.resources || []).length > 0 && <div className="list" style={{ marginBottom: 14 }}>{m.resources.map(r => <a key={r.url} className="btn sm" href={r.url} target="_blank" rel="noopener" style={{ justifyContent: 'flex-start' }}>📄 {r.title}</a>)}</div>}
            <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
              <button className="btn primary" disabled={done || busy} onClick={mark}>{done ? 'Completed' : `Mark complete (+${m.points} pts)`}</button>
              {next && <button className="btn" onClick={() => nav(`/courses/${next.id}`)}>Next: {next.title} →</button>}
            </div>
          </div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </section>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { loadModules, loadMyProgress, completeModule, loadWatch, saveWatch, isLocked } from '../lib/data'
import { attachTracker, embedUrl, kindOf } from '../lib/player'

const REQUIRED = 0.5 // fraction of the video that must play before "Mark complete" unlocks

export default function Module() {
  const { id } = useParams(); const { user, isAdmin } = useApp(); const nav = useNavigate()
  const [mods, setMods] = useState([]); const [prog, setProg] = useState({}); const [busy, setBusy] = useState(false); const [toast, setToast] = useState('')
  const [watch, setWatch] = useState({ seconds: 0, duration: 0 })
  const iframeRef = useRef(null); const watchRef = useRef(watch); const lastSave = useRef(0)
  useEffect(() => { loadModules().then(setMods); loadMyProgress(user.id).then(setProg) }, [user.id])
  useEffect(() => { loadWatch(user.id, id).then(w => { setWatch(w); watchRef.current = w }) }, [user.id, id])
  const m = mods.find(x => x.id === id)

  // play-time tracking
  useEffect(() => {
    if (!m || !m.video_url || !iframeRef.current || prog[m.id]) return
    const base = watchRef.current.seconds
    const stop = attachTracker(iframeRef.current, m.video_url, (played, duration) => {
      const w = { seconds: base + played, duration: duration || watchRef.current.duration || m.minutes * 60 }
      watchRef.current = w; setWatch(w)
      if (Date.now() - lastSave.current > 10000) { lastSave.current = Date.now(); saveWatch(user.id, m.id, w.seconds, w.duration) }
    })
    return () => { stop(); const w = watchRef.current; if (w.seconds > base) saveWatch(user.id, m.id, w.seconds, w.duration) }
  }, [m?.id, m?.video_url, !!prog[m?.id]])

  if (!m) return <section className="page"><div className="skel" style={{ height: 40, width: 200, marginBottom: 16 }} /><div className="course-layout"><div className="skel" style={{ height: 420 }} /><div className="skel" style={{ height: 420 }} /></div></section>
  const idx = mods.indexOf(m); const next = mods[idx + 1]; const done = !!prog[m.id]
  const locked = !isAdmin && isLocked(mods, prog, m)
  const core = mods.filter(x => x.group_key === 'core'); const blocker = core.find(x => !prog[x.id])
  const duration = watch.duration || m.minutes * 60
  const frac = Math.min(1, watch.seconds / Math.max(1, duration))
  const hasVideo = !!m.video_url
  const canComplete = done || isAdmin || !hasVideo || frac >= REQUIRED
  const pct = Math.round(frac * 100)

  async function mark() {
    setBusy(true)
    try { await completeModule(user.id, m.id, m.points); setProg({ ...prog, [m.id]: new Date().toISOString() }); setToast(`+${m.points} points`); setTimeout(() => setToast(''), 2200) }
    catch { setToast('Could not save. Try again.'); setTimeout(() => setToast(''), 2500) }
    setBusy(false)
  }

  if (locked) return (
    <section className="page">
      <Link className="btn sm" to="/courses" style={{ marginBottom: 14 }}>← All courses</Link>
      <div className="card" style={{ maxWidth: 560, margin: '40px auto' }}><div className="empty"><div className="ic">🔒</div><b>{m.title} is locked</b><span>Modules unlock in order. Finish <b style={{ color: 'var(--fg)' }}>{blocker?.title}</b> first.</span>{blocker && <Link className="btn primary" to={`/courses/${blocker.id}`} style={{ marginTop: 8 }}>Go to {blocker.title}</Link>}</div></div>
    </section>
  )

  return (
    <section className="page">
      <Link className="btn sm" to="/courses" style={{ marginBottom: 14 }}>← All courses</Link>
      <div className="eyebrow">{m.phase}</div>
      <h1 style={{ fontSize: 26, margin: '6px 0 4px' }}>{m.title}</h1>
      <p className="muted" style={{ margin: '0 0 16px' }}>{m.description}</p>
      <div className="course-layout">
        <div className="card" style={{ padding: 10 }}><div className="note" style={{ padding: '6px 12px 10px', fontWeight: 700 }}>{Object.keys(prog).length} of {mods.length} done</div>
          <div className="lesson-list">{mods.map((x, i) => { const lk = !isAdmin && isLocked(mods, prog, x); return (
            <Link key={x.id} to={lk ? '#' : `/courses/${x.id}`} onClick={e => lk && e.preventDefault()} className={`lesson ${prog[x.id] ? 'done' : ''} ${x.id === m.id ? 'on' : ''}`} style={{ textDecoration: 'none', opacity: lk ? .45 : 1, cursor: lk ? 'not-allowed' : 'pointer' }}>
              <span className="n">{prog[x.id] ? '✓' : lk ? '🔒' : i + 1}</span><span className="t"><b>{x.title}</b><small>{x.points} pts · {x.minutes} min</small></span></Link>) })}</div></div>
        <div>
          {hasVideo
            ? <div className="player"><iframe ref={iframeRef} key={m.id} src={embedUrl(m.video_url)} title={m.title} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen /></div>
            : <a className="player" href={m.external_url || '#'} target="_blank" rel="noopener">{m.cover_url && <img src={m.cover_url} alt="" />}<div className="play"><svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></div><span className="open">{m.external_url ? 'Watch on Skool ↗' : 'Video coming soon'}</span></a>}
          <div className="card" style={{ marginTop: 14 }}>
            <div className="row spread" style={{ flexWrap: 'wrap', gap: 8 }}><h3 style={{ fontSize: 18 }}>{m.title}</h3>{done ? <span className="pill">Completed</span> : hasVideo && <span className={`pill ${frac >= REQUIRED ? '' : 'grey'}`}>{pct}% watched</span>}</div>
            <div className="note" style={{ margin: '4px 0 10px' }}>{m.points} points · {m.minutes} minutes</div>
            {hasVideo && !done && <div style={{ margin: '0 0 14px' }}><div className="bar thin"><i style={{ width: pct + '%' }} /></div><div className="note" style={{ marginTop: 6 }}>{frac >= REQUIRED ? 'You can mark this complete.' : `Watch at least half (${Math.ceil(duration * REQUIRED / 60)} min) to unlock Mark complete. Skipping ahead doesn't count.`}</div></div>}
            {(m.resources || []).length > 0 && <div className="list" style={{ marginBottom: 14 }}>{m.resources.map(r => <a key={r.url} className="btn sm" href={r.url} target="_blank" rel="noopener" style={{ justifyContent: 'flex-start' }}>📄 {r.title}</a>)}</div>}
            <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
              <button className="btn primary" disabled={done || busy || !canComplete} onClick={mark}>{done ? 'Completed' : `Mark complete (+${m.points} pts)`}</button>
              {next && (done || isAdmin || next.group_key !== 'core') && <button className="btn" onClick={() => nav(`/courses/${next.id}`)}>Next: {next.title} →</button>}
            </div>
          </div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </section>
  )
}

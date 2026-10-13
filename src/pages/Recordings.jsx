import { useEffect, useState } from 'react'
import { useApp } from '../App'
import { loadRecordings, loadMyWatches, setWatched } from '../lib/data'

export default function Recordings() {
  const { user } = useApp()
  const [recs, setRecs] = useState(null); const [watched, setW] = useState(new Set()); const [cat, setCat] = useState('All'); const [open, setOpen] = useState(null)
  useEffect(() => { loadRecordings().then(setRecs); loadMyWatches(user.id).then(setW) }, [user.id])
  if (!recs) return <section className="page"><div className="skel" style={{ height: 60, marginBottom: 16 }} /><div className="grid g2">{[0, 1, 2, 3].map(i => <div key={i} className="skel" style={{ height: 110 }} />)}</div></section>
  const cats = ['All', ...Array.from(new Set(recs.map(r => r.category)))]
  const list = recs.filter(r => cat === 'All' || r.category === cat)
  const groups = Array.from(new Set(list.map(r => r.category))).map(c => [c, list.filter(r => r.category === c)])
  async function toggle(r) { const on = !watched.has(r.id); const n = new Set(watched); on ? n.add(r.id) : n.delete(r.id); setW(n); await setWatched(user.id, r.id, on) }
  const fmt = d => new Date(d + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
  return (
    <section className="page">
      <div className="head"><div><h1>Recordings</h1><p>Every live call, recorded. {watched.size} of {recs.length} watched.</p></div></div>
      <div className="tabs">{cats.map(c => <button key={c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>{c}</button>)}</div>
      {open && <div className="card" style={{ marginBottom: 18 }}><div className="row spread" style={{ flexWrap: 'wrap', gap: 8, marginBottom: 10 }}><b>{open.title} · {fmt(open.held_on)}</b><button className="btn sm" onClick={() => setOpen(null)}>Close</button></div>
        {open.video_url ? <div className="player"><iframe src={open.video_url} title={open.title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen /></div> : <div className="note">No video link on this recording yet.</div>}
        {open.notes && <p className="muted" style={{ fontSize: 13.5, marginTop: 12 }}>{open.notes}</p>}</div>}
      {groups.map(([c, rs]) => <div key={c}>
        <div className="phase-head"><h2 style={{ fontSize: 18 }}>{c}</h2><span>{rs[0]?.coach}</span></div>
        <div className="grid g2">{rs.map(r => <div key={r.id} className="rec" style={{ '--c': r.color || 'var(--green)' }}>
          <button className="rec-play" onClick={() => setOpen(r)} aria-label="Play">▶</button>
          <div style={{ minWidth: 0, flex: 1 }}><b>{r.title}</b><div className="note">{fmt(r.held_on)} · {r.duration_min} min{r.coach ? ` · ${r.coach}` : ''}</div>
            <div className="row" style={{ gap: 12, marginTop: 6 }}>{r.video_url ? <a href="#" onClick={e => { e.preventDefault(); setOpen(r) }} style={{ fontSize: 13, fontWeight: 600 }}>Watch →</a> : <span className="note">Link coming</span>}</div></div>
          <label className="chk"><input type="checkbox" checked={watched.has(r.id)} onChange={() => toggle(r)} /> <span>Mark as watched</span></label>
        </div>)}</div>
      </div>)}
      {!recs.length && <div className="card"><div className="empty"><div className="ic">🎥</div><b>No recordings yet</b><span>Call recordings show up here after each live session.</span></div></div>}
    </section>
  )
}

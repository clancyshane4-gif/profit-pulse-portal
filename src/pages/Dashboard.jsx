import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../App'
import { loadModules, loadMyProgress, loadMyActivity, loadLeaderboard, loadMySubmissions, loadAchievements, tierOf } from '../lib/data'
import WinsFeed from '../components/WinsFeed'

function useCountUp(target, ms = 900) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(target); return }
    let raf; const t0 = performance.now()
    const tick = t => { const p = Math.min(1, (t - t0) / ms); setV(Math.round(target * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf)
  }, [target])
  return v
}

export default function Dashboard() {
  const { user, profile, settings } = useApp()
  const [d, setD] = useState(null)
  useEffect(() => {
    Promise.all([loadModules(), loadMyProgress(user.id), loadMyActivity(user.id), loadLeaderboard(), loadMySubmissions(user.id), loadAchievements()])
      .then(([modules, progress, activity, board, subs, ach]) => setD({ modules, progress, activity, board, subs, ach }))
  }, [user.id])
  const me = d?.board.find(b => b.id === user.id) || { points: 0, course_points: 0, implementation_points: 0, revenue_points: 0, activity_points: 0 }
  const shown = useCountUp(me.points)
  if (!d) return <section className="page"><div className="skel" style={{ height: 220, marginBottom: 18 }} /><div className="bento"><div className="skel span4" style={{ height: 240 }} /><div className="skel span8" style={{ height: 240 }} /></div></section>

  const tiers = settings.tiers || []
  const rank = d.board.findIndex(b => b.id === user.id)
  const { t, next, base } = tierOf(me.points, tiers)
  const done = Object.keys(d.progress).length, total = d.modules.length, pct = total ? Math.round(done / total * 100) : 0
  const ch = settings.challenge || {}; const end = ch.ends_at ? new Date(ch.ends_at) : null
  const days = end ? Math.max(0, Math.ceil((end - Date.now()) / 864e5)) : null
  const first = (profile.name || '').split(' ')[0] || 'there'
  const nextMod = d.modules.find(m => !d.progress[m.id])
  let streak = 0; { const dd = new Date(); let k = dd.toISOString().slice(0, 10); if (!d.activity[k]) dd.setDate(dd.getDate() - 1); for (let i = 0; i < 400; i++) { k = dd.toISOString().slice(0, 10); if (!d.activity[k]) break; streak++; dd.setDate(dd.getDate() - 1) } }
  const heat = []; { const dd = new Date(); dd.setDate(dd.getDate() - 69); for (let i = 0; i < 70; i++) { const k = dd.toISOString().slice(0, 10); heat.push([k, d.activity[k] || 0]); dd.setDate(dd.getDate() + 1) } }
  const recent = []
  for (const id in d.progress) { const m = d.modules.find(x => x.id === id); if (m) recent.push([d.progress[id], `Completed ${m.title}`, `+${m.points}`, false]) }
  for (const k in d.subs) { const s = d.subs[k]; const a = d.ach.find(x => x.key === k); if (a) recent.push([s.created_at, `${s.status === 'approved' ? 'Approved' : s.status === 'rejected' ? 'Not approved' : 'Submitted'}: ${a.title}`, s.status === 'approved' ? `+${a.points}` : s.status, s.status === 'pending']) }
  recent.sort((a, b) => String(b[0]).localeCompare(String(a[0])))
  const approved = Object.values(d.subs).filter(s => s.status === 'approved').length
  const segs = [['Courses', me.course_points, 'var(--green)'], ['Implementation', me.implementation_points, 'var(--teal)'], ['Revenue', me.revenue_points, 'var(--gold)'], ['Activity', me.activity_points, 'var(--violet)']]
  const tot = Math.max(1, segs.reduce((s, x) => s + x[1], 0))

  return (
    <section className="page">
      <div className="dash-hero">
        <div>
          <div className="eyebrow">{days != null ? `${ch.eyebrow} · ${days} days left` : 'Your progress'}</div>
          <h1 style={{ fontSize: 30, margin: '6px 0 14px' }}>Welcome back, {first}.</h1>
          <div className="big pts num">{shown}<small>points</small></div>
          <div className="sub">{rank >= 0 ? `Ranked #${rank + 1} of ${d.board.length}` : 'Not ranked yet'} · {t}</div>
          <div className="tier-track">
            <div className="row spread"><span>{next ? `${next[1] - me.points} points to ${next[0]}` : 'Top tier reached'}</span><span className="num">{me.points}{next ? ` / ${next[1]}` : ''}</span></div>
            <div className="bar"><i style={{ width: next ? Math.min(100, Math.round((me.points - base) / (next[1] - base) * 100)) + '%' : '100%' }} /></div>
          </div>
        </div>
        <div className="hero-side">
          <div className="stat-chip"><div className="ic">🔥</div><div><b className="num">{streak}</b><small>day streak</small></div></div>
          <div className="stat-chip"><div className="ic">🏅</div><div><b className="num">{approved}</b><small>achievements earned</small></div></div>
          <div className="stat-chip"><div className="ic">▶</div><div><b className="num">{done} / {total}</b><small>modules complete</small></div></div>
        </div>
      </div>

      <div className="bento">
        <WinsFeed />
        <div className="card span5">
          <div className="row spread"><b>Course progress</b><span className="pill">{pct}%</span></div>
          <div className="row" style={{ marginTop: 16, gap: 18 }}>
            <svg className="ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="9" /><circle cx="50" cy="50" r="42" fill="none" stroke="#22e36b" strokeWidth="9" strokeLinecap="round" strokeDasharray="264" strokeDashoffset={264 - 264 * pct / 100} transform="rotate(-90 50 50)" style={{ filter: 'drop-shadow(0 0 6px rgba(34,227,107,.6))', transition: 'stroke-dashoffset .8s ease' }} /><text x="50" y="56" textAnchor="middle" fill="#eef1f8" fontSize="20" fontWeight="800" fontFamily="Bricolage Grotesque, sans-serif">{done}</text></svg>
            <div style={{ minWidth: 0 }}>{nextMod ? <><div className="note">Up next</div><b style={{ display: 'block', fontSize: 15, margin: '2px 0 10px' }}>{nextMod.title}</b><Link className="btn primary sm" to={`/courses/${nextMod.phase_id || ''}?l=${nextMod.id}`}>Continue</Link></> : <><b>All lessons complete.</b><div className="note" style={{ marginBottom: 10 }}>Your certificate is ready.</div><Link className="btn primary sm" to="/certificate">🎓 Get certificate</Link></>}</div>
          </div>
        </div>
        <div className="card span7">
          <div className="row spread"><b>Where your points come from</b><span className="note num">{me.points} total</span></div>
          <div className="seg" style={{ marginTop: 14 }}>{segs.map(([n, v, c]) => v > 0 && <i key={n} style={{ width: v / tot * 100 + '%', background: c }} title={`${n}: ${v}`} />)}</div>
          <div className="legend">{segs.map(([n, v, c]) => <div key={n}><span><i className="dot" style={{ background: c }} />{n}</span><b className="num">{v}</b></div>)}</div>
        </div>
        <div className="card span7">
          <div className="row spread" style={{ marginBottom: 14 }}><b>Activity</b><span className="note">last 70 days</span></div>
          <div className="heat">{heat.map(([k, v]) => <i key={k} title={`${k}: ${v} pts`} className={v >= 8 ? 'l3' : v >= 4 ? 'l2' : v > 0 ? 'l1' : ''} />)}</div>
        </div>
        <div className="card span5">
          <b>Recent</b>
          {recent.length ? <div className="timeline" style={{ marginTop: 10 }}>{recent.slice(0, 6).map(([at, txt, p, pend], i) => <div key={i} className={`t ${pend ? 'p' : ''}`}><span style={{ minWidth: 0 }}>{txt}</span><span className={p.startsWith('+') ? 'num' : 'note'} style={{ color: p.startsWith('+') ? 'var(--green)' : undefined, whiteSpace: 'nowrap' }}>{p}</span></div>)}</div>
            : <div className="empty"><div className="ic">▶</div><b>Nothing yet</b><span>Finish your first module and it shows up here.</span><Link className="btn sm" to="/courses">Open courses</Link></div>}
        </div>
      </div>
    </section>
  )
}

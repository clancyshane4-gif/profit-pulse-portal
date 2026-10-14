import { useEffect, useState } from 'react'
import { useApp } from '../App'
import { loadAchievements } from '../lib/data'

export default function Challenge() {
  const { settings } = useApp(); const ch = settings.challenge || {}
  const [now, setNow] = useState(Date.now()); const [ach, setAch] = useState([])
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); loadAchievements().then(setAch); return () => clearInterval(t) }, [])
  const ms = Math.max(0, (ch.ends_at ? new Date(ch.ends_at) : new Date()) - now)
  const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), mi = Math.floor(ms % 36e5 / 6e4), s = Math.floor(ms % 6e4 / 1e3)
  const pad = n => String(n).padStart(2, '0')
  const learn = [['Module, 1–3 min', 1], ['Module, 4–7 min', 2], ['Module, 8–14 min', 3], ['Module, 15–24 min', 5], ['Module, 25–39 min', 8], ['Module, 40+ min', 12], ['Any day you earn points', 3]]
  const maxA = Math.max(...ach.map(a => a.points), 1)
  const icons = ['🏖', '🍽', '🤝']
  return (
    <section className="page">
      <div className="hero">
        <div className="eyebrow"><span className="challenge-tag">🏆 {ch.eyebrow || 'Challenge'} · {Math.ceil(ms / 864e5)} days left</span></div>
        <h2 style={{ marginTop: 10 }}>{ch.title}</h2>
        <p>{ch.description}</p>
        <div className="count">{[[d, 'days'], [pad(h), 'hours'], [pad(mi), 'minutes'], [pad(s), 'seconds']].map(([v, l]) => <div key={l}><b>{v}</b><small>{l}</small></div>)}</div>
        <div className="note" style={{ marginTop: 22 }}>{ch.ends_label}</div>
      </div>
      <div className="phase-head"><h2>The prize</h2><span>for the top 10</span></div>
      <div className="prizes">{(ch.prizes || []).map(([t, b], i) => <div key={t} className="prize"><div className="ic">{icons[i] || '🎁'}</div><b>{t}</b><p>{b}</p></div>)}</div>
      <div className="phase-head"><h2>How points work</h2><span>learn, build, reach out, land clients, show up</span></div>
      <div className="grid g2 ways">
        <div className="card"><b>Learn</b><p className="note" style={{ margin: '4px 0 10px' }}>Points scale with video length.</p>
          <table><tbody>{learn.map(([a, b]) => <tr key={a}><td><span className="mini"><i style={{ width: b / 12 * 100 + '%' }} /></span>{a}</td><td>+{b}</td></tr>)}</tbody></table></div>
        <div className="card glow-green"><b>Implement and earn</b><p className="note" style={{ margin: '4px 0 10px' }}>Submit proof on the Achievements page.</p>
          <table><tbody>{ach.map(a => <tr key={a.key}><td><span className="mini"><i style={{ width: Math.max(6, a.points / maxA * 100) + '%' }} /></span>{a.title}</td><td>+{a.points}</td></tr>)}</tbody></table></div>
      </div>
    </section>
  )
}

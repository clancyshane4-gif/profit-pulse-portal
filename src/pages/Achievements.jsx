import { useEffect, useState } from 'react'
import { useApp } from '../App'
import { loadAchievements, loadMySubmissions, submitProof } from '../lib/data'

const ICON = { niche: '🎯', offer: '📝', dashboard: '📊', website: '🌐', agent: '🤖', adaccount: '📣', proposal: '📑', out50: '✉️', out100: '📨', out200: '📬', call: '📞', client: '🤝', firstdollar: '💵', k1: '💰', k5: '💎', k10: '🏆' }

export default function Achievements() {
  const { user } = useApp()
  const [ach, setAch] = useState(null); const [subs, setSubs] = useState({}); const [proof, setProof] = useState({}); const [toast, setToast] = useState('')
  useEffect(() => { loadAchievements().then(setAch); loadMySubmissions(user.id).then(setSubs) }, [user.id])
  if (!ach) return <section className="page"><div className="badges">{[0, 1, 2, 3].map(i => <div key={i} className="skel" style={{ height: 150 }} />)}</div></section>
  const earned = Object.values(subs).filter(s => s.status === 'approved').length
  const pts = ach.filter(a => subs[a.key]?.status === 'approved').reduce((s, a) => s + a.points, 0)
  async function send(k) {
    const v = (proof[k] || '').trim(); if (!v) { flash('Add a link or description first'); return }
    try { await submitProof(user.id, k, v); setSubs(await loadMySubmissions(user.id)); flash('Submitted for review') } catch { flash('Could not submit. Try again.') }
  }
  function flash(t) { setToast(t); setTimeout(() => setToast(''), 2200) }
  const Badge = ({ a }) => { const s = subs[a.key]; const st = s?.status || 'locked'; return (
    <div className={`badge ${st} ${a.category === 'revenue' ? 'milestone' : ''}`}>
      <div className="medal">{ICON[a.key] || '⭐'}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <b>{a.title}</b><div><small>{a.how}</small></div>
        {st === 'approved' && <div className="pill" style={{ marginTop: 8 }}>Earned</div>}
        {st === 'pending' && <div className="pill warn" style={{ marginTop: 8 }}>Waiting for review</div>}
        {st === 'rejected' && <div className="pill grey" style={{ marginTop: 8 }}>Not approved. Resubmit below.</div>}
        {(st === 'locked' || st === 'rejected') && <div className="proof"><input type="text" id={`proof_${a.key}`} value={proof[a.key] || ''} onChange={e => setProof({ ...proof, [a.key]: e.target.value })} placeholder="Link or short proof" /><button className="btn sm" onClick={() => send(a.key)}>Submit</button></div>}
      </div>
      <span className="pt">+{a.points}</span>
    </div>) }
  return (
    <section className="page">
      <div className="head"><div><h1>Achievements</h1><p>Do the work, submit proof, a coach approves it, the points land on your total.</p></div><div className="row" style={{ gap: 8 }}><span className="pill">{earned} earned</span><span className="pill teal">{pts} pts</span></div></div>
      <div className="phase-head"><h2>Build</h2><span>implementation</span></div>
      <div className="badges">{ach.filter(a => a.category === 'implement').map(a => <Badge key={a.key} a={a} />)}</div>
      <div className="phase-head"><h2>Milestones</h2><span>revenue</span></div>
      <div className="badges">{ach.filter(a => a.category === 'revenue').map(a => <Badge key={a.key} a={a} />)}</div>
      {toast && <div className="toast">{toast}</div>}
    </section>
  )
}

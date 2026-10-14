import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../App'
import { loadUnseenApprovals, markSubmissionSeen, loadAchievements } from '../lib/data'

// Corner card that fires when a coach approves one of your submissions since you last looked.
export default function ApprovalPop() {
  const { user } = useApp()
  const [list, setList] = useState([])
  useEffect(() => { if (!user?.id) return; Promise.all([loadUnseenApprovals(user.id), loadAchievements()]).then(([u, ach]) => setList(u.map(s => ({ ...s, achievements: ach.find(a => a.key === s.achievement_key) || {} })))) }, [user?.id])
  const s = list[0]
  if (!s) return null
  async function close() { setList(l => l.slice(1)); try { await markSubmissionSeen(s.id) } catch {} }
  const a = s.achievements || {}
  return (
    <div className="ann approve" role="status">
      <button className="ann-x" onClick={close} aria-label="Dismiss">✕</button>
      <div className="ann-eyebrow" style={{ color: 'var(--green)' }}>🎉 Achievement approved{list.length > 1 ? ` · ${list.length} new` : ''}</div>
      <div className="row" style={{ gap: 12, alignItems: 'center' }}>
        <div className="medal pop">{a.icon || '⭐'}</div>
        <div style={{ minWidth: 0 }}><b className="ann-title" style={{ marginBottom: 2 }}>{a.title}</b><p className="ann-body open">+{a.points} points landed on your total.{s.reviewer_note ? ` Coach: “${s.reviewer_note}”` : ''}</p></div>
      </div>
      <div className="row" style={{ gap: 10, marginTop: 10 }}><Link className="btn sm primary" to="/achievements" onClick={close}>See your path</Link><Link className="btn sm" to="/leaderboard" onClick={close}>Leaderboard</Link></div>
    </div>
  )
}

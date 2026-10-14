import { useEffect, useState } from 'react'
import { loadWins } from '../lib/data'
import Avatar from './Avatar'

const VERB = { niche: 'picked a niche', offer: 'wrote their offer', dashboard: 'built their client dashboard', website: 'launched an AI website', agent: 'set up a super agent', adaccount: 'set up an ad account', proposal: 'built a client proposal', out50: 'did 50 outreaches', out100: 'did 100 outreaches', out200: 'did 200+ outreaches', call: 'booked a sales call', client: 'signed their first client', firstdollar: 'earned their first dollar', k1: 'hit $1,000 earned', k5: 'hit $5,000 earned', k10: 'hit $10,000 earned' }
const ago = iso => { const s = (Date.now() - new Date(iso)) / 1000; if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`; if (s < 86400) return `${Math.round(s / 3600)}h ago`; return `${Math.round(s / 86400)}d ago` }

// take newest wins but rotate through people, so the row shows the whole bootcamp
function spread(ws, n) { const by = new Map(); ws.forEach(w => { const k = w.profile_id || w.name; if (!by.has(k)) by.set(k, []); by.get(k).push(w) }); const q = [...by.values()]; const out = []; while (out.length < n && q.some(a => a.length)) { for (const a of q) { if (a.length && out.length < n) out.push(a.shift()) } } return out }

export default function WinsFeed() {
  const [wins, setWins] = useState(null)
  useEffect(() => { loadWins(40).then(ws => setWins(spread(ws, 12))) }, [])
  return (
    <div className="card span12 wins">
      <div className="row spread" style={{ marginBottom: 12 }}><b>Wins</b><span className="note">approved results from the whole bootcamp</span></div>
      {!wins ? <div className="skel" style={{ height: 60 }} /> : wins.length ? <div className="wins-row">{wins.map(w => <div key={w.id} className={`win ${w.category === 'revenue' ? 'big' : ''}`}>
        <Avatar name={w.name} url={w.photo_url} size={36} />
        <div style={{ minWidth: 0 }}><b>{(w.name || '').split(' ')[0]}</b> <span>{VERB[w.achievement_key] || w.title.toLowerCase()}</span><div className="note">{ago(w.won_at)} · <span style={{ color: 'var(--green)' }}>+{w.points}</span></div></div>
      </div>)}</div>
        : <div className="empty" style={{ padding: 18 }}><div className="ic">🔥</div><b>No wins yet</b><span>The first approved result shows up here for everyone to see.</span></div>}
    </div>
  )
}

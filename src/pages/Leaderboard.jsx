import { useEffect, useState } from 'react'
import { useApp } from '../App'
import { loadLeaderboard, loadLeaderboardSince, loadStreaks, loadBreakdown, tierOf } from '../lib/data'
import Avatar from '../components/Avatar'

function quarterStart() { const d = new Date(); const q = Math.floor(d.getMonth() / 3) * 3; return new Date(d.getFullYear(), q, 1) }

export default function Leaderboard() {
  const { user, settings } = useApp()
  const [tab, setTab] = useState('challenge'); const [board, setBoard] = useState(null); const [streaks, setStreaks] = useState({})
  const [open, setOpen] = useState(null); const [items, setItems] = useState(null)
  const ch = settings.challenge || {}
  useEffect(() => { setBoard(null); (tab === 'challenge' ? loadLeaderboardSince(quarterStart().toISOString()) : loadLeaderboard()).then(setBoard); loadStreaks().then(setStreaks) }, [tab])
  useEffect(() => { if (!open) { setItems(null); return } loadBreakdown(open.id).then(setItems) }, [open?.id])
  const tiers = settings.tiers || []
  const mine = board?.find(b => b.id === user.id)?.points ?? 0
  const maxT = tiers.length ? tiers[tiers.length - 1][1] : 1
  if (!board) return <section className="page"><div className="skel" style={{ height: 120, marginBottom: 16 }} /><div className="podium">{[0, 1, 2].map(i => <div key={i} className="skel" style={{ height: 240 }} />)}</div></section>
  const top = board.slice(0, 3); const order = [top[1], top[0], top[2]]; const max = board[0]?.points || 1
  const fmtK = v => v >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'K' : v
  return (
    <section className="page" onClick={() => setOpen(null)}>
      <div className="head"><div><h1>Leaderboard</h1><p>Click anyone to see where their points came from.</p></div></div>
      <div className="tabs" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 12 }}><button className={tab === 'challenge' ? 'on' : ''} onClick={() => setTab('challenge')}>{ch.eyebrow || 'This quarter'}</button><button className={tab === 'all' ? 'on' : ''} onClick={() => setTab('all')}>All time</button></div>
      <div className="card glow-green" style={{ marginBottom: 22 }}><div className="note" style={{ marginBottom: 14 }}>Tier milestones</div>
        <div className="orbs"><div className="orb-line" /><div className="orb-fill" style={{ width: Math.min(100, mine / maxT * 100) + '%' }} />
          {tiers.map(([n, v, c], i) => { const size = 10 + i * 6; const reached = mine >= v; return <div key={n} className="orb-item"><i style={{ width: size, height: size, background: c, boxShadow: reached ? `0 0 ${8 + i * 4}px ${c}` : 'none', opacity: reached ? 1 : .35 }} /><b style={{ color: reached ? c : 'var(--muted)' }}>{n}</b><small>{fmtK(v)}{i === tiers.length - 1 ? '+' : ''}</small></div> })}
        </div></div>
      {board.length ? <>
        <div className="podium">{order.map((m, i) => { if (!m) return <div key={i} />; const pos = i === 1 ? 1 : i === 0 ? 2 : 3; return (
          <div key={m.id} className={`pod ${['first', 'second', 'third'][pos - 1]}`} onClick={e => { e.stopPropagation(); setOpen(m) }} style={{ cursor: 'pointer' }}><span className="medal">#{pos}</span><Avatar name={m.name} url={m.photo_url} /><b style={{ display: 'block', fontSize: 15 }}>{m.name}</b><span className={`pill ${pos === 1 ? 'gold' : 'grey'}`} style={{ margin: '8px 0' }}>{tierOf(m.points, tiers).t}</span><div className="pts num">{m.points}</div><div className="note">🔥 {streaks[m.id] || 0} day streak</div></div>) })}</div>
        <div className="ranks">{board.map((m, i) => { const t = tierOf(m.points, tiers); const tc = tiers.find(x => x[0] === t.t)?.[2]; return (
          <div key={m.id} className={`rank ${m.id === user.id ? 'me' : ''}`} style={{ cursor: 'pointer', position: 'relative' }} onClick={e => { e.stopPropagation(); setOpen(open?.id === m.id ? null : m) }}>
            <span className={`pos ${i === 0 ? 'g' : i === 1 ? 's' : i === 2 ? 'b' : ''}`}>{i < 3 ? ['1st', '2nd', '3rd'][i] : '#' + (i + 1)}</span><Avatar name={m.name} url={m.photo_url} />
            <div className="who" style={{ minWidth: 0 }}><b>{m.name}{m.id === user.id ? ' (you)' : ''}{streaks[m.id] > 0 && <span className="note" style={{ marginLeft: 8, color: 'var(--warn)' }}>🔥{streaks[m.id]}d</span>}</b>
              <div className="row" style={{ gap: 10 }}><span className="pill" style={{ fontSize: 10, color: tc, borderColor: tc ? tc + '55' : undefined, background: tc ? tc + '18' : undefined }}>{t.t}</span><div className="bar thin" style={{ flex: 1, maxWidth: 300 }}><i style={{ width: Math.round(m.points / max * 100) + '%', background: tc, boxShadow: `0 0 10px ${tc}` }} /></div></div></div>
            <span className="pts num" style={{ color: tc }}>{m.points}<small style={{ display: 'block', fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>pts</small></span>
            {open?.id === m.id && <Popover m={m} items={items} />}
          </div>) })}</div>
      </> : <div className="card"><div className="empty"><div className="ic">🏆</div><b>No one on the board yet</b><span>The first student to finish a lesson takes the top spot.</span></div></div>}
    </section>
  )
}

function Popover({ m, items }) {
  return <div className="lb-pop" onClick={e => e.stopPropagation()}>
    <div className="row spread" style={{ marginBottom: 8 }}><div className="row" style={{ gap: 8 }}><Avatar name={m.name} url={m.photo_url} size={28} /><div><b style={{ display: 'block', fontSize: 14 }}>{m.name}</b>{m.city && <small className="note">{m.city}</small>}</div></div><span className="note num">{m.points} pts</span></div>
    {!items ? <div className="skel" style={{ height: 80 }} /> : items.length ? <>
      {items.slice(0, 6).map((it, i) => <div key={i} className="row spread" style={{ padding: '7px 0', borderTop: '1px solid var(--line)', fontSize: 13 }}><div style={{ minWidth: 0 }}><div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.t}</div><small className="note">{it.k}</small></div><b style={{ color: 'var(--green)', fontFamily: 'var(--display)' }}>+{it.p}</b></div>)}
      {items.length > 6 && <div className="note" style={{ textAlign: 'center', paddingTop: 8 }}>+{items.length - 6} more</div>}
    </> : <div className="note">No points yet.</div>}
  </div>
}

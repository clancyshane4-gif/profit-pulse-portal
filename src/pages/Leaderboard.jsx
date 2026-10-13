import { useEffect, useState } from 'react'
import { useApp } from '../App'
import { loadLeaderboard, loadStreaks, tierOf } from '../lib/data'
import Avatar from '../components/Avatar'

export default function Leaderboard() {
  const { user, settings } = useApp()
  const [board, setBoard] = useState(null); const [streaks, setStreaks] = useState({})
  useEffect(() => { loadLeaderboard().then(setBoard); loadStreaks().then(setStreaks) }, [])
  if (!board) return <section className="page"><div className="podium">{[0, 1, 2].map(i => <div key={i} className="skel" style={{ height: 240 }} />)}</div></section>
  const tiers = settings.tiers || []
  const mine = board.find(b => b.id === user.id)?.points ?? 0
  const top = board.slice(0, 3); const order = [top[1], top[0], top[2]]; const max = board[0]?.points || 1
  return (
    <section className="page">
      <div className="head"><div><h1>Leaderboard</h1><p>Points reset each quarter. The top 10 when it ends win the challenge.</p></div></div>
      <div className="tierstrip">{tiers.map(([n, v]) => <div key={n} className={tierOf(mine, tiers).t === n ? 'me' : ''}><b>{n}</b><small>{v}+</small></div>)}</div>
      {board.length ? <>
        <div className="podium">{order.map((m, i) => {
          if (!m) return <div key={i} />
          const pos = i === 1 ? 1 : i === 0 ? 2 : 3
          return <div key={m.id} className={`pod ${['first', 'second', 'third'][pos - 1]}`}><span className="medal">#{pos}</span><Avatar name={m.name} url={m.photo_url} /><b style={{ display: 'block', fontSize: 15 }}>{m.name}</b><span className={`pill ${pos === 1 ? 'gold' : 'grey'}`} style={{ margin: '8px 0' }}>{tierOf(m.points, tiers).t}</span><div className="pts num">{m.points}</div><div className="note">🔥 {streaks[m.id] || 0} day streak</div></div>
        })}</div>
        <div className="ranks">{board.map((m, i) => <div key={m.id} className={`rank ${m.id === user.id ? 'me' : ''}`}><span className={`pos ${i === 0 ? 'g' : i === 1 ? 's' : i === 2 ? 'b' : ''}`}>{i < 3 ? ['1st', '2nd', '3rd'][i] : '#' + (i + 1)}</span><Avatar name={m.name} url={m.photo_url} /><div className="who" style={{ minWidth: 0 }}><b>{m.name}{m.id === user.id ? ' (you)' : ''}</b><div className="row" style={{ gap: 10 }}><span className="pill" style={{ fontSize: 10 }}>{tierOf(m.points, tiers).t}</span><div className="bar thin" style={{ flex: 1, maxWidth: 280 }}><i style={{ width: Math.round(m.points / max * 100) + '%' }} /></div><span className="note">🔥 {streaks[m.id] || 0}</span></div></div><span className="pts num">{m.points}</span></div>)}</div>
      </> : <div className="card"><div className="empty"><div className="ic">🏆</div><b>No one on the board yet</b><span>The first student to finish a module takes the top spot.</span></div></div>}
    </section>
  )
}

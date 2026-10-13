import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { loadModules, loadMyProgress } from '../lib/data'

export default function Courses() {
  const { user } = useApp(); const nav = useNavigate()
  const [mods, setMods] = useState(null); const [prog, setProg] = useState({})
  useEffect(() => { loadModules().then(setMods); loadMyProgress(user.id).then(setProg) }, [user.id])
  if (!mods) return <section className="page"><div className="skel" style={{ height: 60, marginBottom: 20 }} /><div className="mods">{[0, 1, 2].map(i => <div key={i} className="skel" style={{ height: 300 }} />)}</div></section>
  const done = Object.keys(prog).length
  const groups = [['core', 'Bootcamp', `${mods.filter(m => m.group_key === 'core').length} modules in the order you'll use them`], ['bonus', 'Exclusive bonus', 'Student case studies and the full live masterclass']]
  const nextId = mods.find(m => !prog[m.id])?.id
  const Card = ({ m, first }) => (
    <div className={`mod ${first ? 'first' : ''}`} role="button" tabIndex={0} onClick={() => nav(`/courses/${m.id}`)} onKeyDown={e => e.key === 'Enter' && nav(`/courses/${m.id}`)}>
      <div className="cover">{m.cover_url ? <img src={m.cover_url} alt="" /> : <span className="letter">{m.title[0]}</span>}
        <i className="dur">{m.minutes} min</i>
        {first && !prog[m.id] && <span className="pill tag">Up next</span>}
        {!m.video_url && !m.external_url && <span className="pill grey tag">Coming soon</span>}
        {prog[m.id] && <div className="done"><i>✓</i></div>}
      </div>
      <div className="body"><div className="ph">{m.phase}</div><h3>{m.title}</h3><p>{m.description}</p>
        <div className="foot"><span className="num" style={{ color: prog[m.id] ? 'var(--green)' : undefined }}>{prog[m.id] ? 'Completed' : `+${m.points} pts`}</span>{first && !prog[m.id] && <span className="btn primary sm" style={{ marginLeft: 'auto' }}>Start module</span>}</div></div>
    </div>
  )
  return (
    <section className="page">
      <div className="head"><div><h1>Courses</h1><p>Every module from the paid bootcamp. Finish them in order and the points add up.</p></div><span className="pill">{done} / {mods.length} complete</span></div>
      {groups.map(([g, title, sub]) => <div key={g}>
        <div className="phase-head"><h2>{title}</h2><span>{sub}</span></div>
        <div className="mods">{mods.filter(m => m.group_key === g).map(m => <Card key={m.id} m={m} first={m.id === nextId} />)}</div>
      </div>)}
    </section>
  )
}

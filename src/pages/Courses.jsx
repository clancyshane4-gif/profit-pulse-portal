import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { loadModules, loadMyProgress, loadPhases } from '../lib/data'
import Icon from '../components/Icon'

export default function Courses() {
  const { user, isAdmin } = useApp(); const nav = useNavigate()
  const [phases, setPhases] = useState(null); const [mods, setMods] = useState([]); const [prog, setProg] = useState({})
  useEffect(() => { loadPhases().then(setPhases); loadModules().then(setMods); loadMyProgress(user.id).then(setProg) }, [user.id])
  if (!phases) return <section className="page"><div className="skel" style={{ height: 60, marginBottom: 20 }} /><div className="phases">{[0, 1, 2, 3].map(i => <div key={i} className="skel" style={{ height: 220 }} />)}</div></section>
  const lessonsOf = p => mods.filter(m => m.phase_id === p.id)
  const quizzes = mods.filter(m => m.kind === 'quiz').length
  // a core phase is locked until every lesson in earlier core phases is done
  const core = phases.filter(p => p.group_key === 'core')
  const lockedPhase = p => { if (isAdmin || p.group_key !== 'core') return false; const i = core.indexOf(p); return core.slice(0, i).some(q => lessonsOf(q).some(m => !prog[m.id])) }
  const done = Object.keys(prog).length
  const Card = ({ p }) => { const ls = lessonsOf(p); const d = ls.filter(m => prog[m.id]).length; const pct = ls.length ? Math.round(d / ls.length * 100) : 0; const lk = lockedPhase(p); return (
    <div className={`phase ${lk ? 'locked' : ''}`} style={{ '--c': p.color }} role="button" tabIndex={0} onClick={() => !lk && nav(`/courses/${p.id}`)} onKeyDown={e => e.key === 'Enter' && !lk && nav(`/courses/${p.id}`)}>
      <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
        <div className="pic"><Icon name={lk ? 'lock' : p.icon} size={26} color={p.color} /></div>
        <div style={{ minWidth: 0 }}><div className="ph" style={{ color: p.color }}>{p.group_key === 'bonus' ? 'Bonus' : `Phase ${p.sort}`}</div><h3>{p.title}</h3></div>
      </div>
      <p>{p.description}</p>
      <div className="row spread" style={{ fontSize: 12.5, color: 'var(--muted)' }}><span className="num">{d} / {ls.length} lessons{ls.some(m => m.kind === 'quiz') ? ' · quiz' : ''}</span><span className="num">{lk ? 'Locked' : pct + '%'}</span></div>
      <div className="bar thin"><i style={{ width: pct + '%', background: p.color, boxShadow: `0 0 12px ${p.color}` }} /></div>
    </div>) }
  return (
    <section className="page">
      <div className="head"><div><h1>Courses</h1><p>Complete lessons to earn points{quizzes ? '. Quizzes available for bonus points' : ''}. Phases unlock in order.</p></div><span className="pill">{done} / {mods.length} lessons</span></div>
      <div className="phases">{phases.filter(p => p.group_key === 'core').map(p => <Card key={p.id} p={p} />)}</div>
      {phases.some(p => p.group_key === 'bonus') && <><div className="phase-head"><h2>Exclusive bonus</h2><span>open from day one</span></div><div className="phases">{phases.filter(p => p.group_key === 'bonus').map(p => <Card key={p.id} p={p} />)}</div></>}
    </section>
  )
}

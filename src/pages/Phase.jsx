import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../App'
import { loadModules, loadMyProgress, completeModule, loadWatch, saveWatch, loadPhases, loadMyQuizAttempts, recordQuizAttempt } from '../lib/data'
import { attachTracker, embedUrl } from '../lib/player'
import Icon from '../components/Icon'

const REQUIRED = 0.5

export default function Phase() {
  const { id } = useParams(); const [sp, setSp] = useSearchParams(); const { user, isAdmin } = useApp(); const nav = useNavigate()
  const [phases, setPhases] = useState([]); const [mods, setMods] = useState([]); const [prog, setProg] = useState({}); const [quiz, setQuiz] = useState({})
  useEffect(() => { loadPhases().then(setPhases); loadModules().then(setMods); loadMyProgress(user.id).then(setProg); loadMyQuizAttempts(user.id).then(setQuiz) }, [user.id])
  const phase = phases.find(p => p.id === id)
  const lessons = mods.filter(m => m.phase_id === id)
  const allCore = phases.filter(p => p.group_key === 'core').flatMap(p => mods.filter(m => m.phase_id === p.id))
  const lockedLesson = m => { if (isAdmin || phase?.group_key !== 'core') return false; const i = allCore.findIndex(x => x.id === m.id); return allCore.slice(0, i).some(x => !prog[x.id]) }
  const curId = sp.get('l') || lessons.find(m => !prog[m.id])?.id || lessons[0]?.id
  const cur = lessons.find(m => m.id === curId)
  if (!phase || !cur) return <section className="page"><div className="skel" style={{ height: 40, width: 220, marginBottom: 16 }} /><div className="course-layout"><div className="skel" style={{ height: 420 }} /><div className="skel" style={{ height: 420 }} /></div></section>
  const done = lessons.filter(m => prog[m.id]).length
  const onDone = mid => { setProg(p => ({ ...p, [mid]: new Date().toISOString() })) }
  const select = m => { if (lockedLesson(m)) return; setSp({ l: m.id }) }
  const idx = lessons.indexOf(cur); const next = lessons[idx + 1]
  const nextPhase = phases[phases.indexOf(phase) + 1]

  return (
    <section className="page">
      <Link className="btn sm" to="/courses" style={{ marginBottom: 14 }}>← All courses</Link>
      <div className="row" style={{ gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
        <div className="pic" style={{ '--c': phase.color }}><Icon name={phase.icon} size={26} color={phase.color} /></div>
        <div style={{ minWidth: 0 }}><div className="ph" style={{ color: phase.color, fontSize: 12, fontWeight: 700 }}>{phase.group_key === 'bonus' ? 'Bonus' : `Phase ${phase.sort}`}</div><h1 style={{ fontSize: 26 }}>{phase.title}</h1><p className="muted" style={{ margin: '4px 0 0', maxWidth: '70ch' }}>{phase.description}</p></div>
      </div>
      <div className="row" style={{ gap: 10, marginBottom: 16 }}><div className="bar thin" style={{ flex: 1 }}><i style={{ width: Math.round(done / lessons.length * 100) + '%', background: phase.color, boxShadow: `0 0 12px ${phase.color}` }} /></div><span className="note num">{done}/{lessons.length} lessons</span></div>
      <div className="course-layout">
        <div className="card" style={{ padding: 10 }}><div className="note" style={{ padding: '6px 12px 10px', fontWeight: 700 }}>Lessons</div>
          <div className="lesson-list">{lessons.map((m, i) => { const lk = lockedLesson(m); return (
            <button key={m.id} className={`lesson ${prog[m.id] ? 'done' : ''} ${m.id === cur.id ? 'on' : ''}`} style={{ opacity: lk ? .45 : 1, cursor: lk ? 'not-allowed' : 'pointer' }} onClick={() => select(m)}>
              <span className="n">{prog[m.id] ? '✓' : lk ? '🔒' : i + 1}</span><span className="t"><b>{m.title}</b><small>{m.points} pts · {m.kind === 'quiz' ? `quiz · ${(m.quiz || []).length} questions` : `${m.minutes} min`}</small></span></button>) })}</div></div>
        {cur.kind === 'quiz'
          ? <Quiz key={cur.id} m={cur} done={!!prog[cur.id]} attempt={quiz[cur.id]} onDone={onDone} next={next} nextPhase={nextPhase} select={select} />
          : <Lesson key={cur.id} m={cur} done={!!prog[cur.id]} onDone={onDone} next={next} nextPhase={nextPhase} select={select} locked={lockedLesson(cur)} lessons={lessons} />}
      </div>
    </section>
  )
}

function Lesson({ m, done, onDone, next, nextPhase, select, locked, lessons }) {
  const { user, isAdmin } = useApp(); const nav = useNavigate()
  const [watch, setWatch] = useState({ seconds: 0, duration: 0 }); const [busy, setBusy] = useState(false); const [toast, setToast] = useState('')
  const iframeRef = useRef(null); const watchRef = useRef(watch); const lastSave = useRef(0)
  useEffect(() => { loadWatch(user.id, m.id).then(w => { setWatch(w); watchRef.current = w }) }, [user.id, m.id])
  useEffect(() => {
    if (!m.video_url || !iframeRef.current || done) return
    const base = watchRef.current.seconds
    const stop = attachTracker(iframeRef.current, m.video_url, (played, duration) => {
      const w = { seconds: base + played, duration: duration || watchRef.current.duration || m.minutes * 60 }
      watchRef.current = w; setWatch(w)
      if (Date.now() - lastSave.current > 10000) { lastSave.current = Date.now(); saveWatch(user.id, m.id, w.seconds, w.duration) }
    })
    return () => { stop(); const w = watchRef.current; if (w.seconds > base) saveWatch(user.id, m.id, w.seconds, w.duration) }
  }, [m.id, m.video_url, done])
  if (locked) { const blocker = lessons.find(x => !x.locked && x.id !== m.id); return <div className="card"><div className="empty"><div className="ic">🔒</div><b>{m.title} is locked</b><span>Lessons unlock in order. Finish the earlier ones first.</span></div></div> }
  const duration = watch.duration || m.minutes * 60; const frac = Math.min(1, watch.seconds / Math.max(1, duration)); const pct = Math.round(frac * 100)
  const hasVideo = !!m.video_url; const canComplete = done || isAdmin || !hasVideo || frac >= REQUIRED
  async function mark() { setBusy(true); try { await completeModule(user.id, m.id, m.points); onDone(m.id); setToast(`+${m.points} points`); setTimeout(() => setToast(''), 2200) } catch { setToast('Could not save. Try again.'); setTimeout(() => setToast(''), 2500) } setBusy(false) }
  return (
    <div>
      {hasVideo
        ? <div className="player"><iframe ref={iframeRef} key={m.id} src={embedUrl(m.video_url)} title={m.title} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen /></div>
        : <a className="player" href={m.external_url || '#'} target="_blank" rel="noopener">{m.cover_url && <img src={m.cover_url} alt="" />}<div className="play"><svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></div><span className="open">{m.external_url ? 'Watch on Skool ↗' : 'Video coming soon'}</span></a>}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="row spread" style={{ flexWrap: 'wrap', gap: 8 }}><h3 style={{ fontSize: 18 }}>{m.title}</h3>{done ? <span className="pill">Completed</span> : hasVideo && <span className={`pill ${frac >= REQUIRED ? '' : 'grey'}`}>{pct}% watched</span>}</div>
        <div className="note" style={{ margin: '4px 0 10px' }}>{m.points} points · {m.minutes} minutes</div>
        {m.description && <p className="muted" style={{ margin: '0 0 12px', fontSize: 13.5 }}>{m.description}</p>}
        {hasVideo && !done && <div style={{ margin: '0 0 14px' }}><div className="bar thin"><i style={{ width: pct + '%' }} /></div><div className="note" style={{ marginTop: 6 }}>{frac >= REQUIRED ? 'You can mark this complete.' : `Watch at least half (${Math.ceil(duration * REQUIRED / 60)} min) to unlock Mark complete. Skipping ahead doesn't count.`}</div></div>}
        {(m.resources || []).length > 0 && <div className="list" style={{ marginBottom: 14 }}>{m.resources.map(r => <a key={r.url} className="btn sm" href={r.url} target="_blank" rel="noopener" style={{ justifyContent: 'flex-start' }}>📄 {r.title}</a>)}</div>}
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <button className="btn primary" disabled={done || busy || !canComplete} onClick={mark}>{done ? 'Completed' : `Mark complete (+${m.points} pts)`}</button>
          {next && (done || isAdmin) && <button className="btn" onClick={() => select(next)}>Next: {next.title} →</button>}
          {!next && done && nextPhase && <button className="btn" onClick={() => nav(`/courses/${nextPhase.id}`)}>Next phase: {nextPhase.title} →</button>}
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function Quiz({ m, done, attempt, onDone, next, nextPhase, select }) {
  const { user } = useApp(); const nav = useNavigate()
  const qs = m.quiz || []; const [ans, setAns] = useState({}); const [result, setResult] = useState(null); const [busy, setBusy] = useState(false)
  const pass = m.pass_pct || 80
  async function submit() {
    if (Object.keys(ans).length < qs.length) return
    const correct = qs.filter((q, i) => ans[i] === q.answer).length; const pct = Math.round(correct / qs.length * 100); const passed = pct >= pass
    setBusy(true); await recordQuizAttempt(user.id, m.id, pct, passed)
    if (passed && !done) { await completeModule(user.id, m.id, m.points); onDone(m.id) }
    setResult({ pct, passed, correct }); setBusy(false)
  }
  if (!qs.length) return <div className="card"><div className="empty"><div className="ic">?</div><b>Quiz coming soon</b><span>Questions haven't been added yet.</span></div></div>
  return (
    <div className="card">
      <div className="row spread" style={{ flexWrap: 'wrap', gap: 8 }}><h3 style={{ fontSize: 18 }}>{m.title}</h3>{done ? <span className="pill">Passed{attempt ? ` · ${attempt.score_pct}%` : ''}</span> : <span className="pill grey">{qs.length} questions · pass at {pass}%</span>}</div>
      <div className="note" style={{ margin: '4px 0 16px' }}>+{m.points} points when you pass. You can retake it.</div>
      {result && <div className={`card ${result.passed ? '' : ''}`} style={{ marginBottom: 16, borderColor: result.passed ? 'rgba(34,227,107,.4)' : 'rgba(239,107,107,.4)' }}><b>{result.passed ? `Passed with ${result.pct}%` : `${result.pct}%. You need ${pass}% to pass.`}</b><div className="note">{result.correct} of {qs.length} correct.{!result.passed && ' Review the answers and try again.'}</div></div>}
      <div className="list" style={{ gap: 16 }}>{qs.map((q, i) => <div key={i}><b style={{ display: 'block', marginBottom: 8 }}>{i + 1}. {q.q}</b>
        <div className="list" style={{ gap: 6 }}>{q.options.map((o, j) => { const chosen = ans[i] === j; const show = result != null; const right = j === q.answer; return (
          <button key={j} className="opt" style={{ borderColor: show ? (right ? 'rgba(34,227,107,.6)' : chosen ? 'rgba(239,107,107,.6)' : undefined) : chosen ? 'rgba(34,227,107,.6)' : undefined, background: chosen && !show ? 'var(--green-soft)' : undefined }} onClick={() => !result && setAns({ ...ans, [i]: j })}>{o}{show && right && ' ✓'}</button>) })}</div></div>)}</div>
      <div className="row" style={{ gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
        {!result ? <button className="btn primary" disabled={busy || Object.keys(ans).length < qs.length} onClick={submit}>Submit answers</button>
          : !result.passed ? <button className="btn primary" onClick={() => { setAns({}); setResult(null) }}>Try again</button>
          : next ? <button className="btn primary" onClick={() => select(next)}>Next: {next.title} →</button> : nextPhase ? <button className="btn primary" onClick={() => nav(`/courses/${nextPhase.id}`)}>Next phase: {nextPhase.title} →</button> : <Link className="btn primary" to="/courses">Back to courses</Link>}
      </div>
    </div>
  )
}

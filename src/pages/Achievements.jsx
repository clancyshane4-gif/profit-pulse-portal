import { useEffect, useState } from 'react'
import { useApp } from '../App'
import { loadAchievements, loadMySubmissions, submitProofV2, uploadProof, shrinkImage, loadOutreach, logOutreach, loadAchievementStats, loadLeaderboard } from '../lib/data'
import Avatar from '../components/Avatar'

const short = t => { const x = t.replace(/^(Do|Build|Launch|Set up|Sign|Book|Pick|Write|Hit|Create|Make|Get|Run|Close) /, '').replace(' earned', ''); return x.charAt(0).toUpperCase() + x.slice(1) }

export default function Achievements() {
  const { user } = useApp()
  const [ach, setAch] = useState(null); const [subs, setSubs] = useState({}); const [stats, setStats] = useState({}); const [board, setBoard] = useState([])
  const [outreach, setOutreach] = useState([]); const [modal, setModal] = useState(null); const [toast, setToast] = useState('')
  const reload = () => Promise.all([loadMySubmissions(user.id), loadOutreach(user.id)]).then(([s, o]) => { setSubs(s); setOutreach(o) })
  useEffect(() => { loadAchievements().then(setAch); loadAchievementStats().then(setStats); loadLeaderboard().then(setBoard); reload() }, [user.id])
  if (!ach) return <section className="page"><div className="skel" style={{ height: 140, marginBottom: 16 }} /><div className="badges">{[0, 1, 2, 3].map(i => <div key={i} className="skel" style={{ height: 160 }} />)}</div></section>

  const flash = t => { setToast(t); setTimeout(() => setToast(''), 2400) }
  const st = a => subs[a.key]?.status || 'locked'
  const earned = ach.filter(a => st(a) === 'approved'); const pts = earned.reduce((s, a) => s + a.points, 0)
  const journey = [...ach].sort((a, b) => a.sort - b.sort)
  const nextUp = journey.find(a => st(a) !== 'approved' && st(a) !== 'pending' && !a.auto_metric) || journey.find(a => st(a) !== 'approved')
  const total = outreach.reduce((s, o) => s + o.count, 0); const today = outreach.find(o => o.day === new Date().toISOString().slice(0, 10))?.count || 0
  const outTiers = ach.filter(a => a.auto_metric === 'outreach').sort((a, b) => a.auto_threshold - b.auto_threshold); const nextTier = outTiers.find(a => a.auto_threshold > total)

  // rank impact: where would +points put me
  const me = board.find(b => b.id === user.id); const myPts = me?.points ?? 0; const myRank = me ? board.findIndex(b => b.id === user.id) + 1 : board.length + 1
  const rankAfter = p => { const n = myPts + p; return board.filter(b => b.id !== user.id && b.points > n).length + 1 }

  const groups = [['Build', 'implement', a => a.category === 'implement' && !a.auto_metric], ['Outreach', 'outreach', a => a.auto_metric === 'outreach'], ['Close & earn', 'revenue', a => a.category === 'revenue']]

  return (
    <section className="page">
      <div className="head"><div><h1>Achievements</h1><p>Do the work, submit proof, a coach approves it, the points land on your total.</p></div><div className="row" style={{ gap: 8 }}><span className="pill">{earned.length} / {ach.length} earned</span><span className="pill teal">{pts} pts</span></div></div>

      {/* journey track */}
      <div className="card" style={{ marginBottom: 18, overflow: 'hidden' }}>
        <div className="note" style={{ marginBottom: 12 }}>Your path</div>
        <div className="track"><div className="track-line" />
          {journey.map((a, i) => { const s = st(a); const cur = nextUp?.key === a.key; return <button key={a.key} className={`node ${s} ${cur ? 'cur' : ''}`} title={a.title} onClick={() => document.getElementById('ach_' + a.key)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}><span className="dot-ic">{s === 'approved' ? '✓' : a.icon || '•'}</span><small>{short(a.title)}</small></button> })}
        </div>
      </div>

      {/* next up */}
      {nextUp && <div className="nextup">
        <div className="row" style={{ gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div className="medal big">{nextUp.icon || '⭐'}</div>
          <div style={{ flex: 1, minWidth: 220 }}><div className="eyebrow">Next up</div><h2 style={{ fontSize: 24, margin: '4px 0 6px' }}>{nextUp.title}</h2><p className="muted" style={{ margin: 0 }}>{nextUp.how}</p>
            <div className="note" style={{ marginTop: 10 }}>+{nextUp.points} points{board.length > 1 && rankAfter(nextUp.points) < myRank ? ` · moves you from #${myRank} to #${rankAfter(nextUp.points)}` : board.length > 1 ? ` · you're #${myRank} on the board` : ''}</div></div>
          {!nextUp.auto_metric && <button className="btn primary" onClick={() => setModal(nextUp)}>Submit proof</button>}
        </div>
      </div>}

      {groups.map(([title, kind, f]) => { const list = journey.filter(f); if (!list.length) return null; return (
        <div key={title}>
          <div className="phase-head"><h2>{title}</h2><span>{kind === 'outreach' ? 'unlocks automatically from your counter' : kind === 'revenue' ? 'milestones' : 'implementation'}</span></div>
          {kind === 'outreach' && <OutreachCounter total={total} today={today} nextTier={nextTier} onLog={async n => { await logOutreach(user.id, n); await reload(); flash(n > 0 ? `Logged ${n} outreach` : 'Updated') }} />}
          <div className="badges">{list.map(a => <Badge key={a.key} id={'ach_' + a.key} a={a} s={subs[a.key]} stat={stats[a.key]} milestone={kind === 'revenue'} onSubmit={() => setModal(a)} rankAfter={rankAfter} myRank={myRank} hasBoard={board.length > 1} />)}</div>
        </div>) })}

      {modal && <ProofModal a={modal} existing={subs[modal.key]} onClose={() => setModal(null)} onDone={async () => { setModal(null); await reload(); flash('Submitted for review') }} />}
      {toast && <div className="toast">{toast}</div>}
    </section>
  )
}

function Badge({ id, a, s, stat, milestone, onSubmit, rankAfter, myRank, hasBoard }) {
  const st = s?.status || 'locked'
  return (
    <div id={id} className={`badge ${st} ${milestone ? 'milestone' : ''}`}>
      <div className="medal">{a.icon || '⭐'}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <b>{a.title}</b><div><small>{a.how}</small></div>
        {st === 'approved' && <div className="row" style={{ gap: 8, marginTop: 8, flexWrap: 'wrap' }}><span className="pill">Earned{s.reviewed_at ? ` · ${new Date(s.reviewed_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}` : ''}</span></div>}
        {st === 'pending' && <div className="pill warn" style={{ marginTop: 8 }}>Waiting for review</div>}
        {st === 'rejected' && <div className="reject"><b>Not approved.</b> {s.reviewer_note || 'Add clearer proof and resubmit.'}</div>}
        {(st === 'locked' || st === 'rejected') && !a.auto_metric && <div className="row" style={{ gap: 10, marginTop: 10, flexWrap: 'wrap' }}><button className={`btn sm ${st === 'rejected' ? 'primary' : ''}`} onClick={onSubmit}>{st === 'rejected' ? 'Resubmit' : 'Submit proof'}</button>{hasBoard && rankAfter(a.points) < myRank && <span className="note">+{a.points} → #{rankAfter(a.points)}</span>}</div>}
        {stat?.count > 0 && <div className="row" style={{ gap: 6, marginTop: 10 }}><div className="row" style={{ gap: 0 }}>{stat.recent.map((r, i) => <span key={i} style={{ marginLeft: i ? -8 : 0 }}><Avatar name={r.name} url={r.photo_url} size={22} /></span>)}</div><span className="note">{stat.count} student{stat.count === 1 ? ' has' : 's have'} earned this</span></div>}
      </div>
      <span className="pt">+{a.points}</span>
    </div>
  )
}

function OutreachCounter({ total, today, nextTier, onLog }) {
  const [n, setN] = useState(10); const [busy, setBusy] = useState(false)
  const target = nextTier?.auto_threshold || Math.max(total, 1); const pct = Math.min(100, Math.round(total / target * 100))
  return (
    <div className="card counter" style={{ marginBottom: 14 }}>
      <div className="row" style={{ gap: 22, flexWrap: 'wrap', alignItems: 'center' }}>
        <div><div className="note">Total outreach</div><div className="big num" style={{ fontSize: 48 }}>{total}</div><div className="note">{today} logged today</div></div>
        <div style={{ flex: 1, minWidth: 220 }}><div className="row spread" style={{ fontSize: 13 }}><span>{nextTier ? `${nextTier.auto_threshold - total} to ${nextTier.title.toLowerCase()}` : 'All outreach badges earned'}</span><span className="num">{total} / {target}</span></div><div className="bar" style={{ marginTop: 6 }}><i style={{ width: pct + '%' }} /></div><div className="note" style={{ marginTop: 6 }}>Log the messages, calls and DMs you sent today. Counts as daily activity.</div></div>
        <div className="row" style={{ gap: 6 }}><button className="btn sm" onClick={() => setN(v => Math.max(1, v - 5))}>−5</button><input type="number" value={n} onChange={e => setN(Number(e.target.value) || 0)} style={{ width: 76, textAlign: 'center', padding: '8px' }} /><button className="btn sm" onClick={() => setN(v => v + 5)}>+5</button><button className="btn primary" disabled={busy || n <= 0} onClick={async () => { setBusy(true); await onLog(n); setBusy(false) }}>Log {n}</button></div>
      </div>
    </div>
  )
}

function ProofModal({ a, existing, onClose, onDone }) {
  const { user } = useApp()
  const [text, setText] = useState(existing?.status === 'rejected' ? existing.proof || '' : ''); const [imgs, setImgs] = useState([]); const [busy, setBusy] = useState(false); const [err, setErr] = useState('')
  async function pick(e) { const files = [...e.target.files].slice(0, 4 - imgs.length); for (const f of files) { try { const b = await shrinkImage(f); setImgs(x => [...x, { b, url: URL.createObjectURL(b) }]) } catch { setErr("One file didn't open as an image.") } } }
  async function send() {
    if (!text.trim() && !imgs.length) { setErr('Add a screenshot or a short description.'); return }
    setBusy(true); setErr('')
    try { const urls = []; for (const i of imgs) urls.push(await uploadProof(user.id, i.b)); await submitProofV2(user.id, a.key, text.trim(), urls, existing); onDone() }
    catch (ex) { setErr(ex.message || 'Could not submit.'); setBusy(false) }
  }
  return (
    <div className="gate" onClick={onClose}><div className="box" onClick={e => e.stopPropagation()}>
      <div className="row" style={{ gap: 12 }}><div className="medal big" style={{ filter: 'none', opacity: 1 }}>{a.icon || '⭐'}</div><div><div className="eyebrow">Submit proof · +{a.points} pts</div><h2 style={{ fontSize: 22 }}>{a.title}</h2></div></div>
      <p className="muted" style={{ margin: '8px 0 16px' }}>{a.how}</p>
      {existing?.status === 'rejected' && <div className="reject" style={{ marginBottom: 12 }}><b>Last time:</b> {existing.reviewer_note || 'not approved'}</div>}
      <label className="drop" htmlFor="proofFiles" style={{ padding: 18 }}><b>Add screenshots</b><span className="note">Up to 4 images. JPG, PNG or a phone screenshot.</span></label>
      <input id="proofFiles" type="file" accept="image/*" multiple hidden onChange={pick} />
      {imgs.length > 0 && <div className="thumbs">{imgs.map((i, k) => <div key={k}><img src={i.url} alt="" /><button type="button" onClick={() => setImgs(x => x.filter((_, j) => j !== k))}>✕</button></div>)}</div>}
      <div style={{ marginTop: 12 }}><label className="f" htmlFor="proofText">Link or short note (optional)</label><textarea id="proofText" value={text} onChange={e => setText(e.target.value)} placeholder="Link to the live site, or a line about what the screenshot shows." style={{ minHeight: 70 }} /></div>
      <div className="err">{err}</div>
      <div className="actions"><button className="btn" type="button" onClick={onClose}>Cancel</button><button className="btn primary" type="button" disabled={busy} onClick={send}>{busy ? 'Uploading…' : 'Submit for review'}</button></div>
    </div></div>
  )
}

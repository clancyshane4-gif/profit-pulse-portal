import { useEffect, useState } from 'react'
import { useApp } from '../App'
import { repCreateStudent, repLoadMyStudents } from '../lib/data'
import Avatar from '../components/Avatar'

export default function Rep() {
  const { user, isAdmin } = useApp()
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null); const [err, setErr] = useState(''); const [list, setList] = useState([]); const [copied, setCopied] = useState(false)
  const load = () => repLoadMyStudents(user.id, isAdmin).then(setList)
  useEffect(() => { load() }, [])

  async function create(e) {
    e.preventDefault(); setBusy(true); setErr(''); setResult(null); setCopied(false)
    try { const r = await repCreateStudent(email, name); setResult(r); setName(''); setEmail(''); load() }
    catch (ex) { setErr(ex.message) }
    setBusy(false)
  }
  async function reset(m) {
    setErr(''); setResult(null); setCopied(false)
    try { setResult(await repCreateStudent(m.email, m.name, 'reset')) } catch (ex) { setErr(ex.message) }
  }
  const handoff = result ? `Here's your Profit Pulse AI portal login.\nLink: ${location.origin}\nEmail: ${result.email}\nTemporary password: ${result.password}\nIt will ask you to set your own password the first time you sign in.` : ''
  async function copy() { try { await navigator.clipboard.writeText(handoff); setCopied(true) } catch { setCopied(false) } }

  return (
    <section className="page">
      <div className="head"><div><h1>Rep panel</h1><p>Add a student after they sign up. You get a temporary password to send them; they set their own the first time they log in.</p></div></div>
      <form className="card" onSubmit={create}><b>Add a student</b>
        <div className="grid g2" style={{ gap: 10, marginTop: 12 }}>
          <div><label className="f" htmlFor="rName">Name</label><input id="rName" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="First and last" required /></div>
          <div><label className="f" htmlFor="rEmail">Email</label><input id="rEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="student@email.com" autoComplete="off" required /></div>
        </div>
        <div className="row" style={{ gap: 10, marginTop: 12, flexWrap: 'wrap' }}><button className="btn primary" disabled={busy}>{busy ? 'Creating…' : 'Create login'}</button><span className="err" style={{ minHeight: 0 }}>{err}</span></div>
      </form>

      {result && <div className="card" style={{ marginTop: 14, borderColor: 'rgba(34,227,107,.35)' }}>
        <div className="row spread" style={{ flexWrap: 'wrap', gap: 8 }}><b>{result.reset ? 'New temporary password' : 'Login created'}</b><span className="pill">Shown once</span></div>
        <div className="grid g2" style={{ gap: 10, marginTop: 10 }}>
          <div><div className="note">Email</div><div className="num" style={{ fontSize: 15 }}>{result.email}</div></div>
          <div><div className="note">Temporary password</div><div className="num" style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{result.password}</div></div>
        </div>
        <div className="note" style={{ margin: '12px 0 6px' }}>Message to send them</div>
        <textarea readOnly value={handoff} style={{ minHeight: 120 }} onFocus={e => e.target.select()} />
        <div className="row" style={{ gap: 8, marginTop: 8 }}><button type="button" className="btn sm primary" onClick={copy}>{copied ? 'Copied' : 'Copy message'}</button><span className="note">If copy doesn't work, select the text above.</span></div>
      </div>}

      <div className="card" style={{ marginTop: 14 }}><div className="row spread"><b>{isAdmin ? 'All students' : 'Students you added'}</b><span className="note">{list.length}</span></div>
        {list.filter(m => m.role === 'student' || !isAdmin).map(m => <div key={m.id} className="coachrow" style={{ gridTemplateColumns: '40px minmax(0,1fr) auto' }}>
          <Avatar name={m.name} url={m.photo_url} />
          <div style={{ minWidth: 0 }}><b>{m.name || '(no name yet)'}</b> <span className="note">· {m.email} · added {new Date(m.created_at).toLocaleDateString()}</span>
            <div className="note">{m.must_change_password ? "Hasn't signed in yet" : m.onboarded ? 'Signed in and set up' : 'Signed in, photo not added'}{!m.active ? ' · Disabled' : ''}</div></div>
          <button className="btn sm" onClick={() => reset(m)}>Reset password</button>
        </div>)}
        {!list.length && <div className="note" style={{ padding: '10px 0' }}>No students yet.</div>}
      </div>
    </section>
  )
}

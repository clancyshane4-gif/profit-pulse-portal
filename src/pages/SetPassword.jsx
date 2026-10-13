import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function SetPassword({ onDone }) {
  const [ready, setReady] = useState(false); const [pw, setPw] = useState(''); const [pw2, setPw2] = useState('')
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const nav = useNavigate()

  useEffect(() => {
    // supabase-js reads the invite/recovery token from the URL hash and creates a session
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setReady(!!s))
    return () => sub.subscription.unsubscribe()
  }, [])

  async function save(e) {
    e.preventDefault(); setErr('')
    if (pw.length < 8) { setErr('Use at least 8 characters.'); return }
    if (pw !== pw2) { setErr("Those passwords don't match."); return }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) { setErr(error.message); return }
    history.replaceState(null, '', '/'); onDone?.(); nav('/', { replace: true })
  }
  return (
    <div className="center">
      <form className="auth" onSubmit={save}>
        <div className="eyebrow">Welcome to Profit Pulse AI</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, margin: '6px 0' }}>Set your password</h2>
        {!ready ? <p className="muted">Checking your invite link… If this doesn't change in a few seconds, the link may have expired. Ask your coach to resend it.</p> : <>
          <p className="muted" style={{ margin: '0 0 16px' }}>You'll use this with your email to sign in.</p>
          <label className="f" htmlFor="pw">New password</label>
          <input id="pw" type="password" value={pw} onChange={e => setPw(e.target.value)} autoComplete="new-password" />
          <div style={{ marginTop: 12 }}><label className="f" htmlFor="pw2">Confirm password</label>
            <input id="pw2" type="password" value={pw2} onChange={e => setPw2(e.target.value)} autoComplete="new-password" /></div>
          <div className="err" style={{ marginTop: 8 }}>{err}</div>
          <button className="btn primary" style={{ width: '100%' }} disabled={busy}>{busy ? 'Saving…' : 'Save and enter the portal'}</button>
        </>}
      </form>
    </div>
  )
}

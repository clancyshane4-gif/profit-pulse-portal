import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('')
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [sent, setSent] = useState(false)

  async function signIn(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) setErr(error.message.includes('Invalid') ? "That email and password don't match." : error.message)
  }
  async function forgot() {
    if (!email.trim()) { setErr('Enter your email first.'); return }
    setErr(''); const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/set-password` })
    if (error) setErr(error.message); else setSent(true)
  }
  return (
    <div className="center">
      <form className="auth" onSubmit={signIn}>
        <div className="row" style={{ gap: 10, marginBottom: 14 }}>
          <img src="/logo-mark.png" alt="" style={{ width: 44, height: 44 }} />
          <div><b style={{ fontFamily: 'var(--display)', fontSize: 16, display: 'block' }}>Profit Pulse AI</b><span className="note">Student Portal</span></div>
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800 }}>Sign in</h2>
        <p className="muted" style={{ margin: '4px 0 18px' }}>Use the email and temporary password your rep sent you.</p>
        <label className="f" htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" required />
        <div style={{ marginTop: 12 }}><label className="f" htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required /></div>
        <div className="err" style={{ marginTop: 8 }}>{err}</div>
        <button className="btn primary" style={{ width: '100%' }} disabled={busy}>{busy ? 'Signing in…' : 'Enter the portal'}</button>
        <div className="note" style={{ marginTop: 14 }}>
          {sent ? 'Check your email for a reset link.' : <>Forgot your password? <a href="#" onClick={e => { e.preventDefault(); forgot() }}>Send a reset link</a>.</>}
          <br />No login yet? Message your rep or coach in Discord.
        </div>
      </form>
    </div>
  )
}

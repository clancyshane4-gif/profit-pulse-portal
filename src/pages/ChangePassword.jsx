import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../App'
import { clearMustChange } from '../lib/data'

export default function ChangePassword() {
  const { user, refreshProfile } = useApp()
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  async function save(e) {
    e.preventDefault(); setErr('')
    if (pw.length < 8) { setErr('Use at least 8 characters.'); return }
    if (pw !== pw2) { setErr("Those passwords don't match."); return }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    if (error) { setErr(error.message); setBusy(false); return }
    await clearMustChange(user.id); await refreshProfile(); setBusy(false)
  }
  return (
    <div className="center">
      <form className="auth" onSubmit={save}>
        <div className="row" style={{ gap: 10, marginBottom: 14 }}><img src="/logo-mark.png" alt="" style={{ width: 44, height: 44 }} /><div><b style={{ fontFamily: 'var(--display)', fontSize: 16, display: 'block' }}>Profit Pulse AI</b><span className="note">Student Portal</span></div></div>
        <h2 style={{ fontSize: 26, fontWeight: 800, margin: '6px 0' }}>Set your own password</h2>
        <p className="muted" style={{ margin: '0 0 16px' }}>You signed in with a temporary password. Pick one only you know.</p>
        <label className="f" htmlFor="pw">New password</label>
        <input id="pw" type="password" value={pw} onChange={e => setPw(e.target.value)} autoComplete="new-password" />
        <div style={{ marginTop: 12 }}><label className="f" htmlFor="pw2">Confirm password</label><input id="pw2" type="password" value={pw2} onChange={e => setPw2(e.target.value)} autoComplete="new-password" /></div>
        <div className="err" style={{ marginTop: 8 }}>{err}</div>
        <button className="btn primary" style={{ width: '100%' }} disabled={busy}>{busy ? 'Saving…' : 'Save and continue'}</button>
      </form>
    </div>
  )
}

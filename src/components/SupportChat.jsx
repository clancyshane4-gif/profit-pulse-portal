import { useEffect, useRef, useState } from 'react'
import { useApp } from '../App'
import { Link, useLocation } from 'react-router-dom'
import { loadSupportThread, sendSupport, markSupportRead, adminLoadSupportInbox } from '../lib/data'

// Floating support bubble (bottom-right). Student writes, gets an instant auto-reply, coach answers from Admin → Support.
export default function SupportChat() {
  const { user, profile, settings, isAdmin } = useApp()
  if (isAdmin) return <StaffBubble />
  return <StudentChat user={user} profile={profile} settings={settings} />
}

// Staff see a bubble with the number of unanswered student messages; it opens the inbox.
function StaffBubble() {
  const [n, setN] = useState(0); const loc = useLocation()
  useEffect(() => { const load = () => adminLoadSupportInbox().then(t => setN(t.reduce((s, x) => s + x.unread, 0))).catch(() => {}); load(); const i = setInterval(load, 30000); return () => clearInterval(i) }, [loc.pathname])
  if (loc.pathname === '/admin') return null
  return <Link className="support-fab" to="/admin?tab=support" title="Support inbox" aria-label="Support inbox">💬{n > 0 && <span className="fab-badge">{n}</span>}</Link>
}

function StudentChat({ user, profile, settings }) {
  const cfg = { email: 'support@aiprofitpulse.com', auto_reply: 'Got it. A coach replies here within 24 hours.', hours: '', ...(settings.support || {}) }
  const [open, setOpen] = useState(false); const [msgs, setMsgs] = useState([]); const [text, setText] = useState(''); const [busy, setBusy] = useState(false); const [auto, setAuto] = useState(false)
  const endRef = useRef(null)
  const load = () => loadSupportThread(user.id).then(setMsgs)
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t) }, [user.id])
  useEffect(() => { if (open) { endRef.current?.scrollIntoView({ block: 'end' }); if (msgs.some(m => m.from_staff && !m.read_at)) markSupportRead(user.id, true).then(load) } }, [open, msgs.length])
  useEffect(() => { document.body.classList.toggle('chat-open', open); return () => document.body.classList.remove('chat-open') }, [open])
  const unread = msgs.filter(m => m.from_staff && !m.read_at).length
  async function send(e) {
    e?.preventDefault(); const body = text.trim(); if (!body) return
    setBusy(true); try { await sendSupport(user.id, user.id, body); setText(''); setAuto(true); await load() } catch (ex) { alert(ex.message) } setBusy(false)
  }
  const first = (profile.name || '').split(' ')[0] || 'there'
  return (
    <>
      <button className={`support-fab ${open ? 'open' : ''}`} onClick={() => setOpen(o => !o)} aria-label="Support">{open ? '✕' : '💬'}{!open && unread > 0 && <span className="fab-badge">{unread}</span>}</button>
      {open && <div className="support-panel">
        <div className="support-head"><div><b>Support</b><div className="note">{cfg.hours ? `${cfg.hours} · ` : ''}<a href={`mailto:${cfg.email}`}>{cfg.email}</a></div></div></div>
        <div className="support-body">
          <div className="msg staff"><b>Profit Pulse team</b>Hey {first} 👋 Stuck on a build, a client, or the portal? Tell us what's going on and a coach will get back to you here.</div>
          {msgs.map(m => <div key={m.id} className={`msg ${m.from_staff ? 'staff' : 'me'}`}>{m.from_staff && <b>Coach</b>}{m.body}<small>{new Date(m.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</small></div>)}
          {auto && !msgs.some(m => m.from_staff && new Date(m.created_at) > new Date(Date.now() - 6e4)) && <div className="msg staff auto"><b>Auto-reply</b>{cfg.auto_reply}</div>}
          <div ref={endRef} />
        </div>
        <form className="support-form" onSubmit={send}>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Type your message…" rows={2} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} />
          <button className="btn primary sm" disabled={busy || !text.trim()}>{busy ? '…' : 'Send'}</button>
        </form>
      </div>}
    </>
  )
}

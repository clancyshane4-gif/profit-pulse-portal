import { useEffect, useState } from 'react'
import { loadAnnouncements } from '../lib/data'

export default function Announcement() {
  const [list, setList] = useState([]); const [dismissed, setDismissed] = useState(() => { try { return JSON.parse(localStorage.getItem('pp_dismissed') || '[]') } catch { return [] } })
  const [expanded, setExpanded] = useState(false)
  useEffect(() => { loadAnnouncements().then(setList) }, [])
  const a = list.find(x => !dismissed.includes(x.id))
  if (!a) return null
  function close() { const d = [...dismissed, a.id]; setDismissed(d); setExpanded(false); try { localStorage.setItem('pp_dismissed', JSON.stringify(d)) } catch {} }
  const when = new Date(a.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
  return (
    <div className={`ann ${a.kind === 'tip' ? 'tip' : ''}`} role="status">
      <button className="ann-x" onClick={close} aria-label="Dismiss">✕</button>
      <div className="ann-eyebrow">{a.kind === 'tip' ? '💡 Daily tip' : '🔔 Latest announcement'} <span className="note" style={{ marginLeft: 6, fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>{when}</span></div>
      <b className="ann-title">{a.title}</b>
      <p className={`ann-body ${expanded || a.kind === 'tip' ? 'open' : ''}`}>{a.body}</p>
      <div className="row" style={{ gap: 10, marginTop: 8 }}>
        {a.body && a.body.length > 140 && a.kind !== 'tip' && <button className="btn sm" onClick={() => setExpanded(e => !e)}>{expanded ? 'Show less' : 'Read more'}</button>}
        {a.link_url && <a className="btn sm primary" href={a.link_url} target="_blank" rel="noopener">{a.link_label || 'Open link'} ↗</a>}
      </div>
    </div>
  )
}

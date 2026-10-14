import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { loadEvents } from '../lib/data'
import { useApp } from '../App'
import { occurrence } from '../pages/Schedule'

// Corner card for the next live class: "live now" during the call, "today at 6 PM" beforehand.
// Dismissing hides that one occurrence only; tomorrow's call pops again.
const SOON_HOURS = 20
export default function LivePop() {
  const [events, setEvents] = useState([]); const [tick, setTick] = useState(0)
  const [dismissed, setDismissed] = useState([])
  useEffect(() => { loadEvents().then(setEvents); const t = setInterval(() => setTick(x => x + 1), 60000); return () => clearInterval(t) }, [])
  const loc = useLocation(); const { settings } = useApp(); const join = next => next.ev.join_url || settings.default_join_url || ''
  const now = new Date()
  // occurrences this week and next, pick the first one that's live or upcoming
  const weekStart = new Date(now); weekStart.setHours(0, 0, 0, 0); weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const occ = []
  for (const w of [0, 1]) { const ws = new Date(weekStart); ws.setDate(ws.getDate() + w * 7); events.forEach(ev => { const o = occurrence(ws, ev); occ.push({ ev, ...o }) }) }
  occ.sort((a, b) => a.start - b.start)
  const next = occ.find(o => o.end > now)
  if (!next) return null
  const liveNow = next.start <= now && next.end > now
  if (loc.pathname !== '/' && !liveNow) return null  // upcoming: dashboard only; live: everywhere
  const key = next.ev.id + ':' + next.start.toDateString()
  if (dismissed.includes(key)) return null
  const live = next.start <= now && next.end > now
  const hoursAway = (next.start - now) / 36e5
  if (!live && hoursAway > SOON_HOURS) return null
  const close = () => setDismissed(d => [...d, key])
  const time = next.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
  const today = next.start.toDateString() === now.toDateString()
  const mins = Math.round(hoursAway * 60)
  const when = live ? 'Live now' : mins < 60 ? `Starts in ${mins} min` : today ? `Today, ${time}` : `Tomorrow, ${time}`
  const coach = next.ev.coach || 'your coach'
  return (
    <div className={`ann ${live ? 'live' : 'soon'}`} role="status">
      <button className="ann-x" onClick={close} aria-label="Dismiss">✕</button>
      <div className="ann-eyebrow">{live ? <><span className="livedot" />{coach} is live</> : `📅 Live class · ${coach}`}</div>
      <b className="ann-title">{live ? `${next.ev.title} is live now` : `${next.ev.title} · ${when}`}</b>
      {live && <p className="ann-body open">{coach} is on. Jump in.</p>}
      <div className="row" style={{ gap: 10, marginTop: 10 }}>
        {live && join(next) ? <a className="btn sm primary" href={join(next)} target="_blank" rel="noopener">Join on Google Meet ↗</a> : <Link className="btn sm primary" to="/schedule" onClick={close}>See schedule</Link>}
        {!live && <button className="btn sm" onClick={close}>Got it</button>}
      </div>
    </div>
  )
}

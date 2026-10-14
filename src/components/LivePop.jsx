import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { loadEvents } from '../lib/data'
import { occurrence } from '../pages/Schedule'

// Corner card for the next live class: "live now" during the call, "today at 6 PM" beforehand.
// Dismissing hides that one occurrence only; tomorrow's call pops again.
const SOON_HOURS = 20
export default function LivePop() {
  const [events, setEvents] = useState([]); const [tick, setTick] = useState(0)
  const [dismissed, setDismissed] = useState(() => { try { return JSON.parse(localStorage.getItem('pp_live_dismissed') || '[]') } catch { return [] } })
  useEffect(() => { loadEvents().then(setEvents); const t = setInterval(() => setTick(x => x + 1), 60000); return () => clearInterval(t) }, [])
  const loc = useLocation()
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
  const close = () => { const d = [...dismissed.slice(-20), key]; setDismissed(d); try { localStorage.setItem('pp_live_dismissed', JSON.stringify(d)) } catch {} }
  const time = next.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const today = next.start.toDateString() === now.toDateString()
  const mins = Math.round(hoursAway * 60)
  const when = live ? 'Live now' : mins < 60 ? `Starts in ${mins} min` : today ? `Today at ${time}` : `Tomorrow at ${time}`
  const coach = next.ev.coach || 'your coach'
  return (
    <div className={`ann ${live ? 'live' : 'soon'}`} role="status">
      <button className="ann-x" onClick={close} aria-label="Dismiss">✕</button>
      <div className="ann-eyebrow">{live ? <><span className="livedot" />{coach} is live</> : '📅 Live class'}</div>
      <b className="ann-title">{live ? `${next.ev.title} is happening right now` : `${next.ev.title} · ${when}`}</b>
      <p className="ann-body open">{live ? `${coach} is on. Jump in, bring your questions and your numbers.` : `${coach} goes live ${when.toLowerCase()}, shown in your time zone. ${next.ev.description ? next.ev.description.split('.')[0] + '.' : ''}`}</p>
      <div className="row" style={{ gap: 10, marginTop: 10 }}>
        {next.ev.join_url ? <a className="btn sm primary" href={next.ev.join_url} target="_blank" rel="noopener">{live ? 'Join now' : 'Get the link'} ↗</a> : <Link className="btn sm primary" to="/schedule" onClick={close}>See schedule</Link>}
        {!live && <button className="btn sm" onClick={close}>Got it</button>}
      </div>
    </div>
  )
}

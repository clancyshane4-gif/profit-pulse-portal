import { useEffect, useMemo, useState } from 'react'
import { loadEvents } from '../lib/data'

const ET = 'America/New_York'
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
// Convert an Eastern "weekday + HH:MM" to a real Date in the viewer's week, then read back local weekday/minutes
export function occurrence(weekStart, ev) {
  const d = new Date(weekStart); d.setDate(d.getDate() + ev.weekday)
  const [h, mi] = ev.start_time.split(':').map(Number)
  // find the UTC instant for that ET wall-clock time
  const guess = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), h, mi))
  const etOffset = (dt) => { const p = new Intl.DateTimeFormat('en-US', { timeZone: ET, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(dt); const o = {}; p.forEach(x => o[x.type] = x.value); return Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour % 24, +o.minute) - dt.getTime() }
  const start = new Date(guess.getTime() - etOffset(guess))
  return { start, end: new Date(start.getTime() + ev.duration_min * 60000) }
}
const fmtTime = d => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export default function Schedule() {
  const [events, setEvents] = useState([]); const [offset, setOffset] = useState(0); const [open, setOpen] = useState(null)
  useEffect(() => { loadEvents().then(setEvents) }, [])
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const weekStart = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay() + offset * 7); return d }, [offset])
  const items = events.map(ev => { const { start, end } = occurrence(weekStart, ev); return { ev, start, end, day: start.getDay(), top: start.getHours() * 60 + start.getMinutes(), len: ev.duration_min } })
  const minH = Math.max(0, Math.min(9, ...items.map(i => Math.floor(i.top / 60)))) ; const maxH = Math.min(24, Math.max(18, ...items.map(i => Math.ceil((i.top + i.len) / 60)) ) + 0)
  const hours = []; for (let h = minH; h < maxH; h++) hours.push(h)
  const PX = 64 // px per hour
  const now = new Date(); const nowTop = (now.getHours() * 60 + now.getMinutes() - minH * 60) / 60 * PX
  const inWeek = now >= weekStart && now < new Date(weekStart.getTime() + 7 * 864e5)
  const fmtRange = () => { const e = new Date(weekStart); e.setDate(e.getDate() + 6); const o = { month: 'short', day: 'numeric' }; return `${weekStart.toLocaleDateString([], o)} – ${e.toLocaleDateString([], { ...o, year: 'numeric' })}` }
  return (
    <section className="page" onClick={() => setOpen(null)}>
      <div className="head"><div><h1>Call Schedule</h1><p>Times shown in your timezone <span className="note">({tz})</span>. Click a call for details and the join link.</p></div>
        <div className="row" style={{ gap: 6 }}><button className="btn sm" onClick={() => setOffset(0)}>This week</button><button className="btn sm" onClick={() => setOffset(o => o - 1)}>‹</button><span className="num" style={{ minWidth: 170, textAlign: 'center', fontWeight: 600 }}>{fmtRange()}</span><button className="btn sm" onClick={() => setOffset(o => o + 1)}>›</button></div></div>
      <div className="cal">
        <div className="cal-head"><div /> {DAYS.map((d, i) => { const dt = new Date(weekStart); dt.setDate(dt.getDate() + i); const today = dt.toDateString() === now.toDateString(); return <div key={d} className={today ? 'today' : ''}><small>{d}</small><b>{dt.getDate()}</b></div> })}</div>
        <div className="cal-body" style={{ height: hours.length * PX }}>
          <div className="cal-hours">{hours.map(h => <div key={h} style={{ height: PX }}><span>{new Date(2000, 0, 1, h).toLocaleTimeString([], { hour: 'numeric' })}</span></div>)}</div>
          {DAYS.map((_, di) => <div key={di} className={`cal-col ${inWeek && now.getDay() === di ? 'today' : ''}`}>
            {hours.map(h => <div key={h} className="cal-line" style={{ top: (h - minH) * PX }} />)}
            {inWeek && now.getDay() === di && <div className="cal-now" style={{ top: nowTop }} />}
            {items.filter(i => i.day === di).map(i => <button key={i.ev.id} className="cal-ev" style={{ top: (i.top - minH * 60) / 60 * PX, height: i.len / 60 * PX - 4, '--c': i.ev.color }} onClick={e => { e.stopPropagation(); setOpen(open?.ev.id === i.ev.id ? null : i) }}>
              <b>{i.ev.title}</b><small>{i.ev.coach}</small><small>{fmtTime(i.start)}</small>
              {open?.ev.id === i.ev.id && <div className="cal-pop" onClick={e => e.stopPropagation()}>
                <b style={{ fontSize: 15 }}>{i.ev.coach} — {i.ev.title}</b>
                <div className="note" style={{ margin: '6px 0' }}>📅 {i.start.toLocaleDateString([], { month: 'short', day: 'numeric' })} &nbsp; 🕐 {fmtTime(i.start)} – {fmtTime(i.end)} · {i.ev.duration_min} min</div>
                <div className="note">Repeats weekly</div>
                <p className="muted" style={{ fontSize: 13, margin: '10px 0' }}>{i.ev.description}</p>
                {i.ev.join_url ? <a className="btn sm primary" href={i.ev.join_url} target="_blank" rel="noopener">Join call ↗</a> : <span className="note">Join link is posted in Discord 15 minutes before.</span>}
              </div>}
            </button>)}
          </div>)}
        </div>
      </div>
      {!events.length && <div className="card" style={{ marginTop: 14 }}><div className="empty"><div className="ic">📅</div><b>No calls scheduled yet</b><span>Admins add them from the Admin panel.</span></div></div>}
    </section>
  )
}

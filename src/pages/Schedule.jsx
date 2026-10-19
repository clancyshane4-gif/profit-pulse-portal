import { useEffect, useMemo, useState } from 'react'
import { loadEvents } from '../lib/data'
import { useApp } from '../App'

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
const MeetIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><rect x="3" y="6" width="12" height="12" rx="2" fill="#00832d"/><path d="M15 10l6-3v10l-6-3z" fill="#0066da"/><rect x="3" y="6" width="6" height="6" fill="#ffba00"/><rect x="3" y="12" width="6" height="6" fill="#e94235"/></svg>
const fmtTime = d => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export default function Schedule() {
  const { settings } = useApp(); const defaultJoin = settings.default_join_url || ''
  const [events, setEvents] = useState([]); const [offset, setOffset] = useState(0); const [open, setOpen] = useState(null)
  useEffect(() => { loadEvents().then(setEvents) }, [])
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const weekStart = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay() + offset * 7); return d }, [offset])
  const items = events.map(ev => { const { start, end } = occurrence(weekStart, ev); return { ev, start, end, day: start.getDay(), top: start.getHours() * 60 + start.getMinutes(), len: ev.duration_min } })
  // noon to 11 PM so the evening calls sit mid-grid (stretches if a call falls outside)
  const minH = Math.max(0, Math.min(12, ...items.map(i => Math.floor(i.top / 60)))); const maxH = Math.min(24, Math.max(23, ...items.map(i => Math.ceil((i.top + i.len) / 60))))
  const hours = []; for (let h = minH; h < maxH; h++) hours.push(h)
  const PX = 44 // px per hour
  const now = new Date(); const nowTop = (now.getHours() * 60 + now.getMinutes() - minH * 60) / 60 * PX
  const inWeek = now >= weekStart && now < new Date(weekStart.getTime() + 7 * 864e5)
  const fmtRange = () => { const e = new Date(weekStart); e.setDate(e.getDate() + 6); const o = { month: 'short', day: 'numeric' }; return `${weekStart.toLocaleDateString([], o)} – ${e.toLocaleDateString([], { ...o, year: 'numeric' })}` }
  return (
    <section className="page" onClick={() => setOpen(null)}>
      <div className="head"><div><h1>Call Schedule</h1><p>Times shown in your timezone <span className="note">({tz})</span>. Click a call for details and the join link.</p></div>
        <div className="row" style={{ gap: 6 }}><button className="btn sm" onClick={() => setOffset(0)}>This week</button><button className="btn sm" onClick={() => setOffset(o => o - 1)}>‹</button><span className="num" style={{ minWidth: 170, textAlign: 'center', fontWeight: 600 }}>{fmtRange()}</span><button className="btn sm" onClick={() => setOffset(o => o + 1)}>›</button></div></div>
      {/* phone view: this week as a list */}
      <div className="agenda">
        {[...items].sort((a, b) => a.start - b.start).map(i => { const past = i.end < now; const live = i.start <= now && i.end > now; const isOpen = open?.ev.id === i.ev.id; return (
          <div key={i.ev.id} className={`ag ${past ? 'past' : ''} ${live ? 'live' : ''}`} style={{ '--c': i.ev.color }} onClick={e => { e.stopPropagation(); setOpen(isOpen ? null : i) }}>
            <div className="ag-day"><small>{DAYS[i.start.getDay()]}</small><b>{i.start.getDate()}</b></div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <b style={{ color: 'var(--c)' }}>{i.ev.title}</b>{live && <span className="pill" style={{ marginLeft: 8, color: '#ff6b6b', borderColor: 'rgba(239,68,68,.4)' }}>Live now</span>}
              <div className="note">{fmtTime(i.start)} – {fmtTime(i.end)} · {i.ev.coach}</div>
              {isOpen && <div style={{ marginTop: 8 }}><p className="muted" style={{ fontSize: 13, margin: '0 0 10px' }}>{i.ev.description}</p>{(i.ev.join_url || defaultJoin) ? <a className="btn sm primary meet" href={i.ev.join_url || defaultJoin} target="_blank" rel="noopener"><MeetIcon /> Join on Google Meet</a> : <span className="note">Google Meet link coming</span>}</div>}
            </div>
            <span className="note" style={{ alignSelf: 'center' }}>{isOpen ? '▴' : '▾'}</span>
          </div>) })}
        {!items.length && <div className="note">No calls this week.</div>}
      </div>
      <div className="cal">
        <div className="cal-head"><div /> {DAYS.map((d, i) => { const dt = new Date(weekStart); dt.setDate(dt.getDate() + i); const today = dt.toDateString() === now.toDateString(); return <div key={d} className={today ? 'today' : ''}><small>{d}</small><b>{dt.getDate()}</b></div> })}</div>
        <div className="cal-body" style={{ height: hours.length * PX }}>
          <div className="cal-hours">{hours.map(h => <div key={h} style={{ height: PX }}><span>{new Date(2000, 0, 1, h).toLocaleTimeString([], { hour: 'numeric' })}</span></div>)}</div>
          {DAYS.map((_, di) => <div key={di} className={`cal-col ${inWeek && now.getDay() === di ? 'today' : ''}`}>
            {hours.map(h => <div key={h} className="cal-line" style={{ top: (h - minH) * PX }} />)}
            {inWeek && now.getDay() === di && <div className="cal-now" style={{ top: nowTop }} />}
            {items.filter(i => i.day === di).map(i => <button key={i.ev.id} className="cal-ev" style={{ top: (i.top - minH * 60) / 60 * PX, height: i.len / 60 * PX - 4, '--c': i.ev.color }} onClick={e => { e.stopPropagation(); setOpen(open?.ev.id === i.ev.id ? null : i) }}>
              <b>{i.ev.title}</b><small>{fmtTime(i.start)} · {i.ev.coach}</small>
              {open?.ev.id === i.ev.id && <div className="cal-pop" onClick={e => e.stopPropagation()}>
                <b style={{ fontSize: 15 }}>{i.ev.coach} — {i.ev.title}</b>
                <div className="note" style={{ margin: '6px 0' }}>📅 {i.start.toLocaleDateString([], { month: 'short', day: 'numeric' })} &nbsp; 🕐 {fmtTime(i.start)} – {fmtTime(i.end)} · {i.ev.duration_min} min</div>
                <div className="note">Repeats weekly</div>
                <p className="muted" style={{ fontSize: 13, margin: '10px 0' }}>{i.ev.description}</p>
                {(i.ev.join_url || defaultJoin) ? <a className="btn sm primary meet" href={i.ev.join_url || defaultJoin} target="_blank" rel="noopener"><MeetIcon /> Join on Google Meet</a> : <button className="btn sm meet" disabled title="Add the Meet link in Admin → Call schedule"><MeetIcon /> Google Meet link coming</button>}
              </div>}
            </button>)}
          </div>)}
        </div>
      </div>
      {!events.length && <div className="card" style={{ marginTop: 14 }}><div className="empty"><div className="ic">📅</div><b>No calls scheduled yet</b><span>Admins add them from the Admin panel.</span></div></div>}
    </section>
  )
}

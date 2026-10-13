import { useApp } from '../App'
export default function Schedule() {
  const { settings } = useApp(); const sched = settings.schedule || []
  return (
    <section className="page">
      <div className="head"><div><h1>Schedule</h1><p>Weekly live calls. All times Eastern; links are posted in Discord 15 minutes before each call.</p></div></div>
      <div className="sched">{sched.map(([d, t, n, b]) => <div key={d + n} className="day"><div className="d">{d}</div><div className="t">{t}</div><b style={{ display: 'block', marginTop: 8 }}>{n}</b><p>{b}</p></div>)}</div>
    </section>
  )
}

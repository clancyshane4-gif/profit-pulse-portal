import { useState } from 'react'
import { useApp } from '../App'
import { iconFor } from '../lib/icons'

export function ResourceIcon({ name, slug, size = 36 }) {
  const ic = iconFor(name, slug)
  return <div className="ic" style={{ width: size, height: size }}>{ic ? <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55}><path d={ic.path} fill={ic.color} /></svg> : <span>{(name || '?')[0]}</span>}</div>
}

export default function Resources() {
  const { settings } = useApp(); const res = settings.resources || []; const [q, setQ] = useState('')
  const list = res.filter(r => !q || r[0].toLowerCase().includes(q.toLowerCase()) || (r[2] || '').toLowerCase().includes(q.toLowerCase()))
  return (
    <section className="page">
      <div className="head"><div><h1>Resources</h1><p>Every tool you'll use in the program, in one place.</p></div></div>
      <input type="text" className="search" placeholder="Search resources" value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 360, marginBottom: 16 }} />
      <div className="res">{list.map(([n, b, cat, u, slug]) => <a key={n} href={u} target="_blank" rel="noopener"><ResourceIcon name={n} slug={slug} /><b>{n}</b><p>{b}</p><span className="pill grey">{cat}</span></a>)}</div>
    </section>
  )
}

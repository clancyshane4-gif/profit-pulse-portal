import { useState } from 'react'
import { useApp } from '../App'
import { iconFor } from '../lib/icons'

const CAT_COLOR = { 'AI & Automation': '#a78bfa', 'Ad Platforms': '#4f8cff', 'CRM & Tracking': '#22e36b', 'Creative': '#ff7ab6', 'Payments': '#f5c652', 'Community': '#3dd6f5' }
const host = u => { try { return new URL(u).hostname } catch { return '' } }
export function ResourceIcon({ name, slug, url, size = 44, color }) {
  const ic = iconFor(name, slug && !/^(https?:\/\/|\/)/.test(slug) ? slug : undefined); const [bad, setBad] = useState(false); const h = host(url)
  const custom = slug && /^(https?:\/\/|\/)/.test(slug) ? slug : ''
  const logo = custom || (h && !bad ? `https://www.google.com/s2/favicons?domain=${h}&sz=128` : '')
  return <div className="ic" style={{ width: size, height: size, color }}>{logo ? <img src={logo} alt="" onError={() => setBad(true)} /> : ic ? <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55}><path d={ic.path} fill={ic.color} /></svg> : <span>{(name || '?')[0]}</span>}</div>
}
export default function Resources() {
  const { settings } = useApp(); const res = settings.resources || []; const [q, setQ] = useState(''); const [cat, setCat] = useState('All')
  const cats = ['All', ...Array.from(new Set(res.map(r => r[2])))]
  const list = res.filter(r => (cat === 'All' || r[2] === cat) && (!q || r[0].toLowerCase().includes(q.toLowerCase()) || (r[1] || '').toLowerCase().includes(q.toLowerCase())))
  return (
    <section className="page">
      <div className="head"><div><h1>Resources</h1><p>Every tool you'll use in the program, in one place.</p></div></div>
      <div className="row" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 16 }}><input type="text" className="search" placeholder="Search resources" value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 320 }} /><div className="tabs" style={{ margin: 0 }}>{cats.map(c => <button key={c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>{c}</button>)}</div></div>
      <div className="res">{list.map(([n, b, c, u, slug]) => { const col = CAT_COLOR[c] || 'var(--green)'; return <a key={n} href={u || undefined} target={u ? '_blank' : undefined} rel="noopener" style={{ '--c': col, cursor: u ? 'pointer' : 'default' }}><ResourceIcon name={n} slug={slug} url={u} color={col} /><b>{n}</b><p>{b}</p><span className="pill" style={{ color: col, borderColor: col + '55', background: col + '18' }}>{c}</span></a> })}</div>
    </section>
  )
}

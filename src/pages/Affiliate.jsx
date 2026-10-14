import { useState } from 'react'
import { useApp } from '../App'

// Paid / low-ticket tools with the bootcamp's affiliate links. Edited in Admin → Affiliate tools.
export default function Affiliate() {
  const { settings } = useApp(); const tools = settings.affiliate_tools || []; const [copied, setCopied] = useState('')
  const copy = async (u) => { try { await navigator.clipboard.writeText(u); setCopied(u); setTimeout(() => setCopied(''), 1500) } catch {} }
  return (
    <section className="page">
      <div className="head"><div><h1>Affiliate Tools</h1><p>The paid tools we use and recommend. Sign up through these links, and share them with clients: every account you bring in pays the bootcamp (and you, once you're an affiliate).</p></div></div>
      {!tools.length && <div className="card"><div className="empty"><div className="ic">🧰</div><b>Nothing here yet</b><span>Admins add tools in Admin → Affiliate tools.</span></div></div>}
      <div className="aff">{tools.map(([n, b, cat, u, price, comm, domain]) => <div key={n} className="tool">
        <div className="row" style={{ gap: 12 }}><div className="ic"><img src={`https://www.google.com/s2/favicons?domain=${domain || (u ? new URL(u).hostname : '')}&sz=128`} alt="" /></div><div style={{ minWidth: 0 }}><b>{n}</b><div className="price">{price}</div></div>{cat && <span className="pill" style={{ marginLeft: 'auto', alignSelf: 'flex-start' }}>{cat}</span>}</div>
        <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>{b}</p>
        {comm && <div className="comm">You earn: {comm}</div>}
        <div className="row" style={{ gap: 8, marginTop: 'auto' }}><a className="btn sm primary" href={u} target="_blank" rel="noopener">Get it ↗</a><button className="btn sm" onClick={() => copy(u)}>{copied === u ? 'Copied' : 'Copy link'}</button></div>
      </div>)}</div>
    </section>
  )
}

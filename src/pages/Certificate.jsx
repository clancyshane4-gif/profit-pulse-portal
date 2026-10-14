import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../App'
import { loadModules, loadMyProgress, loadPhases, markCertified } from '../lib/data'

export default function Certificate() {
  const { user, profile, refreshProfile, isAdmin } = useApp()
  const [ready, setReady] = useState(null); const cv = useRef(null); const [url, setUrl] = useState('')
  useEffect(() => { Promise.all([loadModules(), loadMyProgress(user.id), loadPhases()]).then(([mods, prog, phases]) => { const core = phases.filter(p => p.group_key === 'core').map(p => p.id); const ls = mods.filter(m => core.includes(m.phase_id)); setReady(isAdmin || (ls.length > 0 && ls.every(m => prog[m.id]))) }) }, [user.id])
  useEffect(() => {
    if (!ready || !cv.current) return
    if (!profile.certified_at && !isAdmin) markCertified(user.id).then(refreshProfile)
    const c = cv.current, ctx = c.getContext('2d'); const W = c.width, H = c.height
    const date = new Date(profile.certified_at || Date.now()).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0b1222'); g.addColorStop(1, '#060912'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
    const glow = ctx.createRadialGradient(W * .15, 0, 10, W * .15, 0, 700); glow.addColorStop(0, 'rgba(34,227,107,.25)'); glow.addColorStop(1, 'rgba(34,227,107,0)'); ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = 'rgba(34,227,107,.45)'; ctx.lineWidth = 3; ctx.strokeRect(40, 40, W - 80, H - 80); ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1; ctx.strokeRect(56, 56, W - 112, H - 112)
    const img = new Image(); img.src = '/logo-mark.png'
    const draw = () => {
      try { ctx.drawImage(img, W / 2 - 44, 90, 88, 88) } catch {}
      ctx.textAlign = 'center'; ctx.fillStyle = '#22e36b'; ctx.font = '700 18px Figtree, sans-serif'; ctx.letterSpacing = '6px'; ctx.fillText('PROFIT PULSE AI BOOTCAMP', W / 2, 220); ctx.letterSpacing = '0px'
      ctx.fillStyle = '#8f97ad'; ctx.font = '500 22px Figtree, sans-serif'; ctx.fillText('This certifies that', W / 2, 300)
      ctx.fillStyle = '#eef1f8'; ctx.font = '800 72px "Bricolage Grotesque", sans-serif'; ctx.fillText(profile.name || 'Student', W / 2, 390)
      ctx.fillStyle = '#8f97ad'; ctx.font = '500 22px Figtree, sans-serif'; ctx.fillText('completed all six phases of the bootcamp:', W / 2, 450)
      ctx.fillStyle = '#eef1f8'; ctx.font = '600 20px Figtree, sans-serif'; ctx.fillText('niche & offer, software build, ads & brand, closing and the 30-day launch plan', W / 2, 486)
      ctx.fillStyle = '#22e36b'; ctx.font = '700 20px Figtree, sans-serif'; ctx.fillText(date, W / 2, 570)
      ctx.fillStyle = '#5b6279'; ctx.font = '500 16px Figtree, sans-serif'; ctx.fillText('Jake Sawyer · Founder, Profit Pulse AI Bootcamp', W / 2, 640)
      setUrl(c.toDataURL('image/png'))
    }
    img.onload = draw; img.onerror = draw; if (img.complete) draw()
  }, [ready, profile.name])
  if (ready === null) return <section className="page"><div className="skel" style={{ height: 400 }} /></section>
  if (!ready) return <section className="page"><div className="head"><div><h1>Certificate</h1><p>Finish all six phases to earn your completion certificate.</p></div></div><div className="card"><div className="empty"><div className="ic">🎓</div><b>Not yet</b><span>Complete every lesson in Phases 1 through 6 and your certificate appears here.</span><Link className="btn primary" to="/courses">Back to courses</Link></div></div></section>
  return (
    <section className="page">
      <div className="head"><div><h1>Your certificate</h1><p>Download it and post it. Tag Jakey.</p></div>{url && <a className="btn primary" href={url} download={`profit-pulse-certificate-${(profile.name || 'student').replace(/\s+/g, '-').toLowerCase()}.png`}>Download PNG</a>}</div>
      <div className="card" style={{ padding: 10 }}><canvas ref={cv} width="1400" height="760" style={{ width: '100%', height: 'auto', borderRadius: 12, display: 'block' }} /></div>
    </section>
  )
}

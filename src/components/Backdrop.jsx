import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Page atmosphere: drifting aurora fields, a fine dot grid, a pulse line across the top (the logo, alive),
// and a per-page tint so each section has its own color. All CSS; nothing here costs the page anything.
const G = '34,227,107', V = '167,139,250', B = '79,140,255'
const TINT = { '/': V, '/map': V, '/recordings': B, '/leaderboard': B, '/challenge': B, '/resources': B, '/courses': G, '/schedule': G, '/achievements': G, '/affiliate': G, '/onboarding': G, '/admin': G, '/rep': G }
export default function Backdrop() {
  const { pathname } = useLocation()
  const key = '/' + (pathname.split('/')[1] || '')
  useEffect(() => { document.documentElement.style.setProperty('--tint', TINT[key] || '34,227,107') }, [key])
  return (
    <div className="backdrop" aria-hidden>
      <div className="aurora a1" /><div className="aurora a2" /><div className="aurora a3" />
      <div className="grid-dots" />
      <svg className="pulse" viewBox="0 0 1200 60" preserveAspectRatio="none">
        <path d="M0 30 H220 l10 0 8 -14 8 28 8 -22 8 8 H520 l8 -8 8 22 8 -30 8 16 H860 l8 -10 8 18 8 -24 8 16 H1200" fill="none" stroke="rgb(var(--tint))" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="vignette" />
    </div>
  )
}

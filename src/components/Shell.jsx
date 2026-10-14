import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import OnboardingGate from '../pages/OnboardingGate'
import { supabase } from '../lib/supabase'
import { useApp } from '../App'
import Avatar from './Avatar'

const ICON = {
  dashboard: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  courses: 'M4 5h7a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-7a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h7z',
  schedule: 'M4 5h16v15H4zM4 10h16M8 3v4M16 3v4',
  recordings: 'M3 7h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3zM15 10l6-3v10l-6-3',
  challenge: 'M8 4h8v3a4 4 0 0 1-8 0zM6 5H4a3 3 0 0 0 3 4M18 5h2a3 3 0 0 1-3 4M12 11v4M9 20h6M12 15v5',
  leaderboard: 'M4 20h4v-7H4zM10 20h4V8h-4zM16 20h4v-4h-4z',
  map: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14',
  achievements: 'M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2l.9-5.5-4-3.9 5.5-.8z',
  resources: 'M4 7h16v12H4zM4 7l2-3h12l2 3M9 12h6',
  onboarding: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  admin: 'M3 20a7 7 0 0 1 14 0M10 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM16 4l4 2-4 2',
  affiliate: 'M4 7h16v12H4zM4 11h16M12 7v12M8 7V5a2 2 0 0 1 4 0M12 5a2 2 0 0 1 4 0v2',
  rep: 'M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM4 21a8 8 0 0 1 16 0M19 8l2 2 4-4',
}
const NAV = [
  ['/', 'Dashboard', 'dashboard'], ['/courses', 'Courses', 'courses'], ['/recordings', 'Recordings', 'recordings'], ['/schedule', 'Schedule', 'schedule'],
  ['/challenge', 'Challenge', 'challenge'], ['/leaderboard', 'Leaderboard', 'leaderboard'], ['/map', 'Map', 'map'],
  ['/achievements', 'Achievements', 'achievements'], ['/resources', 'Resources', 'resources'], ['/affiliate', 'Affiliate Tools', 'affiliate'],
]

export default function Shell({ children }) {
  const { profile, isAdmin, isStaff, settings, realAdmin, previewStudent, togglePreview } = useApp()
  const nav = useNavigate(); const loc = useLocation()
  const items = [...NAV, ...(isStaff ? [['/onboarding', 'Onboarding', 'onboarding'], ['/rep', 'Rep panel', 'rep']] : []), ...(isAdmin ? [['/admin', 'Admin', 'admin']] : [])]
  const [editMe, setEditMe] = useState(false)
  const Brand = () => (
    <div className="brand"><div className="mark"><img src="/logo-mark.png" alt="" /></div><div><b>Profit Pulse AI</b><small>Student Portal</small></div></div>
  )
  return (
    <div className="shell">
      <aside className="rail">
        <Brand />
        <nav className="nav">
          {items.map(([to, label, ic]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => undefined} aria-current={loc.pathname === to || (to !== '/' && loc.pathname.startsWith(to)) ? 'page' : undefined}>
              <svg viewBox="0 0 24 24"><path d={ICON[ic]} /></svg>{label}
            </NavLink>
          ))}
        </nav>
        {realAdmin && <button className={`preview-toggle ${previewStudent ? 'on' : ''}`} onClick={togglePreview} title="See the portal exactly as a student does: locks, hidden phases, no admin tabs">{previewStudent ? '👁 Viewing as student · switch back' : '👁 View as student'}</button>}
        {editMe && <OnboardingGate edit onClose={() => setEditMe(false)} />}
        <div className="me">
          <button className="avatar-btn" title="Edit your photo and profile" onClick={() => setEditMe(true)}><Avatar name={profile.name} url={profile.photo_url} /></button>
          <div style={{ minWidth: 0, flex: 1 }}><b>{profile.name || 'Member'}</b><small>{{ student: 'Student', setter: 'Rep', coach: 'Coach', admin: 'Admin' }[profile.role] || profile.role}</small></div>
          <button className="btn sm" title="Sign out" style={{ padding: '6px 8px' }} onClick={() => supabase.auth.signOut()}>Out</button>
        </div>
      </aside>
      <main className="main">
        <div className="topbar">
          <div className="brand" style={{ padding: 0 }}><div className="mark"><img src="/logo-mark.png" alt="" /></div><div><b>Profit Pulse AI</b><small>Student Portal</small></div></div>
          <select aria-label="Go to page" value={items.find(i => i[0] === loc.pathname)?.[0] || '/'} onChange={e => nav(e.target.value)}>
            {items.map(([to, label]) => <option key={to} value={to}>{label}</option>)}
          </select>
        </div>
        {children}
      </main>
    </div>
  )
}

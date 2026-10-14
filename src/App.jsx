import { useEffect, useState, createContext, useContext, useCallback } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { loadMyProfile, loadSettings } from './lib/data'
import Shell from './components/Shell'
import Announcement from './components/Announcement'
import ApprovalPop from './components/ApprovalPop'
import Login from './pages/Login'
import SetPassword from './pages/SetPassword'
import OnboardingGate from './pages/OnboardingGate'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import Phase from './pages/Phase'
import Recordings from './pages/Recordings'
import Certificate from './pages/Certificate'
import Leaderboard from './pages/Leaderboard'
import Challenge from './pages/Challenge'
import MemberMap from './pages/MemberMap'
import Achievements from './pages/Achievements'
import Resources from './pages/Resources'
import Schedule from './pages/Schedule'
import Onboarding from './pages/Onboarding'
import Admin from './pages/Admin'
import Rep from './pages/Rep'
import ChangePassword from './pages/ChangePassword'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [profile, setProfile] = useState(null)
  const [settings, setSettings] = useState({})
  const [recovery, setRecovery] = useState(false)
  const [previewStudent, setPreviewStudent] = useState(() => { try { return sessionStorage.getItem('pp_preview') === '1' } catch { return false } })
  const togglePreview = () => { const v = !previewStudent; setPreviewStudent(v); try { sessionStorage.setItem('pp_preview', v ? '1' : '0') } catch {} }
  const location = useLocation()

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return
    setProfile(await loadMyProfile(session.user.id))
  }, [session])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) { setProfile(null); return }
    let alive = true
    Promise.all([loadMyProfile(session.user.id), loadSettings()]).then(([p, s]) => { if (alive) { setProfile(p); setSettings(s) } })
    return () => { alive = false }
  }, [session?.user?.id])

  if (session === undefined) return <div className="center"><span className="note">Loading…</span></div>

  // invite / recovery links land here with a token in the URL hash
  const onSetPassword = location.pathname === '/set-password'
  if (onSetPassword || recovery) return <SetPassword onDone={() => setRecovery(false)} />

  if (!session) return <Login />
  if (!profile) return <div className="center"><span className="note">Loading your profile…</span></div>
  if (profile.active === false) return <div className="center"><div className="card" style={{ maxWidth: 420 }}><b>This account is disabled.</b><p className="muted">Message your coach in Discord if you think that's a mistake.</p><button className="btn" onClick={() => supabase.auth.signOut()}>Sign out</button></div></div>

  const realAdmin = profile.role === 'admin' || profile.role === 'coach'
  const isAdmin = realAdmin && !previewStudent
  const isStaff = (isAdmin || profile.role === 'setter') && !previewStudent
  const ctx = { session, user: session.user, profile, setProfile, refreshProfile, settings, isAdmin, isStaff, realAdmin, previewStudent, togglePreview }
  if (profile.must_change_password) return <Ctx.Provider value={ctx}><ChangePassword /></Ctx.Provider>

  return (
    <Ctx.Provider value={ctx}>
      {!profile.onboarded && <OnboardingGate />}
      {profile.onboarded && <Announcement />}
      {profile.onboarded && <ApprovalPop />}
      <Shell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<Phase />} />
          <Route path="/recordings" element={<Recordings />} />
          <Route path="/certificate" element={<Certificate />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/challenge" element={<Challenge />} />
          <Route path="/map" element={<MemberMap />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/onboarding" element={<Onboarding />} />
          {isStaff && <Route path="/rep" element={<Rep />} />}
          {isAdmin && <Route path="/admin" element={<Admin />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </Ctx.Provider>
  )
}

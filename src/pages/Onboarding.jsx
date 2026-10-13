import { useState } from 'react'
import { useApp } from '../App'
import OnboardingGate from './OnboardingGate'
import Avatar from '../components/Avatar'
export default function Onboarding() {
  const { profile, settings } = useApp(); const steps = settings.onboarding_steps || []; const [edit, setEdit] = useState(false)
  return (
    <section className="page">
      {edit && <OnboardingGate edit onClose={() => setEdit(false)} />}
      <div className="head"><div><h1>Onboarding</h1><p>Your first week, in order.</p></div></div>
      <div className="list">{steps.map(([t, b], i) => <div key={t} className="card row" style={{ gap: 14 }}><div className="lesson" style={{ padding: 0, width: 'auto' }}><span className="n">{i + 1}</span></div><div><b>{t}</b><div className="muted" style={{ fontSize: 13 }}>{b}</div></div></div>)}</div>
      <div className="card" style={{ marginTop: 14 }}><b>Your profile</b>
        <div className="row" style={{ marginTop: 12, gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Avatar name={profile.name} url={profile.photo_url} size={72} />
          <div style={{ flex: 1, minWidth: 220 }}><b>{profile.name}</b>
            <div className="note" style={{ marginTop: 4 }}>{profile.email}<br />{profile.city}{profile.discord ? ` · Discord @${profile.discord}` : ''}</div>
            <button className="btn sm" style={{ marginTop: 10 }} onClick={() => setEdit(true)}>Edit photo or details</button></div>
        </div></div>
    </section>
  )
}

import { useState } from 'react'
import { useApp } from '../App'
import { fileToSquareBlob, uploadAvatar, saveMyProfile, bumpActivity } from '../lib/data'
import { lookupIP } from '../lib/geoip'
import { useEffect } from 'react'
import Avatar from '../components/Avatar'


export default function OnboardingGate({ edit, onClose }) {
  const { user, profile, refreshProfile } = useApp()
  const [name, setName] = useState(profile.name || ''); const [city, setCity] = useState(profile.city || ''); const [discord, setDiscord] = useState(profile.discord || '')
  const [blob, setBlob] = useState(null); const [preview, setPreview] = useState(profile.photo_url || '')
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const [geo, setGeo] = useState(profile.lat != null ? { lat: profile.lat, lng: profile.lng, city: profile.city } : null)
  useEffect(() => { if (!edit && !city) lookupIP().then(g => { if (g) { setGeo(g); setCity(c => c || g.city) } }) }, [])

  async function pick(e) {
    const f = e.target.files[0]; if (!f) return
    try { const b = await fileToSquareBlob(f); setBlob(b); setPreview(URL.createObjectURL(b)); setErr('') }
    catch { setErr("That file didn't open as an image. Try a JPG or PNG.") }
  }
  async function finish() {
    if (!preview) { setErr('Add a photo to continue.'); return }
    setBusy(true); setErr('')
    try {
      let photo_url = profile.photo_url || ''
      if (blob) photo_url = await uploadAvatar(user.id, blob)
      const loc = geo && geo.city === city.trim() ? { lat: geo.lat, lng: geo.lng } : {}
      await saveMyProfile(user.id, { ...loc, name: (name || profile.name || '').trim(), city: city.trim(), discord: discord.trim().replace(/^@/, ''), photo_url, onboarded: true })
      if (!profile.onboarded) await bumpActivity(user.id, 0)
      await refreshProfile(); onClose?.()
    } catch (e) { setErr(e.message || 'Could not save. Try again.') }
    setBusy(false)
  }
  return (
    <div className={`gate ${edit ? '' : 'onboard'}`}>
      <div className="box">
        <div className="eyebrow">{edit ? 'Your profile' : 'Welcome to Profit Pulse AI'}</div>
        <h2>{edit ? 'Edit your profile' : `Hey ${(profile.name || '').split(' ')[0] || 'there'}, add your photo.`}</h2>
        <p className="muted" style={{ margin: '0 0 18px' }}>Your photo shows on the leaderboard and the member map. The portal unlocks as soon as it's in.</p>
        <div>
          <label className="drop" htmlFor="photoInput"><Avatar name={name} url={preview} size={112} /><b>{preview ? 'Change photo' : 'Choose a photo'}</b><span className="note">JPG or PNG. We crop it to a square for you.</span></label>
          <input type="file" id="photoInput" accept="image/*" hidden onChange={pick} />
          {edit && <div style={{ marginTop: 14 }}><label className="f" htmlFor="nameInput">Your name</label><input id="nameInput" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="First and last name" autoComplete="name" /></div>}
          <div className="grid g2" style={{ gap: 10, marginTop: 12 }}>
            <div><label className="f" htmlFor="cityInput">City, State (for the map)</label><input id="cityInput" type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Tampa, FL" /><div className="note" style={{ marginTop: 4 }}>{geo && geo.city === city ? "Found from your connection. Fix it if it's off." : ""}</div></div>
            <div><label className="f" htmlFor="discordInput">Discord username</label><input id="discordInput" type="text" value={discord} onChange={e => setDiscord(e.target.value)} placeholder="e.g. jakey_closes" autoComplete="off" /></div>
          </div>
          <div className="err">{err}</div>
          <div className="actions">{edit ? <button className="btn" type="button" onClick={onClose}>Cancel</button> : <span />}<button className="btn primary" type="button" disabled={busy} onClick={finish}>{busy ? 'Saving…' : edit ? 'Save' : 'Enter the portal'}</button></div>
        </div>
      </div>
    </div>
  )
}

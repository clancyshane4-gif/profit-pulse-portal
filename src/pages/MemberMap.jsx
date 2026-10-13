import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { loadLeaderboard } from '../lib/data'
import { geoOf } from '../lib/geo'

export default function MemberMap() {
  const [members, setMembers] = useState([]); const el = useRef(null); const map = useRef(null)
  useEffect(() => { loadLeaderboard().then(setMembers) }, [])
  useEffect(() => {
    if (!el.current) return
    if (!map.current) {
      map.current = L.map(el.current, { center: [37.5, -96], zoom: 4, minZoom: 2, scrollWheelZoom: false, attributionControl: true })
      const mb = import.meta.env.VITE_MAPBOX_TOKEN
      if (mb) L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}{r}?access_token=${mb}`, { tileSize: 512, zoomOffset: -1, attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19 }).addTo(map.current)
      else L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19, className: 'osm-dark' }).addTo(map.current)
    }
    const m = map.current; const layer = L.layerGroup().addTo(m); const pts = []
    members.forEach(x => {
      const g = (typeof x.lat === 'number' && typeof x.lng === 'number') ? [x.lat, x.lng] : geoOf(x.city)
      if (!g) return; pts.push(g)
      L.circleMarker(g, { radius: 7, color: '#07130a', weight: 1.5, fillColor: '#22e36b', fillOpacity: 0.95 }).bindTooltip(`${x.name}${x.city ? ' · ' + x.city : ''}`).addTo(layer)
      L.circleMarker(g, { radius: 16, stroke: false, fillColor: '#22e36b', fillOpacity: 0.18 }).addTo(layer)
    })
    if (pts.length > 1) m.fitBounds(L.latLngBounds(pts).pad(0.25), { maxZoom: 6 })
    return () => { layer.remove() }
  }, [members])
  const counts = {}; members.forEach(m => { const c = (m.city || '').trim(); if (c) counts[c] = (counts[c] || 0) + 1 })
  const list = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return (
    <section className="page">
      <div className="head"><div><h1>Member Map</h1><p>{members.length} member{members.length === 1 ? '' : 's'} across {list.length} cit{list.length === 1 ? 'y' : 'ies'}. Pins come from each member's location when they joined.</p></div></div>
      <div className="mapwrap"><div ref={el} style={{ height: 520, width: '100%' }} /></div>
      <div className="cities">{list.map(([c, n]) => <div key={c} className="city"><span>{c}</span><b className="num">{n}</b></div>)}</div>
    </section>
  )
}

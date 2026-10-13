// Tracks how many seconds of a video have actually played (not the playhead), for YouTube and Vimeo embeds.
// onTick(secondsPlayed, duration) fires about once a second while playing. Returns a cleanup function.
let ytReady, vimeoReady
function loadScript(src, check) {
  return new Promise(res => { if (check()) return res(); const s = document.createElement('script'); s.src = src; s.onload = () => { const t = setInterval(() => { if (check()) { clearInterval(t); res() } }, 100) }; document.head.appendChild(s) })
}
export function kindOf(url) {
  if (/youtube\.com\/embed\//.test(url)) return 'youtube'
  if (/player\.vimeo\.com\/video\//.test(url)) return 'vimeo'
  return 'other'
}
export function embedUrl(url) {
  const k = kindOf(url)
  if (k === 'youtube') { const u = new URL(url); u.searchParams.set('enablejsapi', '1'); u.searchParams.set('origin', location.origin); u.searchParams.set('rel', '0'); u.searchParams.set('modestbranding', '1'); return u.toString() }
  return url
}
export function attachTracker(iframe, url, onTick) {
  const k = kindOf(url); let played = 0, duration = 0, timer = null, dead = false
  const tick = () => { played += 1; onTick(played, duration) }
  if (k === 'youtube') {
    ytReady ||= loadScript('https://www.youtube.com/iframe_api', () => window.YT && window.YT.Player)
    let player
    ytReady.then(() => { if (dead) return
      player = new window.YT.Player(iframe, { events: {
        onReady: e => { duration = Math.round(e.target.getDuration() || 0); onTick(played, duration) },
        onStateChange: e => { if (e.data === 1) { duration = Math.round(e.target.getDuration() || duration); if (!timer) timer = setInterval(tick, 1000) } else if (timer) { clearInterval(timer); timer = null } }
      } }) })
    return () => { dead = true; if (timer) clearInterval(timer); try { player && player.destroy() } catch {} }
  }
  if (k === 'vimeo') {
    vimeoReady ||= loadScript('https://player.vimeo.com/api/player.js', () => window.Vimeo && window.Vimeo.Player)
    let player
    vimeoReady.then(() => { if (dead) return
      player = new window.Vimeo.Player(iframe)
      player.getDuration().then(d => { duration = Math.round(d || 0); onTick(played, duration) })
      player.on('play', () => { if (!timer) timer = setInterval(tick, 1000) })
      player.on('pause', () => { if (timer) { clearInterval(timer); timer = null } })
      player.on('ended', () => { if (timer) { clearInterval(timer); timer = null } })
    })
    return () => { dead = true; if (timer) clearInterval(timer); try { player && player.unload() } catch {} }
  }
  // Loom / Bunny / other: no play events available, so count time with the page visible
  timer = setInterval(() => { if (!document.hidden) tick() }, 1000)
  return () => { dead = true; clearInterval(timer) }
}

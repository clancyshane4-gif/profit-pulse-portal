const P = {
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.3 1 2.5h6c0-1.2.4-1.9 1-2.5A6 6 0 0 0 12 3z',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  monitor: 'M3 5h18v11H3zM8 21h8M12 16v5',
  megaphone: 'M3 10v4h3l7 4V6l-7 4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11',
  dollar: 'M12 2v20M17 6.5c0-1.9-2.2-3-5-3s-5 1.1-5 3 2.2 3 5 3 5 1.1 5 3-2.2 3-5 3-5-1.1-5-3',
  chart: 'M4 20h16M6 16v-5M11 16V8M16 16v-9M21 16V4',
  star: 'M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2l.9-5.5-4-3.9 5.5-.8z',
  play: 'M8 5v14l11-7z', users: 'M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM4 21a8 8 0 0 1 16 0', rocket: 'M5 19l4-4M14 4c3 0 6 3 6 6l-6 6-4-4 4-8zM9 12l-4 1 3 3 1-4',
  check: 'M5 13l4 4L19 7', lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4', quiz: 'M9 9a3 3 0 1 1 4 2.8c-.6.3-1 .9-1 1.6V15M12 18h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  video: 'M3 7h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3zM15 10l6-3v10l-6-3', calendar: 'M4 5h16v15H4zM4 10h16M8 3v4M16 3v4', external: 'M14 4h6v6M20 4l-9 9M19 14v6H5V6h6',
}
export default function Icon({ name, size = 18, color = 'currentColor', style }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}><path d={P[name] || P.play} /></svg>
}

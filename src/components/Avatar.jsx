import { initials } from '../lib/data'
export default function Avatar({ name, url, size, className = '' }) {
  const style = size ? { width: size, height: size, fontSize: size / 2.6 } : undefined
  return <div className={`avatar ${className}`} style={style}>{url ? <img src={url} alt="" /> : initials(name)}</div>
}

// Runs every hour; posts the day's tip when the Eastern hour matches Admin → Announcements → Daily tip.
import { postNextTip } from './lib/tip.mjs'
export default async () => { const r = await postNextTip(); console.log(JSON.stringify(r)); return new Response(JSON.stringify(r), { headers: { 'content-type': 'application/json' } }) }
export const config = { schedule: '5 * * * *' }

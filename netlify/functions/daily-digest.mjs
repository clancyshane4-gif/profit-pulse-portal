// Runs every day at 22:00 UTC (6pm ET during daylight time, 5pm ET in winter).
import { runDigest } from './lib/digest.mjs'
export default async () => { const r = await runDigest(); console.log(JSON.stringify(r)); return new Response(JSON.stringify(r), { headers: { 'content-type': 'application/json' } }) }
export const config = { schedule: '0 22 * * *' }

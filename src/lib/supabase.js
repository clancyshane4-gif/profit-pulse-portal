import { createClient } from '@supabase/supabase-js'
import { createDemoClient } from './demo'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
export const DEMO = import.meta.env.VITE_DEMO === '1' || (!url && !key)
if (DEMO) console.info('Profit Pulse portal: running in demo mode with example data (set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY for the real thing)')

export const supabase = DEMO ? createDemoClient() : createClient(url, key)

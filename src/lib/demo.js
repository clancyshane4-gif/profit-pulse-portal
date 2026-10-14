// Demo backend: a fake Supabase client backed by in-memory example data.
// Enabled with VITE_DEMO=1. Lets you preview every page without a Supabase project.
// Everything here is example data, nothing persists past a reload.

const PH = {m01:'p1',m00:'p1',m02:'p2',m03:'p3',m04:'p3',m06:'p3',m05:'p4',m07:'p4',m08:'p5',m09:'p6',m10:'pb',m11:'pb',m12:'pb'}
const SEED_MODULES = [
  ['m01', 1, 'core', 'Phase 1 · Start here', 'Watch Before Starting', 'How the bootcamp works and what to do first.', '/img/m01.jpg', 3, 1],
  ['m00', 2, 'core', 'Phase 1 · Start here', 'Base44 Tools / Setup', 'Set up the AI tool everything in the bootcamp is built on.', '', 8, 3],
  ['m02', 3, 'core', 'Phase 2 · Offer', 'Picking The Right Niche & Offer', 'Choose a niche with money and pain, and shape an offer businesses say yes to.', '/img/m02.jpg', 9, 3],
  ['m03', 4, 'core', 'Phase 3 · Build', 'Building Your Personal / Client Dashboard', 'Build a working CRM dashboard you can run your own business on and resell to clients.', '/img/m03.jpg', 11, 3],
  ['m04', 5, 'core', 'Phase 3 · Build', 'Creating & Selling AI Websites', 'Launch client websites with AI and package them as a service.', '/img/m04.jpg', 10, 3],
  ['m06', 6, 'core', 'Phase 3 · Build', 'AI Super Agents', 'Deploy agents that do outreach and qualify leads while you sleep.', '/img/m06.jpg', 6, 2],
  ['m05', 7, 'core', 'Phase 4 · Grow', 'Full AI Ad Scripting / Creatives / Set Up', 'Write, produce and launch full ad campaigns for clients using AI.', '/img/m05.jpg', 9, 3],
  ['m07', 8, 'core', 'Phase 4 · Grow', 'Starting Your Personal Brand', 'Become the person businesses already trust before you ever pitch.', '/img/m07.jpg', 7, 2],
  ['m08', 9, 'core', 'Phase 5 · Close', 'Closing Your First Deal', 'The scripts, pricing model and Stripe + GHL setup to sign and bill your first client.', '/img/m08.jpg', 31, 8],
  ['m09', 10, 'core', 'Phase 6 · Scale', 'Time To Scale (30 Day Launch Plan)', 'A day-by-day plan to go from portfolio to paying clients in your first month.', '/img/m09.jpg', 2, 1],
  ['m10', 11, 'bonus', 'Case study', 'He Went From $0-$10K In 6 Months With AI Agency', 'A student walks through his first six months.', '/img/m10.jpg', 10, 3],
  ['m11', 12, 'bonus', 'Case study', 'He Went From $0-$25K In 3 Months With AI Agency', 'A student walks through his first three months.', '/img/m11.jpg', 15, 5],
  ['m12', 13, 'bonus', 'Live call', 'Full Masterclass (Live Call)', 'The full live masterclass recording with Jakey.', '/img/m12.jpg', 37, 8],
].map(([id, sort, group_key, phase, title, description, cover_url, minutes, points]) => ({ id, sort, group_key, phase, title, description, cover_url, minutes, points, video_url: '', external_url: 'https://www.skool.com/profit-pulse-ai-bootcamp-5273', resources: id === 'm03' ? [{ title: 'Custom Dashboard Prompts', url: '#' }] : [], published: true, phase_id: PH[id], kind: 'video', quiz: [], pass_pct: 80 }))

const ACH = [['niche', 'Pick a niche', 5, 'implement'], ['offer', 'Write your offer', 5, 'implement'], ['dashboard', 'Build your client dashboard', 10, 'implement'], ['website', 'Launch an AI website', 10, 'implement'], ['agent', 'Set up a super agent', 10, 'implement'], ['adaccount', 'Set up an ad account', 10, 'implement'], ['proposal', 'Build a client proposal', 10, 'implement'], ['out50', 'Do 50 outreaches', 10, 'implement'], ['out100', 'Do 100 outreaches', 15, 'implement'], ['out200', 'Do 200+ outreaches', 25, 'implement'], ['call', 'Book a sales call', 20, 'implement'], ['client', 'Sign your first client', 40, 'revenue'], ['firstdollar', 'First dollar earned', 60, 'revenue'], ['k1', 'Hit $1,000 earned', 100, 'revenue'], ['k5', 'Hit $5,000 earned', 200, 'revenue'], ['k10', 'Hit $10,000 earned', 300, 'revenue']]
  .map(([key, title, points, category], i) => ({ key, sort: i + 1, title, how: key.startsWith('out') ? 'Logged automatically from your outreach counter.' : 'Share a link or screenshot as proof.', points, category, icon: { niche: '🎯', offer: '📝', dashboard: '📊', website: '🌐', agent: '🤖', adaccount: '📣', proposal: '📑', out50: '✉️', out100: '📨', out200: '📬', call: '📞', client: '🤝', firstdollar: '💵', k1: '💰', k5: '💎', k10: '🏆' }[key], auto_metric: key.startsWith('out') ? 'outreach' : '', auto_threshold: { out50: 50, out100: 100, out200: 200 }[key] || 0 }))

import TIPS from '../../supabase/tips.json'
const SETTINGS = {
  auto_tip: { enabled: true, hour_et: 9 },
  support: { email: 'support@aiprofitpulse.com', auto_reply: 'Got it. A coach reads every message and replies here (and to your email) within 24 hours, usually much faster. If it is urgent, email support@aiprofitpulse.com.', hours: 'Mon–Fri, 9am–6pm ET' },
  affiliate_tools: [["Base44", "The AI builder every dashboard, site and agent in the bootcamp runs on. Students and clients both need an account.", "Builder", "https://base44.com", "From $20/mo", "", "base44.com"], ["GoHighLevel", "CRM, pipelines, calendars and invoicing for your clients. White-label it as your own software.", "CRM", "https://www.gohighlevel.com", "From $97/mo", "", "gohighlevel.com"], ["Hyros", "Ad tracking and attribution for clients who run ads. The upsell once campaigns are live.", "Tracking", "https://hyros.com", "From $99/mo", "", "hyros.com"], ["Loom", "Video DMs and client walkthroughs. The outreach channel that gets replies.", "Outreach", "https://www.loom.com", "Free / $15/mo", "", "loom.com"], ["Canva Pro", "Creatives, proposals and client mockups in minutes.", "Creative", "https://www.canva.com", "$15/mo", "", "canva.com"], ["Closing Script SOP", "The exact 20-minute discovery-to-close script Jakey's team uses, with objection handling. Google Doc, copy it and make it yours.", "", "https://docs.google.com", "$29.99 one time", "", "/img/gdoc.svg"], ["Cold Outreach SOP", "DM, email and walk-in scripts by niche, plus the 5-touch follow-up sequence. Google Doc.", "", "https://docs.google.com", "$29.99 one time", "", "/img/gdoc.svg"]],
  challenge: {"eyebrow": "Q4 Challenge", "title": "3-Day Arizona Mastermind", "description": "Earn points by learning, building and getting results. The ten members with the most points at the end of Q4 fly out for three days in Arizona with Jakey and the coaching team.", "ends_at": "2026-12-31T23:59:00-05:00", "ends_label": "Challenge ends December 31, 2026 \u00b7 11:59 PM ET", "prizes": [["3 days in Arizona", "In-person mastermind with Jakey and the coaches: builds, pitches and ad accounts, live."], ["Private dinner", "Dinner with Jakey, the coaches and the other nine."], ["Client hand-off", "Jakey's team hands each winner a warm lead to pitch."]]},
  schedule: [['Monday', '5:00 PM ET', 'AI Integration · Coach Adriel', 'Setting up and running AI agents inside your business.'], ['Wednesday', '6:00 PM ET', 'Lead Gen · Coach Adriel', 'Outreach, lead scraping and booking calls.'], ['Friday', '7:00 PM ET', 'Media Buying · Coach Adriel', 'Campaigns, creatives and reading ad data.'], ['Saturday', '2:00 PM ET', 'Q&A with Jake', 'Bring your builds, replies and stuck points.'], ['Weekly', 'Time TBD', 'Sales Training · Jake', "Jake's second call each week. Time posted in Discord."]],
  tiers: [['Rookie',50,'#8f97ad'],['Builder',150,'#f5c652'],['Operator',350,'#22e36b'],['Closer',650,'#3dd6f5'],['Rainmaker',1000,'#a78bfa'],['Mogul',1500,'#f5c652'],['Empire',3000,'#ff8a5c']],
  resources: [["Base44", "AI app builder \u2014 frontend, backend, database, and hosting in one. Used in every build in the bootcamp.", "AI & Automation", "https://base44.com"], ["Apify", "The scraping engine behind your lead scraper. Pulls real local businesses, reviews and contact info.", "AI & Automation", "https://apify.com"], ["Claude", "Anthropic's AI assistant. Used throughout the program for research, writing and analysis.", "AI & Automation", "https://claude.ai"], ["ChatGPT", "OpenAI's assistant. Pair with Claude for writing, analysis, and creative drafts.", "AI & Automation", "https://chatgpt.com"], ["Wispr Flow", "Voice-to-text on steroids. Dictate three times faster than you type.", "AI & Automation", "https://wisprflow.ai"], ["n8n", "Self-hostable automation platform. Connect APIs and build agent workflows.", "AI & Automation", "https://n8n.io"], ["Meta Business Manager", "The home base for running Meta ads. Covered in Phase 4.", "Ad Platforms", "https://business.facebook.com"], ["Google Ads", "Run search, display, and performance max campaigns. Covered in Phase 4.", "Ad Platforms", "https://ads.google.com", "/img/google-ads.png"], ["Meta Ads Library", "Search live and past Meta ads for any brand or page \u2014 competitor research.", "Ad Platforms", "https://www.facebook.com/ads/library"], ["TikTok Creative Center", "Trending TikTok ads, top-performing creatives, and music/hashtag insights.", "Ad Platforms", "https://ads.tiktok.com/business/creativecenter"], ["Google Ads Transparency Center", "Search any advertiser's live Google Ads \u2014 see what competitors are running.", "Ad Platforms", "https://adstransparency.google.com", "/img/google-ads.png"], ["GoHighLevel", "All-in-one CRM, pipelines and invoicing for your clients. Covered in Phase 5.", "CRM & Tracking", "https://www.gohighlevel.com"], ["Hyros", "Server-side ad tracking and attribution. Standard for high-ticket.", "CRM & Tracking", "https://hyros.com"], ["Loom", "Record quick video walkthroughs for clients and prospects.", "CRM & Tracking", "https://www.loom.com"], ["Canva", "Fast creative and graphic design. Proposals, ads and mockups.", "Creative", "https://www.canva.com"], ["Stripe", "Payment processing for client invoicing. The default for most offers.", "Payments", "https://stripe.com"], ["Wise", "International payments with low fees. Useful for foreign clients.", "Payments", "https://wise.com"], ["Square", "Payments, invoices and POS. For B2B invoice flows and non-Stripe clients.", "Payments", "https://squareup.com"], ["Discord", "The community. Calls, wins and questions.", "Community", "https://discord.com"]],
  onboarding_steps: [['Book your onboarding call', 'Your coach sets you up on the tool live and builds your roadmap.'], ['Join the Discord', 'Introduce yourself in #introductions with your niche.'], ['Add your photo and answer two questions', 'Done in this portal. Coach Adriel reads your answers before the call.'], ['Finish Phase 1', 'Watch Before Starting, then get set up on Base44 with your coach.'], ["Show up to Saturday's Q&A with Jake", '2 PM ET. Bring one question. Attendance earns daily activity points.']],
}

const ME = 'demo-me'
const PEOPLE = [
  ['demo-me', 'Aiden Thomas', 'Tampa, FL', 27.95, -82.46, 'admin'], ['u2', 'Marcus Reed', 'Houston, TX', 29.76, -95.37], ['s1', 'Benny Setter', 'Tampa, FL', 27.95, -82.46, 'setter'], ['u3', 'Dani Alvarez', 'Phoenix, AZ', 33.45, -112.07], ['u4', 'Jordan Pike', 'Columbus, OH', 39.96, -83.0],
  ['u5', 'Tanner Brooks', 'Brooklyn, NY', 40.68, -73.94], ['u6', 'Arthur Yakubov', 'Charlotte, NC', 35.23, -80.84], ['u7', 'Chris Lalonde', 'Miami, FL', 25.76, -80.19], ['u8', 'Preston O\'Neil', 'Denver, CO', 39.74, -104.99],
  ['u9', 'Sofia Martin', 'San Antonio, TX', 29.42, -98.49], ['u10', 'Luis Ortega', 'Seattle, WA', 47.61, -122.33], ['u11', 'Kyle Nguyen', 'Atlanta, GA', 33.75, -84.39], ['u12', 'Ben Carter', 'Chicago, IL', 41.88, -87.63], ['u13', 'Isaiah Cole', 'Orlando, FL', 28.54, -81.38], ['u14', 'Nate Rivera', 'Los Angeles, CA', 34.05, -118.24], ['u15', 'Ella Park', 'Nashville, TN', 36.16, -86.78], ['u16', 'Owen Hart', 'Dallas, TX', 32.78, -96.8], ['u17', 'Zane Miller', 'Boston, MA', 42.36, -71.06], ['u18', 'Ray Thompson', 'Toronto, ON', 43.65, -79.38], ['u19', 'Noah Greene', 'Las Vegas, NV', 36.17, -115.14], ['u20', 'Mia Santos', 'Philadelphia, PA', 39.95, -75.17],
]
const db = {
  profiles: PEOPLE.map(([id, name, city, lat, lng, role], i) => ({ id, email: `${name.split(' ')[0].toLowerCase()}@example.com`, name, city, lat, lng, discord: name.split(' ')[0].toLowerCase() + '_ai', photo_url: '', q1: 'Sign my first two retainer clients and replace my day job income.', q2: 'Ran ads for a friend\'s gym once. Never sold anything over the phone.', onboarded: i !== 0, role: role || 'student', active: true, must_change_password: false, added_by: 's1', created_at: new Date(Date.now() - i * 864e5 * 3).toISOString() })),
  modules: SEED_MODULES, achievements: ACH,
  settings: Object.entries(SETTINGS).map(([key, value]) => ({ key, value })),
  support_messages: [], lesson_progress: [], submissions: [], activity_days: [], watch_progress: [], quiz_attempts: [], recording_watches: [], outreach_log: [],
  tips: TIPS.map(([category, title, body], i) => ({ id: 't' + i, sort: i + 1, category, title, body, active: true, posted_at: i < 3 ? new Date(Date.now() - (3 - i) * 864e5).toISOString() : null })),
  announcements: [{ id: 'tip0', kind: 'tip', title: TIPS[2][1], body: TIPS[2][2], link_url: '', link_label: '', active: true, created_at: new Date(Date.now() - 36e5).toISOString() }, { id: 'a1', kind: 'manual', title: 'LIVE CLASS @ 6pm ET Wednesday 10/15', body: 'Join the Lead Gen call with Coach Adriel on Wednesday October 15th at 6pm ET. Bring your outreach numbers from this week. Link to join is below (on Discord as well).', link_url: 'https://discord.com', link_label: 'Join here', active: true, created_at: new Date().toISOString() }],
  phases: [['p1',1,'core','Start Here','How the bootcamp works, who your coaches are, and getting set up on Base44 with your coach.','🚀','#4f8cff'],['p2',2,'core','Niche & Offer','Pick a niche with money and pain, and shape an offer local businesses say yes to.','🎯','#22e36b'],['p3',3,'core','Build The Software','Client dashboards, AI websites and super agents. The product you walk in with.','🛠️','#a78bfa'],['p4',4,'core','Ads & Brand','Full AI ad scripting, creatives and setup, plus the personal brand businesses trust.','📣','#3dd6f5'],['p5',5,'core','Close The Deal','The pitch, the pricing model, and the Stripe + GHL setup to sign and bill your first client.','💰','#f5c652'],['p6',6,'core','Scale','The 30-day launch plan: from portfolio to paying clients in your first month.','📈','#ff8a5c'],['pb',7,'bonus','Case Studies & Masterclass','Two students walk through their first months, plus the full live masterclass with Jakey.','⭐','#f5c652']].map(([id,sort,group_key,title,description,icon,color])=>({id,sort,group_key,title,description,icon,color})),
  events: [['AI Integration','Coach Adriel','Setting up and running AI agents inside your business. Base44 builds, super agents, automations and live troubleshooting.',1,'18:00',60,'#3dd6f5'],['Lead Gen','Coach Adriel','Outreach that books calls: lead scraping, Instagram and cold email agents, follow-up and pipeline reviews.',3,'18:00',60,'#22e36b'],['Build Session','Coach Adriel','Live build along: bring your Base44 dashboard, site or agent and finish it on the call.',2,'18:00',60,'#a78bfa'],['Sales & Closing','Jake','Pitch reviews, pricing, objections and live role-plays. Bring a real prospect.',4,'18:00',60,'#ff8a5c'],['Media Buying','Coach Adriel','Delivering results for clients: campaign structure, creatives, reading ad data and what to change.',5,'18:00',60,'#a78bfa'],['Q&A with Jake','Jake','Bring your builds, client replies and stuck points. Open floor.',6,'18:00',60,'#f5c652']].map(([title,coach,description,weekday,start_time,duration_min,color],i)=>({id:'e'+i,title,coach,description,weekday,start_time,duration_min,color,join_url:'https://discord.com',active:true,sort:i})),
  recordings: [['Q&A with Jake','Jake','Q&A','2026-10-11',72],['Media Buying','Coach Adriel','Media Buying','2026-10-10',58],['Lead Gen','Coach Adriel','Lead Gen','2026-10-08',64],['AI Integration','Coach Adriel','AI Integration','2026-10-06',70],['Q&A with Jake','Jake','Q&A','2026-10-04',61],['Media Buying','Coach Adriel','Media Buying','2026-10-03',55],['Lead Gen','Coach Adriel','Lead Gen','2026-10-01',66],['AI Integration','Coach Adriel','AI Integration','2026-09-29',59]].map(([title,coach,category,held_on,duration_min],i)=>({id:'r'+i,title,coach,category,held_on,duration_min,video_url:'',notes:'',color:{'Q&A':'#f5c652','Media Buying':'#a78bfa','Lead Gen':'#22e36b','AI Integration':'#3dd6f5'}[category],created_at:held_on})),
}
// the demo user: one earned (not yet seen), one pending, one sent back
db.submissions.push({ id: 'me-niche', profile_id: 'demo-me', achievement_key: 'niche', proof: 'Local med spas in Austin', images: [], status: 'approved', reviewed_at: new Date(Date.now() - 864e5).toISOString(), reviewer_note: 'Great pick, lots of ad spend in that niche.', seen_at: null, created_at: new Date(Date.now() - 2 * 864e5).toISOString() })
db.submissions.push({ id: 'me-offer', profile_id: 'demo-me', achievement_key: 'offer', proof: 'https://docs.google.com/document/d/offer', images: [], status: 'pending', created_at: new Date().toISOString() })
db.submissions.push({ id: 'me-dashboard', profile_id: 'demo-me', achievement_key: 'dashboard', proof: '', images: [], status: 'rejected', reviewer_note: 'Screenshot is cut off, send the full dashboard with your client name visible.', reviewed_at: new Date().toISOString(), created_at: new Date().toISOString() })
db.outreach_log.push({ profile_id: 'demo-me', day: new Date().toISOString().slice(0, 10), count: 12 }, { profile_id: 'demo-me', day: new Date(Date.now() - 864e5).toISOString().slice(0, 10), count: 25 })
// example progress for other members so the leaderboard has shape
PEOPLE.slice(1).forEach(([id], i) => {
  const n = Math.max(1, 13 - i); SEED_MODULES.slice(0, n).forEach(m => db.lesson_progress.push({ profile_id: id, module_id: m.id, completed_at: new Date().toISOString() }))
  ACH.slice(0, Math.max(0, 14 - i)).forEach(a => db.submissions.push({ id: id + a.key, profile_id: id, achievement_key: a.key, proof: 'https://example.com/proof', status: 'approved', created_at: new Date().toISOString() }))
  for (let d = 0; d < Math.max(1, 50 - i * 2); d++) { const dt = new Date(); dt.setDate(dt.getDate() - d); db.activity_days.push({ profile_id: id, day: dt.toISOString().slice(0, 10), points: 3 }) }
})
try { const saved = JSON.parse(localStorage.getItem('demo_me') || 'null'); if (saved) Object.assign(db.profiles[0], saved) } catch {}
db.submissions.push({ id: 'pend1', profile_id: 'u5', achievement_key: 'out100', proof: 'https://example.com/screenshot', status: 'pending', created_at: new Date().toISOString() })

function autoAward(pid) { const total = db.outreach_log.filter(o => o.profile_id === pid).reduce((s, o) => s + o.count, 0); ACH.filter(a => a.auto_metric === 'outreach' && a.auto_threshold <= total).forEach(a => { const ex = db.submissions.find(s => s.profile_id === pid && s.achievement_key === a.key); if (ex) { if (ex.status !== 'approved') { ex.status = 'approved'; ex.reviewed_at = new Date().toISOString() } } else db.submissions.push({ id: pid + a.key, profile_id: pid, achievement_key: a.key, proof: 'Outreach counter', status: 'approved', created_at: new Date().toISOString(), reviewed_at: new Date().toISOString() }) }) }
function leaderboard() {
  return db.profiles.filter(p => p.active && p.role === 'student').map(p => {
    const lp = db.lesson_progress.filter(l => l.profile_id === p.id); const course = lp.reduce((s, l) => s + (db.modules.find(m => m.id === l.module_id)?.points || 0), 0)
    const sb = db.submissions.filter(s => s.profile_id === p.id && s.status === 'approved'); const impl = sb.reduce((s, x) => { const a = ACH.find(a => a.key === x.achievement_key); return s + (a && a.category === 'implement' ? a.points : 0) }, 0); const rev = sb.reduce((s, x) => { const a = ACH.find(a => a.key === x.achievement_key); return s + (a && a.category === 'revenue' ? a.points : 0) }, 0)
    const days = db.activity_days.filter(a => a.profile_id === p.id).length
    return { id: p.id, name: p.name, city: p.city, photo_url: p.photo_url, onboarded: p.onboarded, lat: p.lat, lng: p.lng, points: course + impl + rev + days * 3, course_points: course, implementation_points: impl, revenue_points: rev, activity_points: days * 3, lessons_done: lp.length, active_days: days }
  })
}

class Q {
  constructor(table) { this.table = table; this.filters = []; this.orderBy = null; this.op = 'select'; this.payload = null; this.single = false }
  select(cols) { if (this.op === 'select') this.cols = cols; return this }
  eq(f, v) { this.filters.push(r => r[f] === v); return this }
  is(f, v) { this.filters.push(r => (r[f] ?? null) === v); return this }
  in(f, vs) { this.filters.push(r => vs.includes(r[f])); return this }
  neq(f, v) { this.filters.push(r => r[f] !== v); return this }
  gte(f, v) { this.filters.push(r => r[f] >= v); return this }
  limit() { return this }
  upsert(data) { this.op = 'upsert'; this.payload = data; return this }
  order(f, o) { this.orderBy = [f, o?.ascending === false ? -1 : 1]; return this }
  maybeSingle() { this.single = true; return this }
  insert(data) { this.op = 'insert'; this.payload = data; return this }
  update(data) { this.op = 'update'; this.payload = data; return this }
  delete() { this.op = 'delete'; return this }
  rows() { const src = this.table === 'leaderboard' ? leaderboard() : this.table === 'wins' ? db.submissions.filter(s => s.status === 'approved').map(s => { const p = db.profiles.find(x => x.id === s.profile_id) || {}; const a = ACH.find(a => a.key === s.achievement_key) || {}; return { id: s.id, profile_id: s.profile_id, name: p.name, photo_url: p.photo_url, achievement_key: s.achievement_key, title: a.title, points: a.points, category: a.category, won_at: s.reviewed_at || s.created_at } }) : (db[this.table] || []); return src.filter(r => this.filters.every(f => f(r))) }
  then(res, rej) { return Promise.resolve(this.run()).then(res, rej) }
  run() {
    if (this.op === 'insert') { const rows = Array.isArray(this.payload) ? this.payload : [this.payload]; rows.forEach(r => db[this.table].push({ id: Math.random().toString(36).slice(2), created_at: new Date().toISOString(), ...r })); if (this.table === 'outreach_log') autoAward(rows[0].profile_id); return { data: rows, error: null } }
    if (this.op === 'upsert') { const rows = Array.isArray(this.payload) ? this.payload : [this.payload]; rows.forEach(r => { const ex = db[this.table].find(x => x.key === r.key); ex ? Object.assign(ex, r) : db[this.table].push({ ...r }) }); return { data: rows, error: null } }
    if (this.op === 'delete') { const rows = this.rows(); db[this.table] = db[this.table].filter(r => !rows.includes(r) && !rows.some(x => x.id && x.id === r.id)); return { data: null, error: null } }
    if (this.op === 'update') { const rs = this.rows(); rs.forEach(r => Object.assign(r, this.payload)); if (this.table === 'outreach_log' && rs[0]) autoAward(rs[0].profile_id); if (this.table === 'profiles') { try { localStorage.setItem('demo_me', JSON.stringify(db.profiles[0])) } catch {} } return { data: null, error: null } }
    let rows = this.rows().map(r => {
      if (this.table === 'submissions' && this.cols?.includes('profiles(')) return { ...r, profiles: { name: db.profiles.find(p => p.id === r.profile_id)?.name }, achievements: ACH.find(a => a.key === r.achievement_key) }
      return { ...r }
    })
    if (this.orderBy) { const [f, d] = this.orderBy; rows.sort((a, b) => (a[f] > b[f] ? 1 : a[f] < b[f] ? -1 : 0) * d) }
    return { data: this.single ? (rows[0] || null) : rows, error: null }
  }
}

export function createDemoClient() {
  const user = { id: ME, email: 'aiden@example.com' }
  let session = { user, access_token: 'demo' }; const listeners = []
  return {
    from: t => new Q(t),
    rpc: async () => ({ data: leaderboard() }),
    auth: {
      getSession: async () => ({ data: { session } }),
      getUser: async () => ({ data: { user } }),
      onAuthStateChange: cb => ({ data: { subscription: { unsubscribe() { const i = listeners.indexOf(cb); if (i >= 0) listeners.splice(i, 1) } } } }),
      signInWithPassword: async () => ({ error: null }),
      signOut: async () => { session = null; location.reload() },
      updateUser: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ error: null }),
    },
    storage: { from: () => ({ upload: async () => ({ error: null }), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
  }
}

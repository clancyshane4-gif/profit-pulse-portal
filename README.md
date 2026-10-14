# Profit Pulse AI — Student Portal

React + Vite frontend, Supabase (auth, Postgres, storage), hosted on Netlify. Admins invite students by email; students set a password, add a photo, answer two questions, then work through the course and earn points.

## One-time setup (about 20 minutes)

### 1. Supabase
1. Create a project at supabase.com (free tier is fine to start).
2. SQL Editor → New query → paste all of `supabase/schema.sql` → Run. Then do the same with `supabase/migration-2-depth.sql` `supabase/migration-3-announcements.sql`, `supabase/migration-4-wins.sql`, `supabase/migration-5-achievements.sql` `supabase/migration-6-tips.sql`, `supabase/migration-7-support-affiliate.sql`, `supabase/migration-8-resources.sql` and `supabase/migration-9-tidy.sql`. This creates every table, the leaderboard view, security rules, the `avatars` storage bucket, and seeds the 13 modules, achievements, schedule and challenge.
3. Authentication → Providers → Email: keep **Confirm email** on. Authentication → URL Configuration: set **Site URL** to your portal URL (e.g. `https://portal.profitpulsebootcamp.com`) and add `https://portal.profitpulsebootcamp.com/set-password` under **Redirect URLs**. Add `http://localhost:5173/set-password` too if you'll run it locally.
4. (Recommended) Authentication → Email Templates → "Invite user": change the copy so it reads like it came from Jakey. Keep the `{{ .ConfirmationURL }}` link.
5. Project Settings → API: copy the **Project URL**, **anon key**, and **service_role key**.

### 2. Make yourself admin
`schema.sql` already lists `scalewdrew@gmail.com` in `admin_emails`, so that address becomes an admin on first sign-up. To create your own account: Supabase → Authentication → Users → **Add user** with your email and a password, then sign in. Promote more admins/coaches/reps from Admin → Members.

### 3. Netlify
1. Push this folder to a GitHub repo and "Add new site → Import from Git" on Netlify (build command and publish folder are already in `netlify.toml`).
2. Site settings → Environment variables, add one variable:
   - `SUPABASE_SERVICE_ROLE_KEY` = the project's **secret** key (Supabase → Settings → API Keys → Secret keys). Functions only; never put this in a VITE_ variable.
   The public URL and publishable key are already in `netlify.toml`.
3. Deploy. Point your domain at it (Domain management).

### 4. Videos
Admin → Modules & videos. Paste a Vimeo / YouTube (unlisted) / Loom / Bunny link per module and Save; share links are converted to embed links automatically. Until a module has a video it links to Skool.

## Content model
- **Phases** (`phases` table): the course sections with an icon and color. **Lessons** (`modules` table) belong to a phase and are either a video or a quiz. Quizzes are a JSON list of questions edited in Admin → Lessons & videos; pass mark per quiz (default 80%).
- **Locks**: core phases and lessons unlock in order; a video lesson needs 50% real play time before it can be marked complete. Bonus phase is always open. Admins/coaches bypass locks.
- **Call schedule** (`events`): weekly recurring calls in Eastern time, shown in each student's timezone with a join link. Admin → Call schedule.
- **Recordings** (`recordings`): one row per past call with a video link; students mark them watched (counts as daily activity). Admin → Recordings.
- **Leaderboard**: quarter tab uses `leaderboard_since()`; All time uses the `leaderboard` view. Clicking a member shows their point breakdown.

## Automations (Admin → Automations)
A Netlify scheduled function (`netlify/functions/daily-digest.mjs`) runs daily at 22:00 UTC. Each part turns on when its variable is set in Netlify → Environment variables:
- `DISCORD_WEBHOOK_URL`: posts the top 10 and the last 24h of approved wins to a Discord channel.
- `RESEND_API_KEY` + `EMAIL_FROM`: emails students with a 3+ day streak who haven't earned points yet today.
- `DISCORD_BOT_TOKEN` + `DISCORD_GUILD_ID` + `DISCORD_PHASE1_ROLE_ID`: gives the Phase 1 role to students who finished Phase 1 (matched by the Discord username they entered). The bot needs Manage Roles and the Server Members intent.
"Preview (dry run)" in Admin shows what would happen without sending. "Run now" runs it immediately.

## Wins and certificate
Approved achievements appear in the Wins strip on every dashboard (view `wins`). Finishing every lesson in Phases 1–6 unlocks `/certificate`, a downloadable PNG with the student's name and date.

## Day-to-day
- **Add a student (reps):** Rep panel → Add a student. The portal creates the account and shows a temporary password once, with a ready-to-send message. The student signs in with it, is forced to set their own password, then adds a photo and lands on the dashboard. Reps see only the students they added; admins see all. "Reset password" issues a new temporary one.
- **Make someone a rep:** Admin → Members → role "Rep (setter)".
- **Review proof:** Admin → Pending reviews → Approve / Reject. Approved points show on the leaderboard immediately.
- **Disable someone / change role:** Admin → Members.
- **Edit the challenge, schedule, tiers, resources, onboarding steps:** Supabase → Table editor → `settings` (JSON values). An admin screen for these can come later.

## Points
Module points are set per module (default scaled by length). Implementation and revenue points come from the `achievements` table. Every day a student earns points counts as 3 activity points. Totals come from the `leaderboard` view in `schema.sql`, so changing a point value there updates everyone retroactively.

## Preview without Supabase (demo mode)
```
npm install
VITE_DEMO=1 npm run dev
```
Opens the whole portal with example members, points and a pending review so you can click through every page. Nothing saves past a reload. Netlify can host a demo too: set `VITE_DEMO=1` as an environment variable on a separate site.

## Map
Pins come from each student's location when they add their photo: the portal looks up their approximate city from their IP (ipapi.co, free tier), pre-fills the City field and stores the coordinates. They can correct the city; if they do, the pin falls back to the typed city. Map tiles are OpenStreetMap by default (no key). For the Mapbox dark style like Brez's portal, add `VITE_MAPBOX_TOKEN` (free tier covers this).

## Resources & icons
Resources live in `settings.resources` as `[name, blurb, category, url, iconSlug?]`. Icons come from the simple-icons set and are matched by name automatically (Claude, ChatGPT, Meta, Google Ads, Stripe, Canva, Loom, Discord, n8n, TikTok…). To force one, add a 5th element with a simple-icons slug (e.g. `"siNotion"`). Tools with no public icon (Base44, GoHighLevel) show a lettermark; drop their logo in `public/` and point to it later.

## Local development
```
cp .env.example .env   # fill in the VITE_ values
npm install
npm run dev
```
The invite function only runs on Netlify (or `netlify dev` with the Netlify CLI).

## Project layout
- `src/pages/` one file per screen (Login, SetPassword, OnboardingGate, Dashboard, Courses, Module, Leaderboard, Challenge, MemberMap, Achievements, Resources, Schedule, Onboarding, Admin)
- `src/lib/data.js` every Supabase query in one place
- `src/styles.css` the design (dark, black + green); cosmetics live here
- `supabase/schema.sql` the whole database, re-runnable
- `netlify/functions/create-student.mjs` the only server code: creates a student (or resets their password) with a temporary password, after checking the caller is a rep, coach or admin
- `public/img/` module cover images pulled from the Skool classroom

## Achievements (v2)
- Students submit up to 4 screenshots (stored in the `proofs` bucket) plus an optional link or note.
- Rejecting in Admin → Pending reviews asks for a note; the student sees it on the badge and can **Resubmit**.
- When a coach approves, the student gets an in-app popup the next time they open the portal.
- The **Outreach counter** on the Achievements page logs daily outreach to `outreach_log`; the 50 / 100 / 200 badges unlock automatically (database trigger).
- Admin → **Achievements** lets you add, edit, reorder, re-point or delete achievements and set an outreach threshold for auto-unlock.

## Daily tip bot
- `supabase/tips.json` is the bank (84 tips across Mindset, Niche & Offer, Build, Outreach, Ads, Closing, Scale); migration 6 loads it into the `tips` table.
- `netlify/functions/daily-tip.mjs` runs hourly and posts the next unposted tip as an announcement (`kind = 'tip'`) when the Eastern hour matches the setting. Loops back to the start when the bank is used up.
- Admin → Announcements → **Daily tip bot**: on/off, hour (ET), "Post next now", add/edit/skip/delete tips, put a posted tip back in the queue.

## Support chat
- Green chat bubble bottom-right for students. Messages go to `support_messages`; the student sees the auto-reply instantly (text in Admin → Support → settings) and coach replies in the same bubble with a red badge.
- Admin → **Support** is the inbox. Set `RESEND_API_KEY` in Netlify to also email every new message to the support address (default support@aiprofitpulse.com).

## Affiliate tools
- `/affiliate` lists paid tools with your affiliate links (setting `affiliate_tools`). Edit in Admin → **Affiliate tools**.

## Live class popup
- The dashboard shows the next call ("Today at 6:00 PM", countdown under an hour) and "Coach is live" during the call, with the join link from Admin → Call schedule. Dismiss hides that one occurrence.

## Login emails
- Creating a member (Admin → Members or the Rep panel) emails them automatically. With `RESEND_API_KEY` (+ `EMAIL_FROM` on a verified domain) they get a branded email with the temporary password. Without it, Supabase's built-in sender emails a "set your password" link instead (limited to a few per hour, so add Resend before onboarding a batch).
- The temporary password is still shown on screen either way, so a rep can also text it.

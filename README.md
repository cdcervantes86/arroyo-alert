# 🌊 ArroyoAlert — Barranquilla

Real-time crowdsourced arroyo (street flood) alerts for Barranquilla, Colombia.

## Quick Start

### Prerequisites
- Node.js 18+ installed (https://nodejs.org)
- A free Supabase account (https://supabase.com)
- Git installed

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Supabase
1. Go to https://supabase.com and create a new project
2. Go to SQL Editor and run the contents of `lib/schema.sql` to create your tables
3. Copy your project URL and anon key from Settings > API
4. Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run locally
```bash
npm run dev
```
Open http://localhost:3000

### 4. Deploy to Vercel
1. Push your code to GitHub
2. Go to https://vercel.com, import your repo
3. Add your environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY)
4. Click Deploy

That's it — you'll get a live URL like `arroyo-alert.vercel.app`

## Project Structure
```
arroyo-alert/
├── app/
│   ├── layout.jsx          # App shell, fonts, metadata
│   ├── page.jsx             # Main screen (map + list)
│   └── globals.css          # Global styles
├── components/
│   ├── MapView.jsx          # Leaflet map with zone markers
│   ├── ZoneDetail.jsx       # Zone detail with reports
│   ├── ZoneList.jsx         # List view of all zones
│   ├── ReportFlow.jsx       # 3-step report submission
│   ├── Header.jsx           # Top bar
│   └── StatusBar.jsx        # Alert count bar
├── lib/
│   ├── supabase.js          # Supabase client
│   ├── zones.js             # Zone definitions
│   ├── schema.sql           # Database schema
│   └── useReports.js        # Reports hook (fetch, submit, upvote)
├── public/
│   ├── manifest.json        # PWA manifest
│   └── icon-512.png         # App icon (add your own)
├── package.json
├── next.config.mjs
└── .env.local               # Your Supabase credentials (not committed)
```

## Tech Stack
- **Next.js 14** — React framework
- **Supabase** — Database + real-time + auth
- **Leaflet** — Interactive map
- **CARTO Dark** — Map tile style
- **Vercel** — Hosting

## Next Steps After Deploy
- [ ] Add push notifications (Web Push API)
- [ ] Add photo uploads to reports
- [ ] Integrate weather API for proactive alerts
- [ ] Add "my commute" route alerts
- [ ] Launch PR with local media

# Publix BOGO

The smartest shopping list for Publix shoppers. Add your grocery items, see which ones are on BOGO, sale, or coupon this week, and shop with a built-in checklist.

## What it does

- **Shopping list** — Add items you buy regularly. Your list persists between trips.
- **Automatic deal matching** — Every week, your items get checked against 100+ active Publix deals (BOGOs, sales, coupons) via the Flipp API.
- **Shop Mode** — Open the app on your phone at the store. Check items off as you go. One hand, one screen.
- **Trip history** — See past shopping trips, what you bought, and which deals you scored.
- **Push notifications** — Get alerted when your items go on sale.

Mobile opens directly to Shop Mode. Desktop redirects to the deals browser.

## Tech stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4, Lucide icons |
| Auth & DB | Supabase (with localStorage fallback) |
| Deal data | Flipp API |
| Push | Web Push with VAPID keys |
| Testing | Vitest + React Testing Library, Playwright (E2E) |
| Fonts | Plus Jakarta Sans (body), Fraunces (display) |

## Getting started

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local
# Fill in your Supabase and VAPID keys (see below)

# Run dev server (port 8080)
npm run dev

# Production build
npm run build && npm start
```

## Environment variables

```env
# Supabase (optional — falls back to localStorage)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Web Push (generate with: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
```

## Project structure

```
src/
├── app/                 # Pages & API routes
│   ├── page.tsx         # Landing page
│   ├── app/page.tsx     # Shop Mode (mobile) / redirect to deals (desktop)
│   ├── deals/page.tsx   # Deal browser with search & filters
│   ├── history/page.tsx # Past shopping trips
│   ├── settings/        # Zip code, clear data, account
│   ├── alerts/          # Push notification management
│   └── api/             # deals, search, push-subscribe, check-deals
├── components/          # UI (shop-mode, deal-card, bottom-nav, etc.)
├── context/             # React Context (deals, auth)
├── hooks/               # Watchlist, deals, store config, trips
├── lib/                 # Flipp API client, categories, recommendations
└── types/               # TypeScript interfaces
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright E2E tests |

## How deal matching works

1. User enters their zip code on first visit
2. The app fetches all active Publix deals from Flipp for that zip
3. Each shopping list item is suffix-matched against deal names (e.g., "Yogurt" matches "Chobani Greek Yogurt BOGO*")
4. Matching items get a "Deal" badge in Shop Mode and the deals browser

Deals are categorized into 12 groups (Meat & Seafood, Dairy, Pantry, Frozen, etc.) using keyword-based classification.

## Design

- **Colors**: Publix green (`#3b7d23`), warm cream/paper palette
- **Mobile-first**: Safe area insets, one-handed Shop Mode, bottom tab nav
- **PWA**: Installable via manifest, works offline after first load
- **Animations**: Custom sticker slap, check fill, list entrance transitions

## Clipper service

The `/clipper` directory contains a separate Node.js + Puppeteer service that automatically clips all Publix digital coupons weekly. It runs independently via launchd and is not part of the main web app.

---

Not affiliated with Publix Super Markets, Inc. Deal data comes from publicly available Flipp listings.

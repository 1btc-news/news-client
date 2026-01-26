# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

1btc.news client - A React SSR application for viewing and posting Bitcoin ordinal news inscriptions. Fetches data from the inscribe.news API. Deployed to Cloudflare Workers.

## Commands

```bash
npm install      # Install dependencies
npm run dev      # Start Vite dev server (localhost:5173)
npm run build    # Build for production (client + SSR)
npm run preview  # Preview production build locally
npm run cf-typegen  # Generate Cloudflare worker types
```

No test suite is configured.

## Architecture

### Tech Stack
- React 19 + TypeScript + Vite 7
- TanStack Start for SSR and routing
- Tailwind CSS v4 for styling
- Cloudflare Workers for deployment
- React Markdown with GFM and raw HTML support

### Source Structure
```
src/
├── router.tsx            # TanStack Router setup
├── styles.css            # Tailwind imports + custom fonts + prose styles
├── components/
│   └── verified-badge.tsx  # 1BTC verified author badge
├── lib/
│   ├── api-types.ts      # TypeScript types for API responses
│   └── utils.ts          # Utility functions (verified authors, formatting)
└── routes/
    ├── __root.tsx        # Root layout (header, footer, meta tags)
    ├── index.tsx         # Home page - recent news list
    ├── article.$id.tsx   # Article detail with SSR loader
    ├── post.tsx          # Post news form with JSON generation
    └── $404.tsx          # 404 catch-all route

public/
├── fonts/                # Really Sans font files (woff, woff2)
├── logos/                # 1btc.news logo variants (SVG, PNG)
└── ...                   # Favicons and app icons
```

### Routes
- `/` - Home page listing recent news with SSR
- `/article/:id` - Article detail page with SSR and OG meta tags
- `/post` - Form to generate Ordinal News Standard JSON

### API Integration
Backend: `https://inscribe.news/api/`
- `/api/data/` - List all news inscriptions
- `/api/data/{id}` - Combined news content + metadata

### Key Types (src/lib/api-types.ts)
- `OrdinalNews` - News standard schema (p="ons", op, title, body, author)
- `InscriptionMeta` - Inscription metadata from KV store
- `NewsItem` - Combined news + metadata for list views
- `NewsDataResponse` - API response for single article

### Verified Authors
Authors in `VERIFIED_AUTHORS` list (src/lib/utils.ts) display a 1BTC badge:
- `1btc.news (@1btcnews)`
- `1btc.chat`

### Styling
- Tailwind v4 with brand color tokens in `@theme` block
- Custom "Really Sans" fonts (Large for headings, Small for body)
- `.prose-news` class for markdown article content
- Dark mode default (`bg-brand-dark`)

### Brand Colors
- `brand-orange`: #F27400 (primary)
- `brand-dark`: #1A1919 (background)
- `bitcoin-orange`: #F7931A (accent)
- `brand-darkgray`: #333333 (borders, cards)
- `brand-gray`: #8395A7 (muted text)

### Deployment
- Cloudflare Workers via `wrangler.jsonc`
- TanStack Start server entry for SSR
- Push to main triggers automatic deployment

### Prettier Config
Defined in package.json: single quotes, 2-space tabs, trailing commas (ES5), 100 char width.

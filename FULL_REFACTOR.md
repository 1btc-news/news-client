# 1btc.news Full Refactor Plan

## Current State Assessment

### Application Scope
- **~1,300 lines** of UI code (routes + components)
- **4 routes**: Home (recent news), Post News, View News, 404
- **8 components**: Logo, icons, footer, signup form, SEO helmet, stats card, fonts
- **API integration**: Simple fetch from `inscribe.news/api/`

### Current Stack (Outdated)
| Package | Current | Latest | Gap |
|---------|---------|--------|-----|
| React | 18.2.0 | 19.2.3 | 1 major |
| Chakra UI | 2.5.1 | 3.31.0 | 1 major (complete rewrite) |
| Vite | 3.0.2 | 7.3.1 | 4 major |
| TypeScript | 4.9.4 | 5.9.3 | 1 major |
| react-router-dom | 6.8.2 | 7.12.0 | 1 major |

### Brand Assets to Preserve
- **Colors**: `#F27400` (brand orange), `#1A1919` (brand dark), `#F7931A` (bitcoin orange), `#1C5263` (dark cyan)
- **Fonts**: "Really Sans Large/Small" (Bold + Regular variants) in `/public/fonts/`
- **Logos**: SVG/PNG in `/public/logos/` (orange and black variants)
- **Aesthetic**: Dark mode default, orange accents, clean typography, minimal UI

---

## Decision: Fresh Rewrite

**Why rewrite instead of migrate:**
1. Chakra UI v2 → v3 is essentially a rewrite anyway (new architecture, different APIs)
2. Application is small enough that rewriting is comparable effort to migrating
3. Opportunity to adopt modern patterns and shed unused dependencies
4. `chakra-ui-markdown-renderer` is unmaintained and incompatible with v3
5. Several dependencies appear unused (`localforage`, `sort-by`, `match-sorter`, `markdown-it`)
6. Want SSR for SEO - current SPA doesn't support this

---

## Target Stack: TanStack Start + Tailwind

Scaffold with `npm create cloudflare@latest`, then add TanStack Start.

### Core Stack
```
React 19 + TanStack Start + Tailwind v4 + Vite 7 + Cloudflare Workers
```

### Reference Implementations on Disk

**Frontend patterns:**
- `~/dev/whoabuddy/stacks-on-cf/` - TanStack Start + Tailwind + Cloudflare
- `~/dev/whoabuddy/portfolio/` - Similar stack with eslint/prettier

**API patterns (Hono + chanfana):**
- `~/dev/aibtcdev/x402-api/` - Production API with endpoints organized in `src/endpoints/`
- `~/dev/aibtcdev/x402-sponsor-relay/` - Simpler relay API

**Centralized logging:**
- `~/dev/aibtcdev/worker-logs/` - Hono-based logging service with Durable Objects
- Pattern: Register app, POST logs, query via dashboard

**Backend (our code):**
- `~/dev/OrdinalNews/client/` - The inscribe.news API (Cloudflare Functions + KV)
- Also outdated (same Chakra/React 18 stack) - potential future modernization

### Key Packages
```json
{
  "dependencies": {
    "@cloudflare/vite-plugin": "^1.x",
    "@tailwindcss/vite": "^4.x",
    "@tanstack/react-router": "^1.x",
    "@tanstack/react-start": "^1.x",
    "lucide-react": "^0.5x",
    "react": "^19.x",
    "react-dom": "^19.x",
    "react-markdown": "^10.x",
    "remark-gfm": "^4.x",
    "rehype-raw": "^7.x",
    "tailwindcss": "^4.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^7.x",
    "wrangler": "^4.x"
  }
}
```

---

## Features & Routes

### Routes

| Route | Purpose | SSR? |
|-------|---------|------|
| `/` | Recent news list | Yes |
| `/article/:id` | View single article | **Yes** (SEO critical) |
| `/post` | Create inscription JSON | No (interactive form) |
| `/about` | About page (optional) | Yes |

### Key Features

1. **SSR for Articles** - Server-render article pages for:
   - Social media previews (Open Graph, Twitter cards)
   - Search engine indexing
   - Fast initial load

2. **Post News (Key Feature - Revamp)**
   - Current: Simple form generating JSON for manual inscription
   - Future considerations:
     - Better UX for markdown editing
     - Preview before generating
     - Integration with inscription services?
     - Author verification flow?

3. **Verified Authors**
   - Recent commits added "1btc checks" for verified authors
   - Display verification badge on articles
   - Data source: TBD (hardcoded list vs API)

### Removed Features
- ~~Email signup form~~ - No longer needed

---

## Implementation Phases

### Phase 1: Scaffold
1. Create branch `refactor/tanstack-tailwind`
2. Run `npm create cloudflare@latest` with hello-world-with-assets template
3. Add TanStack Router/Start
4. Add Tailwind v4 with brand colors
5. Configure custom fonts ("Really Sans")
6. Copy `/public/` assets (logos, favicons, fonts)

### Phase 2: Core Layout
1. Root layout with dark theme
2. Header with logo
3. Footer component
4. Global styles matching brand aesthetic

### Phase 3: Article Display (SSR)
1. Home route - fetch and list recent news
2. Article route with SSR loader
3. Markdown rendering with brand-styled links
4. Open Graph / Twitter meta tags for articles

### Phase 4: Post News Revamp
1. Markdown editor/textarea
2. Live preview
3. JSON generation
4. Copy-to-clipboard

### Phase 5: Polish & Deploy
1. Responsive design pass
2. Loading/error states
3. 404 page
4. Integrate with worker-logs (optional)
5. Verify Cloudflare deployment
6. Update CLAUDE.md

---

## API Integration

### Backend: `https://inscribe.news/api/`

| Endpoint | Purpose |
|----------|---------|
| `/api/data/` | List all news inscriptions |
| `/api/info/{id}` | Get inscription metadata |
| `/api/content/{id}` | Get inscription content (news JSON) |
| `/api/data/{id}` | News + metadata combined |

### Types to Preserve

```typescript
// News standard schema
interface OrdinalNews {
  p: "ons";
  op: string;
  title: string;
  url?: string;
  body?: string;
  author?: string;
  authorAddress?: string;
  signature?: string;
}

// Metadata for inscription
interface InscriptionMeta {
  id: string;
  number: number;
  address: string;
  content_type: string;
  content_length: number;
  genesis_block_height: number;
  genesis_tx_id: string;
  timestamp: string;
  last_updated: string;
  news_number?: number;
  news_author?: string;
}
```

### API Notes
- No changes planned to inscribe.news API
- API is our code at `~/dev/OrdinalNews/client/` (also needs modernization eventually)
- Rate limited at 2 req/sec to Hiro Ordinals API upstream

---

## Logging Integration (Optional)

Can integrate with `worker-logs` service for centralized logging:

```typescript
// Example: Log page views, errors, etc.
await fetch('https://logs.aibtc.dev/logs', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <API_KEY>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    level: 'info',
    message: 'Article viewed',
    data: { articleId, userAgent }
  })
});
```

---

## Open Questions

1. **Verified authors data source**
   - Where does the list come from?
   - Hardcoded in frontend or fetched from API?

2. **Post-news revamp scope**
   - Just better UX, or deeper integration?
   - Should it connect to inscription services directly?
   - Author signing/verification before inscribing?

3. **inscribe.news API modernization**
   - Plan to update `OrdinalNews/client` separately?
   - Or include in this refactor scope?

4. **Domain/deployment**
   - Same `1btc.news` domain via Cloudflare Pages?
   - Any wrangler.toml configuration needed?

---

## Files to Reference

### Working Cloudflare + TanStack examples
- `~/dev/whoabuddy/stacks-on-cf/package.json`
- `~/dev/whoabuddy/portfolio/package.json`

### API patterns (Hono + chanfana)
- `~/dev/aibtcdev/x402-api/src/index.ts` - Main entry with middleware
- `~/dev/aibtcdev/x402-api/src/endpoints/` - Organized endpoint modules

### Logging service
- `~/dev/aibtcdev/worker-logs/src/index.ts` - Full implementation

### Current app files to port
- `src/style/theme/colors.ts` - Brand colors
- `src/style/theme/fonts.ts` - Font families
- `src/style/news.css` - Markdown content styles (translate to Tailwind)
- `lib/api-types.ts` - TypeScript types
- `public/` - All static assets

### Backend API (our code)
- `~/dev/OrdinalNews/client/CLAUDE.md` - API documentation
- `~/dev/OrdinalNews/client/functions/api/` - Cloudflare Functions endpoints

---

## Next Steps

1. ✅ Document current state and target stack
2. ⬜ Resolve open questions (verified authors, post-news scope)
3. ⬜ Create feature branch `refactor/tanstack-tailwind`
4. ⬜ Scaffold with `npm create cloudflare@latest`
5. ⬜ Begin Phase 1 implementation

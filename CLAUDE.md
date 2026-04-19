# Bluestone PIM Labs Landing Page

Landing page for Bluestone PIM Labs, a community space for builders working on and for Bluestone PIM.

## What this is

A stakeholder mockup / community landing page. Single static HTML file, no framework, no build step. Deployed on Vercel.

- Live URL: https://bluestone-labs-landing.vercel.app
- GitHub: https://github.com/bspim-labs/bluestone-pim-labs

## Related projects

- **MCP Server** — the first Labs project, design reference for this page
  - Site: https://bluestone-mcp-unofficial.vercel.app/connect
  - GitHub: https://github.com/leafleaf90/bluestone-pim-unofficial-mcp
  - The `public/connect/index.html` in that repo is the visual reference for this page: same color palette, card patterns, disclaimer banner, and Tailwind setup. When making design changes here, check alignment with that file.

## Stack

- `index.html`: single file, all styles inline via a `<style>` block + Tailwind CSS from CDN
- `projects.json`: project cards data, rendered by JS at page load via `fetch('projects.json')`
- `public/`: static assets (logo, og-image)
- `vercel.json`: sets `outputDirectory` to `.` so Vercel serves from repo root, not the `public/` folder

## Design

Matches the visual language of the MCP server page (`bluestone-pim-unofficial-mcp` repo):
- Color palette: slate-50/slate-950 backgrounds, blue-600/blue-400 accents, amber for warnings
- Tailwind dark mode via `class` strategy, toggled with localStorage
- Same disclaimer banner style (full-width slate strip directly below header)

## Adding a project

Edit `projects.json` and open a PR. The `.github/workflows/validate-projects.yml` GitHub Actions check runs automatically on any PR that touches `projects.json`, validating against `.github/projects.schema.json`. Each entry takes:

```json
{
  "name": "Project Name",
  "description": "One or two sentences.",
  "url": "https://...",
  "github": "https://github.com/...",
  "status": "live",
  "cta": "View setup guide",
  "icon": "terminal"
}
```

Available icons: `terminal`, `default` (plus icon). Add more in the `icons` object in `index.html`.
The page always renders at least 3 cards, filling with placeholders if fewer projects exist.

## Content constraints

- No em dashes anywhere (use commas or colons instead)
- No "not just X, it is Y" constructions
- No filler phrases like "In summary" or "To summarize"

## Assets

- `public/bluestone_pim_logo.png`: Bluestone PIM logo, used in navbar and as favicon
- `public/og-image.jpg`: OG image (1200x630), referenced with absolute URLs in meta tags

If the domain changes, update the absolute URLs in the `og:image`, `twitter:image`, and `og:url` meta tags in `index.html` and `post.html`. The OG image is generated at build time by `scripts/generate-og-image.js` (uses `sharp`) and output to `public/og-image.jpg`.

## Local development

```bash
npm run serve
```

Open http://localhost:8000. Handles clean URLs and blog routing locally. Do NOT use `python3 -m http.server` — it doesn't handle routing.

Do NOT use `vercel dev` — this is a static site and vercel dev gets confused, tries yarn, and conflicts with the custom server.

To test Vercel-specific routing, push to a branch and check the preview URL.

## Deploy

Push to `main`. Vercel deploys automatically. The `build` script (`node scripts/generate-posts-index.js`) runs on Vercel at deploy time, so `posts.json` is always fresh.

## Blog

Posts live in `posts/*.md` with frontmatter:

```markdown
---
title: Post Title
date: 2026-04-17
description: One sentence.
tags: meta, community
heroImage: /public/posts/slug/banner.webp
---
```

To add a post:
1. Write `posts/your-slug.md`
2. Drop images in `public/posts/your-slug/`, run `node scripts/optimize-images.js` (needs `npm install` once for sharp)
3. Run `npm run build` to regenerate `posts.json`, `public/og-image.jpg`, and `blog/{slug}/index.html` (static page with baked-in meta for crawlers)
4. Push to main — commit the generated `blog/` and `public/posts/` files alongside the post

`posts.json` is also regenerated automatically by Vercel on deploy via the `build` script.

## Routing (Vercel)

Uses `routes` in `vercel.json` (not `rewrites` + `cleanUrls` — that combination had conflicts with static output). The routes array must come before `handle: filesystem`:

- `/blog` → `blog.html`
- `/blog/:slug` → `post.html` (slug read from `window.location.pathname` client-side)

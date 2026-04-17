# Bluestone PIM LABS Landing Page

Landing page for Bluestone PIM LABS, a community space for builders working on and for Bluestone PIM.

## What this is

A stakeholder mockup / community landing page. Single static HTML file, no framework, no build step. Deployed on Vercel.

- Live URL: https://bluestone-labs-landing.vercel.app
- GitHub: https://github.com/leafleaf90/bluestone-labs-landing

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

Edit `projects.json` and open a PR. Each entry takes:

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

If the domain changes, update the absolute URLs in the `og:image`, `twitter:image`, and `og:url` meta tags in `index.html`.

## Local development

```bash
python3 -m http.server 8000
```

Open http://localhost:8000.

## Deploy

Push to `main`. Vercel deploys automatically on push.

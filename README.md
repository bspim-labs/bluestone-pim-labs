# Bluestone PIM Labs

Landing page for [Bluestone PIM Labs](https://bluestone-labs-landing.vercel.app): a community space for open tools and experiments built by people who use and work with Bluestone PIM.

## What this is

A directory of community-built projects for Bluestone PIM. Partners, customers, and independent builders can submit projects to be listed here. The page is intentionally minimal: a project card, a description, and a link.

The first listed project is the [Unofficial MCP Server](https://bluestone-mcp-unofficial.vercel.app/connect), which connects Claude, Cursor, and ChatGPT directly to a Bluestone PIM organisation.

## Contributing

To submit a project, open a pull request editing `projects.json`. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full process, required fields, and naming conventions.

Not ready for a PR? [Open an issue](https://github.com/bspim-labs/bluestone-pim-labs/issues/new/choose) using the project submission template.

## Building a docs site

The [Site Template](https://github.com/leafleaf90/bluestone-pim-labs-site-template) is a single HTML file you can fork for your project: sidebar, dark mode, copyable markdown source, and consistent Labs visual identity. No build step, deploys to Vercel in one click.

## Stack

- `index.html`: single file, Tailwind CSS from CDN
- `projects.json`: project data, rendered at page load
- `blog/`: static blog post pages generated at build time
- `vercel.json`: routes and output directory config

## Local development

```bash
npm run serve
```

Opens at `http://localhost:8000`. Do not use `python3 -m http.server` or `vercel dev`.

## Code of conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

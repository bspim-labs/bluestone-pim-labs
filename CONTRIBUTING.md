# Contributing to Bluestone PIM Labs

## Adding your project

1. Fork this repo and create a branch.
2. Edit `projects.json` and add your entry:

```json
{
  "name": "Your Project",
  "description": "One or two sentences.",
  "url": "https://your-project.com",
  "github": "https://github.com/your-org/your-repo",
  "status": "live",
  "cta": "View setup guide",
  "icon": "terminal"
}
```

**Required fields:** `name`, `description`, `url`, `status`

**`status` options:** `live`, `beta`, `wip`, `archived`

**`icon` options:** `terminal`, `default`

3. Open a pull request. The `validate-projects.json` GitHub Actions check runs automatically and will catch any schema errors before review.

Not ready to open a PR? [Open an issue](https://github.com/bspim-labs/bluestone-pim-labs/issues/new/choose) using the project submission template instead.

## What gets listed

Any project that relates to Bluestone PIM in a useful way. Customers, SI partners, and independent builders are all welcome. The only requirement is that the project is real and accessible via the URL you provide.

## Naming conventions

If you are building a new community repo under `bspim-labs`, follow this pattern:

- Use the prefix `bluestone-pim-unofficial-` for all community-built tools and integrations
- Name by function, not technology: `bluestone-pim-unofficial-mcp-catalogue` rather than `bluestone-pim-unofficial-mcp-2`
- Keep "unofficial" in the name to make clear it is a community project, not an official Bluestone PIM product

## Other contributions

Bug reports and improvements to the site itself are welcome too. Use the bug report issue template or open a PR directly.

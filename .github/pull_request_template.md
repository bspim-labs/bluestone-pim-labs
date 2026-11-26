## Project submission checklist

- [ ] Added entry to `projects.json`
- [ ] All required fields present: `name`, `description`, `github`, `status`
- [ ] Optional `author` / `authorUrl` added if you want a display name on the card
- [ ] `status` is one of: `live`, `beta`, `wip`, `archived`
- [ ] URLs start with `https://`
- [ ] `github` URL (if included) points to `https://github.com/`
- [ ] Description is one or two sentences, no em dashes
- [ ] Optional `slug` set if you want a stable `/#slug` link to the project modal (lowercase letters, digits, dashes, unique)
- [ ] Optional `details` added for a longer modal text (plain text, blank line starts a new paragraph)
- [ ] Optional `screenshots` (max 5, each with `src` and `alt`): `https://` URLs, or WebP files in `public/projects/<slug>/` (run `node scripts/optimize-images.js`)

The `validate-projects.json` CI check will run automatically and flag any schema errors.

# Development

## Hosting

Production hosting is AWS Amplify. The app settings live in the Amplify console rather than in repository config files.

Pushes to the connected branch trigger Amplify. The pipeline should run `npm run build` so `posts.json`, `public/og-image.jpg`, `blog/**/index.html`, and `sitemap.xml` stay fresh.

## Local Development

```bash
npm run serve
```

Open `http://localhost:8000`. This local server handles clean URLs and blog routing.

Do not use `python3 -m http.server` for full routing checks. It does not handle hosting rewrites, so `/blog/...` will not behave like production.

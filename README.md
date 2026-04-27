# Calendar IA — merged-calendar prototype

Vue 3 + Vite prototype exploring the merge of GoHighLevel's 5 legacy calendar types (Personal, Round Robin, Class, Collective, Event) into a single unified calendar.

The product spec / source of truth lives in [MERGE_TYPES_DISCUSSION.md](MERGE_TYPES_DISCUSSION.md). 61 locked decisions, full settings matrix, edge-case ledger, AI setup flow proposal, and per-session implementation logs.

## Run locally

```bash
cd prototype
npm install
npm run dev
```

Open http://localhost:3005/setup/meetings/new for the wizard. The booker widget at full size lives at `/booker-preview` (with a one-click scenario picker for validating different shapes).

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the prototype and publishes it to GitHub Pages. The deployed URL pattern is:

```
https://<your-username>.github.io/<repo-name>/
```

For other deploy targets (Netlify Drop, Surge, Vercel) see the discussion doc — `prototype/public/_redirects` is in place for SPA routing fallback.

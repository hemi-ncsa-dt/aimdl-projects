# AIMD-L Project Proposal Manager

Frontend for submitting and tracking project proposals for **AIMD-L** (Automated
Materials Design Lab), part of CAIMEE / HEMI at Johns Hopkins University.

Researchers draft a proposal, describe the work, list team members and the instruments
they need, attach supporting documents, and submit it for review. Each proposal becomes
a project with its own DOI, Girder collection and user group.

This is a single-page app only. It talks to a separate [Girder](https://girder.readthedocs.io/)
backend (Python/MongoDB) over REST; there is no server code in this repository.

## Stack

Vue 3 (`<script setup>`) · TypeScript · Vite · vue-router · Pinia · Vuetify

## Setup

```sh
npm install
npm run dev
```

Point the app at a backend with `VITE_API_BASE_URL` in `.env.local`:

```sh
VITE_API_BASE_URL=https://girder.example.org/api/v1
```

Sign-in goes through the Girder instance's configured OAuth provider, so the backend
must be reachable for the app to get past the login screen.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Type-check, then build to `dist/` |
| `npm run type-check` | `vue-tsc` only |
| `npm run lint` | ESLint with `--fix` |
| `npm run preview` | Serve the production build locally |

Requires Node `^20.19.0 || >=22.12.0`. There is no test suite.

## Deployment

The image serves the built app from nginx and is configured **at container start**, not
at build time: `99-vite-envsubst.sh` writes `/env-config.js` from the container's
environment, so one image can be pointed at any backend.

```sh
docker build -t aimdl-proposal-manager .
docker run -p 8080:8080 -e VITE_API_BASE_URL=https://girder.example.org/api/v1 aimdl-proposal-manager
```

See [DOCKER.md](DOCKER.md) for details.

## Documentation

- [DOCKER.md](DOCKER.md) — building, running and configuring the container
- [MARKDOWN_SUPPORT.md](MARKDOWN_SUPPORT.md) — the markdown subset allowed in descriptions
- [CLAUDE.md](CLAUDE.md) — architecture notes and conventions for working in this repo
- [UX_PLAN.md](UX_PLAN.md) — phased plan for fixing the Edit Proposal form

## License

MIT — see [LICENSE](LICENSE).

# CLAUDE.md

Guidance for working in this repository.

## What this is

`aimdl-projects` — the **AIMD-L Project Proposal Manager**: a Vue 3 SPA where researchers
draft, submit, and track project proposals for AIMD-L (Automated Materials Design Lab,
part of CAIMEE / HEMI at JHU).

There is **no backend in this repo**. The app is a pure frontend against a
[Girder](https://girder.readthedocs.io/) REST API (Python/MongoDB) with a custom
`/project` endpoint plugin. Deployed at `projects.htmdec.org`.

## Commands

```sh
npm install
npm run dev          # Vite dev server
npm run type-check   # vue-tsc --build (incremental; silent output == success)
npm run build        # type-check + vite build
npm run lint         # eslint . --fix --cache
npm run preview      # serve the production build
```

There are **no tests and no test runner configured** — ignore
`.github/copilot-instructions.md` where it mentions `npm run test` and Vitest.
Node `^20.19 || >=22.12` is required.

## Stack

Vue 3 (`<script setup>`) · TypeScript · Vite 7 · vue-router · Pinia · Vuetify 4 ·
`@mdi/font` icons · lodash (`debounce` only).

`marked` and `vue-markdown-editor` are in `package.json` but **unused** — markdown is
hand-rolled with regex (see below). Don't assume they're wired up.

## Layout

```
src/
  main.ts                 app bootstrap + global router auth guard
  router/index.ts         4 routes: proposals, proposal-detail, proposal-edit, login
  plugins/vuetify.ts      Vuetify with all components/directives registered globally
  types/index.ts          every API interface & enum lives here
  utils/markdown.ts       the only markdown renderer (escapes before rendering)
  constants/project.ts    instrument / project-type / access-category options + labels
  services/api.ts         ALL fetch calls; no other file talks to the network
  stores/auth.ts          Girder token + current user
  stores/project.ts       project list / currentProject CRUD
  views/                  ProposalsView, ProposalDetailView, ProposalEditView, LoginView
  components/             AppBar, ProjectForm, FileUploader, MarkdownEditor
```

## Auth model (Girder OAuth)

1. `LoginView` calls `getLoginProviders(redirectUrl)` and redirects the browser to the
   chosen provider URL.
2. Girder redirects back with `?girderToken=...`. The **global guard in `src/main.ts`**
   plucks it from the query string, stores it, and scrubs it from the URL via
   `history.replaceState`.
3. The token lives in `sessionStorage` under `girderToken` and is mirrored in
   `useAuthStore().token`.
4. Every API call passes it as the `Girder-Token` header. `api.ts` functions all take
   `token` as an explicit argument — they never read the store themselves.
5. The guard runs `fetchUser()` on **every navigation** and bounces to `/login` when
   there is no user. `logout()` does a hard `window.location.href = '/login'` on purpose,
   to force the guard to re-run.

## API configuration

Base URL resolution in `src/services/api.ts`:

```ts
window.ENV?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
```

- Dev: `.env.local` (`VITE_API_BASE_URL`) and `public/env-config.js`.
- Prod: `99-vite-envsubst.sh` runs as an nginx entrypoint hook and regenerates
  `/usr/share/nginx/html/env-config.js` from container env vars, so the **same image
  works against any backend**. `index.html` loads `/env-config.js` before `main.ts`.

When adding config, update *all* of: `.env.local`, `public/env-config.js`,
`99-vite-envsubst.sh`, and `DOCKER.md`.

File downloads go through `getFileDownloadUrl()` in `api.ts`, which uses the same
resolution and appends `?token=`. The token must be in the query string: an `<a href>`
download cannot set the `Girder-Token` header, and Girder answers **401** without it.

## Domain model (`src/types/index.ts`)

- **Project** — the proposal. `_id` is a DOI; `projectId` is the human-facing ID shown as
  `{projectId}: {name}`. Statuses: `draft → under review → accepted | rejected`.
  Only `draft` proposals are editable/deletable in the UI.
- Backend-derived fields never sent on create: `_id`, `owner`, `created`, `updated`,
  `submissionFolderId`, `projectId`. The `Omit<...>` in `createProject` encodes this.
- **The backend fills in defaults the client never sent.** `POST /project` returns
  `projectType: 'integrated'` and `priority: 0` even when both are omitted. So a "blank"
  draft is never blank: the edit form shows *Integrated project* pre-selected, and
  `priority: 0` is the falsy "unset" sentinel (there is no access category 0). Verified
  against the live dev API, not inferred.
- **ProjectMember** — freeform person (first/last/email/ORCID/role) with an optional
  `userId` linking to a real Girder `Person`. Roles: `PI`, `manager`, `user`.
- **Instruments** — the three real AIMD-L stations are `MAXIMA`, `HELIX`, `SPHINX`; the
  form adds an `other` checkbox whose free text is stored as the instrument name.
  `KNOWN_INSTRUMENTS` in `constants/project.ts` is what distinguishes them on load.
- **priority** — 1–6 "access category" (CAIMEE PI … external researcher).
- **Girder primitives** — `Folder`, `Item`, `File`, `Group`, `Person` interfaces exist in
  `types/index.ts` (several are declared but not yet used). A project gets a collection
  and a `submissionFolderId` created server-side; uploads go into that folder.
- **Sample** — Girder `deposition` model keyed by IGSN. Present in the types and on
  `Project.samples`, but there is **no sample UI yet**.

## Creating a proposal

"Start a New Proposal" in `ProposalsView.vue` immediately `POST`s a `draft` project named
`New Draft Proposal` (with the current user pre-added as `PI`) and routes to its detail
page. There is no client-side-only draft — a server record exists from the first click,
which is what makes `submissionFolderId` available for uploads.

## File uploads

`FileUploader.vue` implements Girder's chunked upload by hand:
`POST /file` (initiate) → `POST /file/chunk` in 5 MB slices → the final chunk's response
is the `file` object. Deletion removes the parent **item**, not the file. The component
is only rendered once `project.submissionFolderId` exists, i.e. after the project has
been created server-side.

## Markdown

Descriptions are stored as plain markdown text (never HTML) so MongoDB storage stays
trivial. `src/utils/markdown.ts` is the single implementation: `renderMarkdown()` for
the two `v-html` sinks (detail view, editor preview) and `stripMarkdown()` for the
truncated list view. Only bold, italic, and line breaks are supported.

`renderMarkdown()` HTML-escapes the source **before** applying the substitutions,
because its output goes straight into `v-html`. This is load-bearing: descriptions are
author-controlled, and before the escape was added a stored description could execute
arbitrary JavaScript in any viewer's browser. Keep the escape first if you extend it,
or switch to a real sanitizer.

## Conventions

- `<script setup lang="ts">` everywhere; Composition API only.
- Path alias `@/` → `src/`.
- Pinia stores are setup-style (`defineStore('name', () => {...})`).
- All types/interfaces go in `src/types/index.ts`; all HTTP goes in `src/services/api.ts`.
- Option lists shown in more than one place (instruments, project types, access
  categories) and their display labels live in `src/constants/project.ts` — the form and
  the detail view both read from there. Don't re-declare them in a component.
- Stores own loading/error state; views read it via `storeToRefs`. `currentProject`
  survives navigation, so a detail template must test `loading` **before** the project,
  or a stale proposal flashes while the next one loads.
- `.editorconfig` says 2-space indent, but **existing `src/` files use 4 spaces**. Match
  the file you're editing.
- Styling is a mix: Vuetify components inside forms, hand-written scoped CSS with
  BEM-ish class names elsewhere (`.proposal-item__name`). `src/assets/*.css` are empty.

## Local dev stack

The whole stack (Girder, Mongo, Traefik) runs under Docker Swarm on the dev host as the
`wt_*` services. The `wt_projects` service bind-mounts this working tree into a
`node:22-bookworm` container running `npm run dev`, so **edits here are live immediately**
at https://projects.local.xarthisius.xyz (Girder at https://girder.local.xarthisius.xyz).
Both use a self-signed cert — pass `-k` / `ignoreHTTPSErrors`.

To drive the real UI end-to-end, hit `/?girderToken=<token>`: the guard in `main.ts`
picks the token out of the query string, so no OAuth round-trip is needed. Globus is the
only configured provider and can't be automated. Self-registration on the dev Girder is
open (`POST /api/v1/user` returns `authToken.token`), which is the easiest way to get a
throwaway session — delete the user and its projects afterwards. An invalid token makes
`GET /user/me` return `null` with HTTP 200, not a 401.

## Gotchas

- **`ProjectForm.vue` is presentational.** It owns no persistence: it copies the
  `project` prop into local state and emits `save` / `submit` / `cancel` with the
  payload. The parent does the fetching, the `updateProject`/`createProject` call, the
  navigation, and feeds back `saving` / `submitting` / `v-model:error`. Don't reintroduce
  store writes or `useRoute()` into the form.
- Deleting a proposal lives only on `ProposalDetailView` (drafts only). The form has no
  delete affordance.
- Untracked in the repo root: `DOCKER.md`, `MARKDOWN_SUPPORT.md`, `vision.pdf`.
  `README.md` is still the unmodified Vue/Vite scaffold text.

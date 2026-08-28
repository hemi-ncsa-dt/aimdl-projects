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

Vue 3 (`<script setup>`) · TypeScript · Vite 7 · vue-router · Pinia · Vuetify 4 (alpha) ·
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

Known inconsistency: `getDownloadUrl()` in `ProposalDetailView.vue` uses
`import.meta.env.VITE_API_BASE_URL` directly, bypassing the `window.ENV` runtime
override — it breaks in Docker unless the URL is also baked in at build time.

## Domain model (`src/types/index.ts`)

- **Project** — the proposal. `_id` is a DOI; `projectId` is the human-facing ID shown as
  `{projectId}: {name}`. Statuses: `draft → under review → accepted | rejected`.
  Only `draft` proposals are editable/deletable in the UI.
- Backend-derived fields never sent on create: `_id`, `owner`, `created`, `updated`,
  `submissionFolderId`, `projectId`. The `Omit<...>` in `createProject` encodes this.
- **ProjectMember** — freeform person (first/last/email/ORCID/role) with an optional
  `userId` linking to a real Girder `Person`. Roles: `PI`, `manager`, `user`.
- **Instruments** — the three real AIMD-L stations are `MAXIMA`, `HELIX`, `SPHINX`; the
  form adds an `other` checkbox whose free text is stored as the instrument name.
  `KNOWN_INSTRUMENTS` in `ProjectForm.vue` is what distinguishes them on load.
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
trivial. Rendering is a small regex chain duplicated in **three** places:
`MarkdownEditor.vue` (`renderMarkdown`), `ProposalDetailView.vue` (`renderMarkdown`),
and `ProposalsView.vue` (`stripMarkdown`, for the truncated list view). Only bold,
italic, and line breaks are supported. Change one, change all three.

The rendered HTML goes through `v-html`. It is *not* sanitized — description text is
author-controlled, so treat any widening of the markdown feature set as a XSS question.

## Conventions

- `<script setup lang="ts">` everywhere; Composition API only.
- Path alias `@/` → `src/`.
- Pinia stores are setup-style (`defineStore('name', () => {...})`).
- All types/interfaces go in `src/types/index.ts`; all HTTP goes in `src/services/api.ts`.
- Stores own loading/error state; views read it via `storeToRefs`.
- `.editorconfig` says 2-space indent, but **existing `src/` files use 4 spaces**. Match
  the file you're editing.
- Styling is a mix: Vuetify components inside forms, hand-written scoped CSS with
  BEM-ish class names elsewhere (`.proposal-item__name`). `src/assets/*.css` are empty.

## Gotchas

- **`ProjectForm.vue` is presentational.** It owns no persistence: it copies the
  `project` prop into local state and emits `save` / `submit` / `cancel` with the
  payload. The parent does the fetching, the `updateProject`/`createProject` call, the
  navigation, and feeds back `saving` / `submitting` / `v-model:error`. Don't reintroduce
  store writes or `useRoute()` into the form.
- Deleting a proposal lives only on `ProposalDetailView` (drafts only). The form has no
  delete affordance.
- **`ProposalDetailView.vue` doesn't render** `projectType`, `instruments`, or
  `priority`, even though the form collects them.
- `ProposalDetailView` bypasses `projectStore.fetchProject` and calls `getProject`
  directly while mutating the store's `loading`/`error` refs.
- Vuetify is pinned to a **4.0.0-alpha** release; API breakage between alphas is likely.
- `console.log` calls remain in `api.ts` and `ProjectForm.vue`.
- Untracked in the repo root: `DOCKER.md`, `MARKDOWN_SUPPORT.md`, `vision.pdf`.
  `README.md` is still the unmodified Vue/Vite scaffold text.

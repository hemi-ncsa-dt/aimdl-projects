# Proposal form — content plan

Implementation plan for the ten changes in `01_user_feedback_raw.md`
(Todd Hufnagel, 2026-09-14), plus the two proposal-content outlines appended to it.

**Surfaces:** `/proposal/:id/edit`, `/proposal/:id`, `/proposals`
**Components:** `ProjectForm.vue`, `FileUploader.vue`, `ProposalDetailView.vue`,
`src/constants/project.ts`, `src/types/index.ts`
**Backend:** `girder-jsonforms` (`~/codes/wholetale-ng/girder-jsonforms`) — **not optional**,
see Blocker B1.
**Status:** ready to implement. All nine decisions are settled (struck through below).
The only remaining dependency is blocker **B1** — the `girder-jsonforms` schema work, which
every phase is sequenced behind.

## Severity

| Label | Meaning |
| --- | --- |
| **Blocker** | Nothing in the dependent phase can ship until it is resolved. |
| **Needs Todd** | Implementable, but the spec as written is ambiguous or incomplete. |
| **Straightforward** | Spec is clear; it is ordinary work. |

---

## Blockers and scope notes — read these first

B1 and B2 block work. B3 is not a blocker; it is the part of item 3 that is easy to
misread.

### B1. The backend rejects every new field — **Blocker**

`girder_jsonforms/models/project.py` validates each project against `project_schema`,
which ends with `"additionalProperties": False`. `members` items carry the same clause and
their `role` is a closed enum `["PI", "manager", "user"]`. Every field below — organization,
data classification, safety, funding, assistance, per-member status/flags — is an
unknown property today, so `PUT /project/:id` raises `ValidationException` and answers
**400**. Nothing is silently dropped; the save simply fails.

A second gate sits behind it: `Project.initialize()` lists `exposeFields(...)` and both REST
handlers are wrapped in `@filtermodel`. A field that is stored but not exposed never comes
back from the API, so the form would look like it lost the value on reload.

- **Change:** for each new field — add the property to `project_schema`, add the name to
  `exposeFields`, and (for anything with a default) seed it in `Project.validate()`.
- **Files:** `girder_jsonforms/models/project.py`
- **Consequence for sequencing:** the backend change for a phase has to be *running* before
  the frontend for that phase is testable at all. Treat each phase as backend-first.
- **How that is being done:** all backend work for this plan lands on the
  `projects_updates` branch of `girder-jsonforms` (Phase 0 is `a290eb9`), with a single PR
  raised and merged once the whole task is finished. So "backend first" means the dev
  stack's Girder has to be running that branch — the plugin is live-mounted, but Python
  changes need a Girder restart to take effect. Nothing is merged to `main` in between.

### B2. `members[].role` is load-bearing in the backend — **Blocker** (affects item 8)

Todd asks to replace *role* with *status* (faculty/staff/post-doc/…). Role is not just a
label:

- `lib/events.py::_role_to_access_level()` maps `PI → ADMIN`, `manager → WRITE`,
  everything else → `READ`. On acceptance, members with a `userId` are added to the
  project's Girder group at that level, which is what grants them access to the project
  collection and its data.
- `lib/mail.py::submitter_emails()` and `_submitter_name()` select members whose role is
  `PI` to decide who receives the accept/reject notification.

So `role` is the permission model, and *status* (career stage) is a different axis
entirely. Removing `role` would silently flatten everyone to read-only on accepted
projects and break decision e-mails.

- **Recommendation:** keep `role` as the stored permission axis, drive it from the UI
  checkboxes (PI checkbox → `role: 'PI'`), add `status` as a new independent field, and
  retire the word "manager" from the form by giving the remaining write-access case a
  plain name. See 4.1 and 4.2.

### B3. The classification describes *future lab data*, not the proposal — **Straightforward**, but easy to get wrong

`dataClassification` is not a statement about the PDF being uploaded here. It describes the
material the applicant will bring to AIMD-L and the data the instruments will generate from
it, and it exists to tell AIMD-L staff how that data has to be handled once it exists.

What it does **not** do is change who gets access. Access defaults to the project's own
members for every project alike, whatever the classification — which is already what
acceptance does: `lib/events.py::ensure_group()` creates a group named after the project,
adds every member that has a `userId`, creates the project's data collection and grants the
group `READ` on it, with the collection non-public. So there is no branching to build and no
code change behind this item.

- **Change:** none in `events.py`. The field is collected, stored and displayed; staff read
  it and act on it outside the system. Phase 5.3 is only about making sure they can see it.
- **Consequence worth stating once:** since classification never narrows the member list, a
  `confidential-controlled` project grants data access to every member including any marked
  *external (foreign, non-US)*. Tightening that is a manual step by staff on the collection,
  not something the form or acceptance does.
- **Not a gap:** `ensure_group()` only seeds the initial access set, and the submitter
  necessarily has an account to have filed the proposal at all. Members typed in freeform
  with no `userId` are simply not part of that seed. Everything afterwards is managed
  directly in Girder — including sharing results with people who were never on the project
  — so the group is a starting point, not the access model.

---

## Decisions needed

| # | Question | Why it blocks |
| --- | --- | --- |
| ~~**D1**~~ | ~~Does the new list replace the priority ordering or only the labels?~~ **Settled: the five JHU tiers were never used for allocation.** `accessCategory` is a plain affiliation taxonomy with no ranking, and `priority` is deleted rather than replaced. See 1.1. | — |
| ~~**D2**~~ | ~~How many real proposals exist in production?~~ **Settled: none.** Production holds only test/mock proposals; they can be dropped and the project-ID counter rolled back. No migration, no back-compat. See 0.2. | — |
| ~~**D3**~~ | ~~Should acceptance set ACLs from `dataClassification`?~~ **Settled: no.** Access defaults to the project's own members regardless of classification — which is what `ensure_group()` already does. The field is advisory; no branching is built. See B3 and 5.3. | — |
| ~~**D4**~~ | ~~What is the URL of the data policy?~~ **Settled:** `https://docs.htmdec.org/aimdl/data-management/` — a stub today, but the page the policy will live on or near. See 1.3. | — |
| ~~**D5**~~ | ~~Is one member both PI and point of contact by default?~~ **Settled: ticking PI also ticks point of contact.** It stays a separate, movable checkbox so a postdoc can take day-to-day contact. See 4.1. | — |
| ~~**D6**~~ | ~~Is an ORCID required for every member?~~ **Settled: yes, for everyone.** The proposal is published to ORCID as a research resource, so every member needs an iD. The existing `orcidRule` stays as-is. See 4.4. | — |
| ~~**D7**~~ | ~~What does a development project require?~~ **Settled: very little.** Development projects are lab staff changing AIMD-L infrastructure; submitters are already known to reviewers, so the bar is low. See 2.5. Replaced by **D9**. | — |
| ~~**D8**~~ | ~~The integrated-proposal outline jumps 1, 2, 4, 5, 6 — what was item 3?~~ **Settled: nothing is missing.** Checked against Todd's original message, which lists the five points unnumbered. The numbering in `01_user_feedback_raw.md` (lines 61–65) is a transcription artefact. | — |
| ~~**D9**~~ | ~~Who may choose project type **development**?~~ **Settled: anyone may pick it; the reviewer decides whether it was appropriate.** No enforcement rule exists yet, so none is built. See 2.5. | — |

---

## Phase 0 — Backend schema and data model

Everything else depends on this. One PR against `girder-jsonforms`.

### 0.1 Extend `project_schema` and `exposeFields` — **Straightforward**

New top-level properties:

```
accessCategory       string enum  jhu | external-academic | external-corporate
                                  | external-government | external-foreign
organization         string
dataClassification   string enum  open | confidential-proprietary
                                  | confidential-controlled | opt-out
assistanceRequired   boolean
daysRequested        string       free text, per item 9's "text box entry"
experimentPlan       string       the inline single-instrument proposal (item 9)
safety               object       { sampleHazards: [string], otherHazards: [string],
                                    description: string }
funding              object       { grants: [{ agency, grantNumber }],
                                    internalBudgetNumber: string }
```

New `members[]` properties: `isPointOfContact` (bool), `onSite` (bool),
`status` (enum: faculty | staff | postdoc | grad | undergrad | other),
`institution` (string). `role` stays — see B2.

- **Risk:** low, but `additionalProperties: False` means a frontend deployed ahead of the
  backend breaks *saving entirely*, not just the new fields. Deploy backend first.
- **`priority` is deliberately left in place here.** Additions are backward-compatible;
  the *removal* is not. `ProjectForm.buildPayload()` still puts `priority` in every
  payload, so dropping it from the schema in this phase would make the current frontend
  400 on every save — the exact failure this phase exists to avoid. It comes out in the
  1.1 commit, together with the frontend change that stops sending it.
- **Not made `required` in the schema, despite 0.2 allowing it.** Drafts save with
  anything (UX_PLAN decision D1) and the backend cannot tell a half-filled draft from a
  submission, so server-side requiredness would block the save path the form depends on.
  If the submit gate is ever worth enforcing server-side, the shape is a draft-07
  `if status != draft then required: [...]`, not a flat `required`.

**Status: done** — committed to `girder-jsonforms` as `a290eb9` on `projects_updates`.
Schema and `exposeFields` extended, `girder_jsonforms/tests/test_project_fields.py`
added (16 tests: round-trip through create, update and fetch; unset fields stay unset;
every enum and both `additionalProperties: False` boundaries rejected). Full project suite
green.

### 0.2 No migration — drop the test data instead — **Straightforward**

Production holds only test and mock proposals. They get deleted and the `ProjectCounter`
sequence rolled back, so there is no migration script, no lossy old→new mapping and no
back-compat to carry.

This is worth more than the hour it saves, because it changes what the rest of the plan is
allowed to do:

- `priority` can be **removed** from `project_schema` and `exposeFields` outright rather
  than deprecated in place (1.1). No sentinel-zero handling to preserve.
- `members[].role` can change shape freely if B2's recommendation is ever revisited — the
  constraint there is the backend's permission logic, not stored records.
- `FileType.CV` can be **deleted**, not merely hidden (2.4).
- Any field added in Phase 0 can be made `required` in the JSON schema from day one,
  instead of optional-for-the-sake-of-old-rows.

Do the deletion once, immediately before Phase 0 ships, rather than per phase — dropping
projects while the schema is in flux just makes it ambiguous which failures are real.
`Project.remove()` also removes the submission folder, so deleting through the model (not
straight out of Mongo) keeps the folders from being orphaned.

---

## Phase 1 — Who is asking, and how open is the work

Items 1, 2, 3, 4, 10. These answers gate what the rest of the form asks for, so they come
first and move to the top of the form.

### 1.1 Replace the access categories (item 1) — **Straightforward**

Swap `priorityOptions` for the five new categories, stored as the string enum
`accessCategory`. Nothing in the new list is ranked — the old numbering implied an ordering
the lab never allocated on — so there is no priority to preserve and no second field to
add. Delete `priority` from `project_schema`, `exposeFields`, `types/index.ts`, the form
and the detail view; with no real rows to migrate (0.2) it leaves nothing behind.

The CAIMEE-PI / primary-partner / HEMI-fellow / WSE-faculty distinctions collapse into
"Johns Hopkins University" and are simply gone. That is the intent.

- **Files:** `src/constants/project.ts`, `src/types/index.ts`, `ProjectForm.vue`,
  `ProposalDetailView.vue`
- **Note:** the `priority: 0` falsy-sentinel dance (CLAUDE.md) goes away with the field.
  `accessCategory` is simply absent until chosen, and the detail view keeps rendering
  "Not specified". Update CLAUDE.md's domain-model section, which documents the sentinel.

### 1.2 Organization for external users (item 2) — **Straightforward**

Text field, shown and required at submit when `accessCategory` is any `external-*`.

- **Watch:** this overlaps with item 8's per-member institution. Treat project-level
  `organization` as the PI's/home institution and the per-member field as an override,
  labelled "Institution (if different from the PI's)". Otherwise the same string gets
  typed twice and the two disagree.

### 1.3 Data classification (item 3) — **Straightforward**

Four-option radio group with the full descriptions as helper text, plus a link to
`https://docs.htmdec.org/aimdl/data-management/`. Required at submit.

- **The policy page is a stub today**, which decides how the link is worded. The four
  descriptions in the form have to stand on their own — an applicant who clicks through
  must not be the one who discovers the page is empty. Label it "More about how AIMD-L
  handles data" rather than "defined in detail in the data policy", and keep it secondary
  to the inline text. If the page later grows a canonical definition of the four
  categories, the form's wording should be replaced by it rather than drift alongside it.
- Fix the typo in the source wording: "propritary" → "proprietary".
- "Opt-out (neither confidential nor proprietary but with restrictions on dissemination)"
  will not be self-explanatory to an applicant. It is the one category that needs better
  wording than the source gives it, and the stub page cannot supply it yet — worth a
  sentence from Todd when the page is written.
- Render prominently on the detail view — it is what tells staff how the project's data
  must be handled once it exists (B3).
- Word the field so applicants understand it is about their samples and the resulting
  measurements, not about the proposal they are uploading. "How must the data generated by
  this project be handled?" rather than a bare "Data classification".

### 1.4 Public overview: conditional, and better guidance (item 4) — **Straightforward**

Require the description only when `dataClassification` is `open` or `opt-out`. Add Todd's
abstract guidance verbatim as helper text above the markdown editor.

Two things the change exposes:

- **`/proposals` and the detail view both render the description.** A confidential proposal
  will now legitimately have none, so both need an explicit empty state rather than a blank
  row. `stripMarkdown()` on an empty string already returns empty — it is the surrounding
  layout that needs the fallback.
- **"This abstract will be publicly available after the proposal has been accepted" is a
  promise nothing currently keeps.** `public` defaults to `False` on the project and
  nothing ever flips it, and there is no public-facing listing. Either soften the sentence
  to "may be made publicly available", or file the publishing mechanism as separate work.
  Do not ship text that asserts a behaviour the system does not have.

### 1.5 Funding (item 10) — **Needs Todd**

Repeatable rows of *funding agency* + *grant number*, plus a separate *budget/IO number*
field shown when `accessCategory` is `jhu`. Repeatable because multi-grant support is
common and a single pair cannot express it.

- Todd scoped this to "academic/not-for-profit". Unclear what corporate, government and
  foreign applicants should see — most likely a contract or PO reference, but that is a
  guess. Until confirmed, show the agency/grant rows for `jhu` and `external-academic`
  only, and nothing for the rest.
- Not required at submit unless Todd says otherwise.

---

**Phase 1 status: done.** Backend `priority` removal on `projects_updates`; frontend across
`types/index.ts`, `constants/project.ts`, `ProjectForm.vue`, `MarkdownEditor.vue`,
`ProposalDetailView.vue`, `ProposalsView.vue`. `CLAUDE.md`'s domain model updated. Verified
with 25 Playwright assertions against the live dev stack — category list, conditional
organization, classification gating the overview, the submit refusal, save round-trip,
detail rendering, both empty states, and a 400 on a payload still carrying `priority`.

Two things worth knowing for the phases ahead:

- `MarkdownEditor` gained a `rules` prop so the overview takes part in the form's submit
  gate, and its `insertMarkdown` no longer resolves the textarea with a page-wide
  `document.querySelector('textarea')` — that grabbed whichever editor came first in the
  DOM, which 2.3's inline `experimentPlan` field would have broken.
- `npm run lint` runs with `--fix`, so it rewrites files. Don't run it against a stashed
  tree: it leaves modifications that make `git stash pop` refuse. Baseline is 14
  pre-existing errors in files this plan does not touch.

---

## Phase 2 — What the experiment is

Items 5, 6, 9 and the two proposal outlines.

### 2.1 Instrument descriptions (item 5) — **Straightforward**

`instrumentOptions` currently carries the acronym expansions ("Multimodal Automated X-ray
Investigation of Materials"). Todd wants the *technique*:

| Instrument | New description |
| --- | --- |
| HELIX | laser microflyer impact / laser-driven shock |
| MAXIMA | x-ray diffraction / x-ray fluorescence spectroscopy |
| SPHINX | nanoindentation |

- Keep the expansion as a `title` tooltip rather than deleting it; it is the only place the
  acronym is explained.
- The "Other → free text" behaviour Todd asks for **already exists** (`otherInstrumentText`,
  stored as the instrument name, recognised on load via `KNOWN_INSTRUMENTS`). Verify, don't
  rebuild.
- **Files:** `src/constants/project.ts` only.

### 2.2 Staff assistance question (item 6) — **Straightforward**

"Do you require assistance from AIMD-L staff for the experiments?" as a **required radio
pair**, not a checkbox — a checkbox cannot distinguish "no" from "not answered", and the
difference matters for scheduling.

### 2.3 Document guidance, split by project type (item 9) — **Straightforward**

Todd's two outlines describe two genuinely different submission shapes:

**Integrated (2+ instruments)** — an uploaded PDF, 2-page limit, containing: context and
motivation; knowledge gap or hypothesis; description of experiments (stations, samples,
measurements, analysis); expected data and outcomes tied back to the gap; estimated number
of days. (Five points, not six: the 1, 2, 4, 5, 6 numbering in `01_user_feedback_raw.md` is
a transcription artefact — Todd's original message lists them unnumbered. The raw file is
left as received rather than renumbered, since it is the record of what was sent.)

**Single-instrument** — "can be HTML form": collected inline, no PDF. Two fields —
description of experiments (samples, measurements, analysis) and number of days/half-days.

- **Change:** render the Documents section conditionally on `projectType`. For
  `integrated`, show the five-point checklist as guidance beside the uploader and require a
  `proposal`-typed file at submit. For `singleInstrument`, show the `experimentPlan`
  markdown field and `daysRequested`, and do not require an upload. For `development`,
  see 2.5.
- `daysRequested` is free text for both, per Todd.
- **Risk:** medium. This is the one item that changes the form's *shape* rather than adding
  to it, and `projectType` is pre-filled to `integrated` by the backend default (see
  CLAUDE.md), so a user who never touched the field lands on the stricter branch. Make the
  project-type choice explicit and early.

### 2.4 Document types: drop CV, add data management plan (item 9) — **Straightforward**

Remove `cv` from the `FileType` picker and from the section's helper text ("Attach the
proposal document and a CV for the PI" is now wrong). Add `dmp` — "Data management plan
(optional)".

- **Delete the `cv` enum member** rather than hiding it — nothing real is typed that way
  (0.2). The backend stores `files[].type` as a free string, so no schema work either way.
- Unrelated but adjacent: `FileUploader.updateFileType()` rebuilds the file object without
  `itemId`, so changing a type loses it. Deletion recovers by refetching, so nothing is
  broken today — worth fixing while in the file.

---

### 2.5 Development projects ask for almost nothing — **Straightforward**

Development projects are lab staff changing AIMD-L infrastructure, and the submitter is
already known to the reviewers. The form should reflect that rather than making staff fill
in an applicant questionnaire about themselves:

| Field | Development project |
| --- | --- |
| Proposal document | Not required. Reuse the single-instrument inline `experimentPlan` field — "what is being changed and why". |
| Days requested | Keep. It is still scheduling input. |
| Instruments | Keep. Which stations the work touches is the point. |
| Safety (item 7) | **Keep, and keep required.** Infrastructure work is where the lasers, high voltage and user-supplied equipment actually are. The low bar is about *review*, not about hazards. |
| Staff assistance (item 6) | Hide. Asking lab staff whether they need help from lab staff is noise. |
| Access category (item 1) | Default to `jhu`, don't ask. |
| Organization (item 2) | Hide. |
| Funding (item 10) | Hide, or internal budget number only. |
| Data classification (item 3) | Default to `open`. Infrastructure work produces no proprietary sample data; leave it changeable for the case where it does. |
| Public overview (item 4) | Not required — nothing here is a public abstract. |

That is close to the inverse of the integrated branch, so build the conditional sections
around a single `projectType` switch rather than scattering `v-if`s.

**Who may pick it: anyone.** Development is the cheapest route through the form — no
document, no funding, no public overview — so an applicant who should have filed an
integrated proposal could take it and skip those requirements. That is accepted: there is
no concrete rule to enforce yet, and the reviewer evaluates whether the choice was
appropriate. Leave the `v-select` open and build no gate.

The cost of that decision lands on the reviewer, which makes one thing load-bearing:
**project type must be impossible to miss when deciding.** A development proposal and a
starved integrated one look identical by their absences. Surface `projectType` at the top
of the detail view and, more importantly, on the Girder page where approve/reject actually
happens — see 5.2, which today shows only name, ID, status, description and samples. If a
rule does emerge later, this is where it would attach.

**Also worth a decision at some point:** acceptance registers every project with ORCID as a
research resource (4.4). An infrastructure change is probably not something staff want on
their ORCID record as a research proposal. Low priority — the feature is sandbox-only today.

---

**Phase 2 status: done.** Frontend only — Phase 0 had already taught the backend
`assistanceRequired`, `daysRequested` and `experimentPlan`, and `files[].type` is a free
string server-side, so nothing in `girder-jsonforms` needed touching. Verified with 34
Playwright assertions against the dev stack.

Notes for later phases:

- The form now branches on `projectType` in five places. They all read from
  `isDevelopment()` / `requiresProposalDocument()` in `constants/project.ts` rather than
  comparing strings in the template, so Phase 3 and 4 should keep adding predicates there.
- The required-proposal-document check cannot be a VForm rule — files are not a form
  field — so it sits beside the single-instrument conflict check at the top of
  `submitForReview()`. Any further cross-field gate belongs in the same place.
- `FileUploader.updateFileType()` no longer drops `itemId` when a type changes (noted in
  2.4). Deletion had been covering for it with a refetch.

---

## Phase 3 — Safety (item 7)

### 3.1 Hazard checklists — **Straightforward**

Two checkbox groups plus a description box:

- **Sample hazards:** None / Toxic / Flammable / Energetic / Biosafety / Radioactive / Other
- **Other hazards:** None / Laser (class 3–4) / High temperature / High voltage /
  Custom or user-supplied equipment

Behaviour the spec implies but does not state:

- **"None" is mutually exclusive** within its group — ticking it clears the rest and vice
  versa. Without that, "None + Radioactive" is submittable.
- **The description becomes required** at submit as soon as anything other than None is
  ticked in either group. A hazard ticked with no description is worse than no checklist.
- Each group should be required at submit — leaving both blank must not read as "no
  hazards".

### 3.2 Surface it to reviewers — **Straightforward**

Render the safety block near the top of `ProposalDetailView`, visually distinct. A safety
declaration buried below the file list is a safety declaration nobody reads.

### 3.3 Radioactive and biosafety need more than a checkbox — **Needs Todd**

Both normally require separate institutional approval (radiation safety / IBC) before work
starts. The form as specified records the hazard but asks nothing about approval status, so
AIMD-L would learn about it with no way to know whether it is cleared. Suggest either an
approval-reference field or helper text naming the separate process. Todd's call.

---

## Phase 4 — Team members (item 8)

Blocked on **B2** only. D5 and D6 are settled: PI implies point of contact, and every
member needs an ORCID iD.

### 4.1 PI, point of contact, on-site — **Straightforward**

Three per-member checkboxes. `isPI` drives the stored `role` (see B2) so backend permissions
and decision e-mails keep working.

**Rules:**

- Ticking **PI** also ticks **point of contact** on the same member. The PI is the contact
  unless somebody says otherwise.
- Point of contact stays its own checkbox and can be moved to another member afterwards —
  a postdoc taking day-to-day contact is the case Todd's separate checkbox is for. Moving
  it unticks the PI's, so there is always exactly one.
- Checking PI on a second member moves the PI flag rather than adding one: exactly one PI,
  exactly one point of contact, both enforced at submit.

`ProposalsView.startNewProposal()` already seeds the clicking user as `role: 'PI'`; it now
also sets `isPointOfContact`. That stays a seed, not a verdict — the common case of an
admin or postdoc opening the draft on someone else's behalf is handled by unticking PI on
themselves and ticking it on the real PI, which under the rules above moves the contact
flag with it.

### 4.2 Replace "manager" with career status — **Straightforward**

Add `status`: faculty/senior investigator, staff, post-doc, grad student, undergrad, other.
Keep the permission axis separate and rename it in the UI — "Data access: full / write /
read" says what `PI`/`manager`/`user` actually do, which "manager" never did.

### 4.3 Per-member institution — **Straightforward**

Optional text, placeholder "Same as PI". See the overlap note in 1.2.

### 4.4 ORCID guidance — **Straightforward**

Helper text under the ORCID field: required for every member, with a link to
`https://orcid.org/register`. The reason belongs in that text — the proposal is registered
with ORCID as a research resource on acceptance
(`worker_plugin/orcid.py::register_project_with_orcid`), so an iD is what puts the work on
a member's record. "Required because we publish this proposal to your ORCID record" is a
reason people act on; "required" alone is what they push back against.

`orcidRule` already enforces this for every member, so the validation needs no change —
only the explanation and the link.

**What collecting the iD does and does not buy (worth knowing before promising anything):**
the worker writes the research resource to **the creator's ORCID record only**, using that
user's own OAuth token from `user["otherTokens"]`; it never iterates `members[].orcidId`.
ORCID's member API needs a token carrying `/activities/update`, granted individually, so a
bare iD string cannot post to someone else's record. Registration is also gated on the
`jsonforms.orcid_research_resources` setting and on the provider having requested that
scope — per the comment in the worker, "this feature only works against the sandbox today".

So the iDs are correct to require and are what any future per-member registration would be
built on, but "the proposal appears on every member's ORCID record" is not what happens
yet. If that is the goal, it is separate work: each member would have to log in and
authorize. Flag rather than fix here.

*Adjacent, while in that file:* the payload's public `url` is built as
`https://projects.{domain}/proposa/{projectId}` — "proposa", and the project ID where the
sibling `external-id-url` correctly uses `_id`. Every registered resource therefore carries
a dead link.

### 4.5 Row layout — **Straightforward**

The member row is a six-column CSS grid tuned in the last UX pass (`.member-row`, with a
1024px wrap breakpoint). Adding three checkboxes, a status select and an institution field
takes it to eleven controls and the current grid will not hold. Re-cut each member as a
bordered two-row card rather than widening the grid — and keep the alignment property that
pass bought, where every row's fields line up.

---

## Phase 5 — Reviewer-side parity

### 5.1 Detail view renders every new field — **Straightforward**

Rule for every phase above: a field is not done until `ProposalDetailView` shows it. Data a
reviewer cannot see is data that was not collected. This is roughly half the work in each
phase and is easy to defer by accident.

### 5.2 The Girder admin review page shows almost nothing — **Needs Todd**

Approve/reject happens in the Girder web client
(`girder_jsonforms/web_client/templates/projectView.pug`), which renders only name, project
ID, status, description and samples. After this work a reviewer deciding on a proposal would
see none of: classification, access category, organization, safety, funding, instruments,
days requested, or the team. Either extend that template or confirm that reviewers use the
Vue app's detail view and the Girder page is only for the decision buttons.

---

### 5.3 Show the classification where ACLs get set — **Straightforward**

Reduced to its minimum by D3: acceptance keeps granting access to the project's members and
nothing branches on classification. No code change. All that is left is making the field
visible to the people who act on it — the detail view (1.3) and the Girder project page
(5.2), which is where a reviewer stands when the data collection comes into existence.

Worth recording, because it is the thing most likely to be misread later: **`ensure_group()`
seeds the initial access set and nothing more.** From acceptance onward, ACLs are managed in
Girder directly, and results are routinely shared with people who were never listed on the
proposal. So the member list is not an access-control list, and no part of this plan should
grow logic that treats it as one.

The only consequence for the form: don't word the team-member section as though adding
someone grants them access to anything.

---

## Verification

No test runner exists in this repo. Each phase is verified the way the UX plan's phases
were: Playwright against the live dev stack at `https://projects.local.xarthisius.xyz`
(self-signed — `ignoreHTTPSErrors`), authenticating via `/?girderToken=<token>` from a
throwaway self-registered Girder user, deleting the user and its projects afterwards.
`npm run type-check` is necessary but proves nothing about whether a field round-trips —
B1 means the only real check is a save followed by a reload.

Per phase: create a draft, fill the new fields, save, reload, confirm the values came back
(this is the `exposeFields` check), confirm the detail view renders them, and confirm the
submit-time rules fire when the fields are blank or contradictory.

# Edit Proposal form — UX plan

Sixteen findings from a review of `/proposal/:id/edit` (fifteen from the review, one
uncovered while implementing Phase 1), grouped into four phases.
Phase 1 stops the form from losing or accepting bad work; everything after that is
layout and visual consistency.

**Surface:** `/proposal/:id/edit`
**Components:** `ProjectForm.vue`, `FileUploader.vue`, `MarkdownEditor.vue`
**Evidence:** every finding below was checked against the local dev stack, not inferred
from reading the code.
**Status:** complete. Decisions D1–D3 settled 2026-08-28; all four phases implemented,
one commit per phase, verified against the dev stack (93 assertions across seven
Playwright suites).

## Severity

| Label | Meaning |
| --- | --- |
| **Broken** | Loses work, accepts invalid data, or is unusable at some viewport. Ship first. |
| **Inconsistent** | Works, but contradicts the rest of the app — palette, spacing, heading scale, page shell. |
| **Polish** | Nothing is wrong; the page is simply harder to read or slower to fill in than it needs to be. |

---

## Phase 1 — Stop the form losing or accepting bad work

These four are behavioural, independent of any redesign, and each one can silently
destroy a researcher's input. Nothing else should be scheduled ahead of them.

### 1.1 Make validation actually run — **Broken**

`emailRule` and `orcidRule` are defined and bound to their fields, but `<v-form>` carries
no ref and nothing ever calls `validate()`. The rules render errors on touched fields and
then do nothing at save time.

- **Change:** add a form ref; `await formRef.value.validate()` in the submit path and
  refuse to emit when invalid. Move focus to the first invalid field so the failure is
  visible on a long page.
- **Files:** `src/components/ProjectForm.vue`
- **Risk:** low — but see decision **D1**. Enforcing the existing rules on *drafts* would
  lock people out of saving, because the auto-added PI row starts with an empty ORCID
  that the rules call required.

### 1.2 Let the single-instrument conflict block the save — **Broken**

Confirmed on the dev stack: with type *Single-instrument* and two instruments ticked, the
page shows the conflict warning and **Save still succeeds and navigates away**. The
warning is also printed twice — once under Project Type, once under Instruments.

- **Change:** gate the submit path on `singleInstrumentConflict`. Keep the message under
  Instruments, where the fix is, and drop the duplicate from the Project Type select.
- **Files:** `src/components/ProjectForm.vue`
- **Risk:** low.

### 1.3 Confirm before Submit for Review — **Broken**

Submitting sets status to `under review`, which removes Edit and Delete (verified). It is
irreversible from the UI, has no confirmation, and sits immediately beside Save Draft.

- **Change:** a dialog naming the consequence — that the proposal locks and can no longer
  be edited — with the destructive action as the non-default button.
- **Files:** `src/components/ProjectForm.vue`
- **Risk:** low. Worth pairing with strict validation (1.1) so the dialog only appears for
  a submittable form.

### 1.4 Guard unsaved changes — **Broken**

Cancel, the browser back button, and the app bar all discard edits with no warning. The
form holds a local copy of the project, so there is nothing to recover afterwards.

- **Change:** track dirtiness by comparing the working copy against the seeded prop; wire
  `onBeforeRouteLeave` plus a `beforeunload` handler. Suppress it on the save and submit
  paths so a successful save never prompts.
- **Files:** `src/components/ProjectForm.vue`, `src/views/ProposalEditView.vue`
- **Risk:** medium — a dirty check that misfires is worse than none. The instruments
  watcher rewrites `form.instruments` on load, so compare normalised payloads, not raw refs.

### 1.5 Let people type their ORCID — **Broken** *(found while implementing 1.1)*

The ORCID field was a `v-autocomplete`, which only accepts values present in its
suggestion list. Typing an ORCID and blurring left the field empty — verified. Harmless
while the rules were decorative; a hard blocker the moment D1 makes ORCID required at
submit, because anyone the lookup does not return could never submit at all.

- **Change:** switch to `v-combobox` with `:return-object="false"`, matching the first and
  last name fields. Suggestions still work and still rewrite the model to the bare ORCID.
- **Files:** `src/components/ProjectForm.vue`
- **Risk:** low. `VAutocomplete` is no longer imported anywhere.

---

## Phase 2 — Make the form layout hold together

The member editor is the only genuinely unusable part of the page. It needs a layout
change rather than a style tweak, which is why it sits apart from the visual work in
Phase 3. Scope is bounded by **D2** — the laptop floor, not phones.

### 2.1 Realign the member rows — **Broken**

Each member is a `d-flex` with no wrap holding five fields and a delete button, so the
fields compress without limit. At 390 px the labels render as "L.", "E", "a"; even at
tablet width the email truncates. Rows are also independent flex containers, so columns
don't line up between rows.

- **Change** (scoped by **D2**): move the rows onto one shared CSS grid template so every
  row's columns align, and give each column a minimum width so fields stop collapsing into
  unreadable slivers. Wraps to two rows of fields below the laptop floor rather than
  compressing. A per-member card with single-column stacking was considered and dropped
  with D2 — revisit if phones ever come into scope.
- **Files:** `src/components/ProjectForm.vue`
- **Risk:** medium — the ORCID autocomplete's focus/blur watcher is bound per member and
  must survive the restructure. Covered by the existing round-trip test.

### 2.2 Fix instrument label wrapping — **Polish**

The checkbox label is a `d-flex flex-wrap` holding a link and a description. On narrow
screens the instrument name wraps onto its own line *above* the checkbox, reading as a
stray heading.

- **Change:** keep name and description in one inline flow so they wrap as a paragraph
  beside the control.
- **Files:** `src/components/ProjectForm.vue`
- **Risk:** low.

### 2.3 Sticky action bar — **Polish**

Save, Submit and Cancel sit at the bottom of a form roughly two screens tall. The error
alert is directly above them, so a failed save can report itself off-screen.

- **Change:** pin the actions to the bottom of the viewport on a bordered bar, and surface
  the save error in the bar rather than only in the flow.
- **Files:** `src/components/ProjectForm.vue`
- **Risk:** low — *but see below.*

> **Found during implementation:** a sticky bar overlays whatever sits at the bottom of
> the viewport, and `elementFromPoint` confirmed it was swallowing clicks meant for the
> MAXIMA checkbox. Mitigated with `scroll-padding-bottom` on the document, so any
> browser-initiated scroll — Tab through the form, `scrollIntoView`, anchor jumps — keeps
> controls clear of the bar, plus reserved space below the last card. Worth knowing the
> pattern has this hazard if the bar ever grows taller.

---

## Phase 3 — One visual system

The app has a real palette — Material purple `#6200ee` with a teal secondary — but it
lives as 19 hardcoded hex values across scoped stylesheets, while the form renders in
Vuetify's untouched blue-and-teal defaults. Do the token layer first; it makes every later
item a one-line change.

### 3.1 Put the palette in one place — **Inconsistent**

`src/assets/base.css` and `main.css` are both empty files. They are the obvious home for
the colours currently repeated across four views.

- **Change:** define custom properties for surface, ink, line, accent and the four status
  colours; import them in `main.ts`. Then feed the same values into `createVuetify`'s
  theme so components and hand-written CSS resolve to one palette.
- **Files:** `src/assets/base.css`, `src/plugins/vuetify.ts`, `src/main.ts`
- **Risk:** low in isolation; it is 3.2 that changes what you see.

### 3.2 Retire the hardcoded hex — **Inconsistent**

`#6200ee` appears in four view files, `#3700b3` in three, and the status chip colours are
duplicated between the list and detail views. Buttons on the form come out blue and teal;
the same buttons elsewhere are purple.

- **Change:** replace literals with the tokens from 3.1. Status chip styling is duplicated
  verbatim in two views — collapse it into one class while you are there.
- **Files:** `LoginView.vue`, `ProposalsView.vue`, `ProposalEditView.vue`, `ProposalDetailView.vue`
- **Risk:** low, but it touches every page — worth a screenshot pass across all four.

### 3.3 Give the page the same shell as the detail view — **Inconsistent**

The form runs full-bleed — 1408 px inside a 1440 px viewport — while the detail view is a
960 px centred column of cards. A 1400 px-wide single-line "Project Name" input reads
badly, and moving between the two pages feels like moving between two applications.

- **Change:** wrap the form in the same centred container and card treatment, and group
  its sections into cards mirroring the detail view: Overview, Instruments, Team, Documents.
- **Files:** `src/views/ProposalEditView.vue`, `src/components/ProjectForm.vue`
- **Risk:** low. Largest visual diff in the plan; no behaviour changes.

### 3.4 Normalise the heading scale — **Inconsistent**

Three peer sections use three different heading treatments: Instruments is a
`text-subtitle-1` div, Members a bare `<h2>`, Documents an `<h3>` living inside
`FileUploader`.

- **Change:** one section-heading treatment applied to all three. Let the parent own the
  Documents heading so `FileUploader` stops deciding its own hierarchy.
- **Files:** `src/components/ProjectForm.vue`, `src/components/FileUploader.vue`
- **Risk:** low.

---

## Phase 4 — Orientation and guidance

With the shell in place, these are cheap. Each one answers a question the page currently
leaves the researcher to guess at.

### 4.1 Say which proposal is being edited — **Polish**

The detail view is headed "JHU260030: In-situ laser shock response of refractory alloys".
Click Edit and the heading becomes "Edit Proposal" — no identifier, no title, no status.

- **Change:** carry the project ID, name and status chip into the edit header, with a back
  link to the detail view. Reuse the status chip class from 3.2.
- **Files:** `src/views/ProposalEditView.vue`
- **Risk:** low. Note the view currently renders the form before the fetch resolves, so
  the header needs a loading state or it will flash empty.

### 4.2 Mark what is required — **Polish**

Nothing on the page distinguishes required from optional. Once 1.1 enforces the rules, a
researcher needs to see which fields will block submission before pressing the button.

- **Change:** mark required fields, and state the draft-versus-submit distinction from D1
  in one line near the actions.
- **Files:** `src/components/ProjectForm.vue`
- **Risk:** low. Depends on D1 being settled.

### 4.3 Say what to attach — **Polish**

Documents offers a bare file input. The type is chosen only after a file is picked, and
the page never says a proposal document or CV is expected — although `FileType` already
names both.

- **Change:** describe the expected attachments above the input and label the button for
  multiple files (it currently reads "Upload File" while accepting many).
- **Files:** `src/components/FileUploader.vue`
- **Risk:** low.

### 4.4 Slim the description editor — **Polish**

Two toolbar buttons sit under a full-width saturated tab bar inside its own card, above a
textarea holding ten reserved rows for what is usually a short paragraph. It is the visual
centre of the page and shouldn't be.

- **Change:** drop the card and the coloured tab bar in favour of a quiet Edit/Preview
  toggle; reduce the starting row count and let auto-grow do the work.
- **Files:** `src/components/MarkdownEditor.vue`
- **Risk:** low. Do not touch `renderMarkdown` — the escape-before-render order is
  load-bearing (see the Markdown section of `CLAUDE.md`).

---

## Decisions needed

Each of these changes what gets built. They are cheap to settle and expensive to guess at.

### D1 — Should a draft be allowed to be incomplete?

The current rules mark ORCID and email required on every member, yet a new proposal
auto-adds the signed-in user as PI with an empty ORCID. Enforce those rules on Save and
nobody can save a draft.

**Decided: two tiers.** Save Draft accepts anything incomplete; Submit for Review
enforces every rule. Drafts are working documents; the review gate is where strictness
belongs. Rules stay bound to the fields so errors still surface while typing — they are
simply not enforced until submit.

### D2 — Which widths are actually supported?

Phase 2.1 is a rebuild if phones matter and a much smaller change if the floor is a
laptop. Nothing in the repo states a target.

**Decided: laptop floor, 1024 px and up.** Phones are out of scope. Item 2.1 is therefore
an alignment and minimum-width fix rather than a rebuild: rows share one grid template so
columns line up, and fields stop collapsing below a usable width. The page will still be
cramped on a phone, and that is accepted.

### D3 — Should Delete live on the edit page?

Deleting a draft is only possible from the detail view. The edit page has no delete
affordance, which is why the parent's old `@delete` handler was unreachable and got
removed.

**Decided: detail view only.** No delete affordance on the edit page, and the removed
`@delete` emit stays removed.

---

## Verification

There is no test runner in the repo, but the full stack runs locally and the existing
Playwright suites already cover the save, submit, upload, download and round-trip paths.
Extend rather than restart — see the "Local dev stack" section of `CLAUDE.md` for how to
drive the deployment.

| Phase | New checks | Regression |
| --- | --- | --- |
| 1 | Invalid email/ORCID blocks submit; conflict blocks save; confirm dialog appears and cancels cleanly; navigating away while dirty prompts, and doesn't after a save | Existing save + submit suites must pass unchanged |
| 2 | Screenshot the member editor at 1024 / 1440 px; assert columns align across rows, no field is narrower than a usable minimum, and the page never scrolls sideways | ORCID autocomplete and the member round-trip |
| 3 | Screenshot all four pages before and after; assert no literal `#6200ee` remains in `src/` | Full suite — this touches every view |
| 4 | Header shows ID, name and status; required markers present; editor preview still escapes markup | The XSS suite, unchanged |

## Sequencing

Phases 1 and 2 are independent and can land in either order. Phase 3.1 blocks the rest of
Phase 3, and Phase 3 should land before Phase 4 so the later items inherit the tokens and
the page shell instead of being re-styled twice.

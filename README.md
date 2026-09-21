# ECD & Childcare Centre Survey

Offline-first field app for the **Jackfruit × Open Capital ECD scoping study** —
Northern Kenya (Isiolo, Samburu) and Uganda (Kampala), refugee-hosting and
surrounding communities.

It is a faithful implementation of the *ECD & Homebased Care Survey Guide*
(v 2026-09-02): the same questions, the same answer options, the same skip
logic, in the same order — plus the field plumbing a paper guide can't give
you (autosave, GPS, photos, validation, sync).

**No build step, no framework, no server.** Plain HTML/CSS/JS, served as a
static site.

---

## For enumerators

1. Open the app link on your phone.
2. **Add it to your home screen** (Safari: Share → Add to Home Screen;
   Chrome: ⋮ → Add to Home screen). It then works with no signal at all.
3. Tap your name. Everything else follows from it — see below.
4. Tap the centre type. That decides which questionnaire you get.
5. Answer. It saves as you type; you can close the phone and come back.
6. At the end: **Review**, fix anything flagged, then **Mark complete**.
7. When you next have signal: **Sync & export → Sync completed responses**.

Nothing leaves the phone until you tap Sync.

### Your name sets the country

| Enumerator | Region | Currency | Geography | Mobile money | Tax ID |
|---|---|---|---|---|---|
| Hassan Iya Halakhe | N Kenya | **KES** | County → Sub-county → Ward | M-Pesa | KRA PIN |
| Micheal Jalle | N Kenya | **KES** | County → Sub-county → Ward | M-Pesa | KRA PIN |
| Lynda Kaino | N Kenya | **KES** | County → Sub-county → Ward | M-Pesa | KRA PIN |
| Michael Irungu Mwaura | Kampala | **UGX** | District → Division → Parish | MTN MoMo / Airtel | URA TIN |

This flows through everything: money fields, place-name dropdowns (Isiolo and
Samburu wards vs Kampala divisions and parishes), curriculum frameworks
(CBC / Kenya ECDE vs Uganda ECD Learning Framework / NCDC), registration
authorities (County & DCS vs MoES, KCCA & OPM), lender types, refugee
settlement lists and phone-number formats. A Kenyan enumerator is never shown
a Ugandan option, and vice versa.

---

## The two questionnaires

Centre type decides the route, on the very first screen:

| Centre type | Questionnaire |
|---|---|
| **Standalone ECD / daycare centre** | → **Daycare & home-based**, Sections 1–19 |
| **Home-based childcare** | → **Daycare & home-based**, Sections 1–19 |
| Nursery / pre-primary (standalone) | ECD centre, Sections 0–IX |
| **Pre-primary attached to a primary school** | ECD centre + whole-school financials |
| Community / faith-based ECD centre | ECD centre, Sections 0–IX |
| Other | ECD centre, Sections 0–IX |

The daycare instrument is the one written for mama-run and home-based care:
enrolment by single year of age, a staff table, an income and expense table,
group-based borrowing, household finances, growth potential. Home-based
childcare is routed there too, since that questionnaire is titled *Daycare &
Home-Based Care* and is the better fit.

### ECD attached to a primary school — two sets of financials

When the centre is a pre-primary unit inside a primary school, the same
financial questions are asked **twice**, in clearly separated sections, so the
ECD unit can be assessed on its own and against the school that carries it:

| | ECD / pre-primary unit only | Whole school (all grades) |
|---|---|---|
| Revenue, seasonality, revenue mix, collection period, arrears | Section **V** | Section **V-B** |
| Historic revenue, 2025 cost base, assets, outstanding loans | Section **VIII** | Section **VIII-B** |

Every money label in V-B and VIII-B carries "— whole school", so there is no
ambiguity about which figure is being recorded.

Section 0 also gains a short block of questions that the guide didn't need but
a credit assessment does:

- the school's name, grades offered, and total enrolment across all grades
- who owns/manages the school, and whether it's the same owner as the ECD unit
- whether the ECD unit's fees and accounts are kept separately
- whether the ECD unit has its own budget, and its share of school revenue
- which way any cross-subsidy runs between the unit and the school
- **who the borrower would be** — the school, the unit, or the proprietor

The review screen cross-checks the two: it flags it if ECD-unit revenue exceeds
whole-school revenue, or ECD enrolment exceeds school enrolment.

---

## What the app adds over the paper guide

**Skip logic is enforced, not remembered.** Every "If X = Yes" in the guide is
live. Age-band enrolment fields only appear for the age bands selected;
the whole Group-based Centres section only appears when the operator is a
women's or community group; the Owner/Household section only appears for
individually-run centres; lease expiry only when premises are leased.

**Phase 1 vs Phase 2.** Deep-dive sections are present but badged *Phase 2 —
optional* and skippable, so a screening visit is never blocked by them.
Individual Phase-2 questions inside Phase-1 sections carry a small `P2` tag.

**Money is unmistakable.** Every currency field is prefixed with the enumerator's
currency and echoes back a thousands-separated figure as you type —
`4500000` reads back as `UGX 4,500,000`, which catches an order-of-magnitude
slip on the spot.

**Tables behave like tables.** The enrolment-by-age, staffing, fee, income,
expense and asset grids from the daycare guide are real grids with live row
and column totals.

**Consistency checks at review.** Before submitting, the app flags — as
warnings, never blockers — things like enrolment above stated capacity,
attendance above enrolment, age bands that don't sum to the total, payroll
above revenue, a stated surplus that doesn't match income minus expenses, and
a repayment capacity above the monthly surplus.

**Fieldwork extras.** One-tap GPS (with manual lat/long fallback), camera
capture for the fee schedule and premises with client-side compression, and
a full review readback so the enumerator can confirm answers with the
respondent before leaving.

**Offline is the default.** A service worker caches the app; answers go to
IndexedDB (localStorage fallback) on every keystroke. The app survives a
reload, a crash, and a flat battery, and it resumes the open draft on next
launch.

---

## Where the data goes

1. **On device**, always — IndexedDB, one record per response.
2. **Google Sheet**, automatically — one row per response, one tab per
   questionnaire, keyed on `response_id` so re-syncing a corrected response
   updates its row instead of duplicating it. Setup:
   [`apps-script/README.md`](apps-script/README.md).
3. **CSV / JSON export**, any time — all responses, or one questionnaire at a
   time. The JSON backup includes photos and can be re-imported on another
   device.

The Apps Script endpoint is **built into the app** (`DEFAULT_ENDPOINT` in
`js/sync.js`), so an enumerator never types a URL. A completed response syncs
by itself the moment it is submitted with a connection; anything submitted
offline stays queued and goes up on the next **Sync completed responses**.
A device can still override the destination under **Sync & export →
Advanced**, with a "Restore built-in endpoint" button to undo it — that
override is only needed if the script is redeployed to a new URL before the
app itself can be updated.

> **Note on the embedded endpoint.** This repo is public, so the endpoint URL
> is public. The Apps Script only ever *appends* rows — it cannot read the
> sheet, edit existing data or delete anything — so the worst case is junk
> rows, which are traceable in the **Sync log** tab and easy to remove. To
> close that off, set `SHARED_TOKEN` in `Code.gs`, set the matching
> `DEFAULT_TOKEN` in `js/sync.js`, and redeploy both. To cut off a leaked
> endpoint entirely, deploy a new Apps Script version, which issues a fresh
> URL, and update `DEFAULT_ENDPOINT`.

---

## Deploying

The app is a static site. GitHub Pages is already wired up:
`.github/workflows/pages.yml` publishes `main` on every push. Enable it once
under **Settings → Pages → Source: GitHub Actions**.

It will then be live at
`https://benoestericher-jf.github.io/ecd-survey/`.

To run it locally:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static host works — Netlify, Vercel, S3, a folder on a laptop. It must be
served over **HTTPS** (or localhost) for GPS, camera and offline caching to work.

---

## Repo layout

```
index.html              app shell: every screen
css/styles.css          field-first styling - big targets, high contrast
js/reference.js         enumerators, countries, currencies, geography
js/schema-ecd.js        Path A - ECD centre questionnaire, Sections 0-IX
js/schema-daycare.js    Path B - daycare & home-based, Sections 1-19
js/engine.js            skip logic, validation, totals, cross-checks
js/render.js            one renderer per question type
js/store.js             IndexedDB + localStorage fallback
js/export.js            flattening, CSV, JSON
js/sync.js              Google Sheets push with retry
js/app.js               screens, navigation, autosave, review, submit
sw.js                   offline cache
apps-script/Code.gs     the Google Sheets receiver
```

### Changing a question

Questions live in `js/schema-ecd.js` and `js/schema-daycare.js`, as plain
objects. Nothing else needs to change — rendering, validation, export columns
and the Sheet's header row all follow the schema.

```js
{ id: 'num_toilets', label: '# toilets', type: 'integer', phase: 2,
  when: a => a.child_toilets === 'Yes' }
```

`type` is one of: `text`, `textarea`, `number`, `integer`, `year`, `currency`,
`percent`, `date`, `time`, `phone`, `email`, `taxid`, `yesno`, `yesnounsure`,
`select`, `multiselect`, `select_country`, `multiselect_country`,
`percentgroup`, `matrix`, `repeat`, `geo`, `geo_l1`/`l2`/`l3`,
`geo_settlement`, `photo`, `note`, `subhead`.

`when` is a predicate over the answers so far. `phase: 2` badges it as deep
dive. A label of `'@adminL1Label'` resolves per country ("County" in Kenya,
"District" in Uganda); `optionsKey: 'lenderOptions'` pulls a country-specific
list from `js/reference.js`.

Adding a column to an existing Google Sheet is safe — the Apps Script appends
unseen columns automatically.

---

## Testing

The schema was diffed line by line against the source workbook: all 191
question and heading rows on the ECD tab, all 198 answer options, and all 392
rows on the daycare tab are accounted for. Browser tests cover routing,
country localisation, cascading geography, matrix totals, skip logic,
validation, offline autosave, draft resume, repeat groups, review, submit and
CSV export.

---

*Adapted from the Jackfruit + CHAI health-lending facility questionnaire
(Clean Survey Guide, 15 Jun 2026) and the JFN Impact Survey Prototype v6.*

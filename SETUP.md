# Jackfruit · ECD & Childcare Survey — setup guide

Offline-first field app for the **Jackfruit × Open Capital ECD scoping study** —
Northern Kenya (Isiolo, Samburu) and Uganda (Kampala).

This is the **same application as the Jackfruit + CHAI health survey** — same
engine, same design, same sync, same review and flagging behaviour — carrying
the ECD questionnaire instead of the health one. Anyone who has used the CHAI
app will already know how to use this.

The one addition the ECD study needs: **the enumerator's name sets the
country.** Pick Hassan, Jalle or Lynda and everything runs in KES with Kenyan
counties, sub-counties and wards, M-Pesa and a KRA PIN field. Pick Michael and
the same survey runs in UGX with Kampala districts, divisions and parishes,
MTN MoMo / Airtel and a URA TIN field. Neither ever sees the other's options.

---

## Part 1 — Put the app online

The app is a static site: no build step, no server. Any static host works.

**Netlify (recommended)** — drag the folder onto app.netlify.com/drop, or
connect a GitHub repo for automatic updates on every push. See `HOSTING.md`.

**GitHub Pages** — push the folder and enable Pages.

It must be served over **HTTPS** (or localhost) or GPS, camera and offline
caching will not work.

Send the link to the four enumerators and have each **add it to their home
screen** (Safari: Share → Add to Home Screen; Chrome: ⋮ → Add to home screen).
After the first load it runs with no signal at all.

---

## Part 2 — Backend (Google Sheet + Drive sync)

1. Create a Google Sheet, e.g. **ECD survey responses**.
2. **Extensions → Apps Script**, delete the stub, paste in `backend/Code.gs`.
3. *(Optional)* set `SHARED_SECRET` to require a token on every submission.
4. **Deploy → New deployment → Web app**, **Execute as: Me**,
   **Who has access: Anyone**. Authorise (the "Google hasn't verified this app"
   warning is expected — it is your own script).
5. Copy the `/exec` URL.

The sync URL is **already compiled into the app** (`DEFAULT_ENDPOINT` in
`app.js`), so no phone needs configuring. Only change it if you redeploy to a
new URL — then update `DEFAULT_ENDPOINT` and push, or override it on a single
device under **☰ → Sync URL**.

### What lands in the Sheet

- Two tabs: **ECD centres** and **Daycare & home-based**.
- One row per submission. Photos are saved to a Drive folder and the row holds
  the links.
- New columns are appended automatically if the questionnaire grows.
- Deleting a synced survey in the app removes its row and its photos.
- `resetSurveySheets()` in the Apps Script editor re-seeds both tabs with the
  current column set — useful for clearing test data before go-live.

---

## How enumerators use it

1. **Pick your name.** This sets the currency and place names for everything
   that follows, and is attached to every survey you submit.
2. **Start new survey.** GPS is captured quietly in the background.
3. **Centre name**, then **centre type** — these are the only two required
   fields in the whole survey. Standalone ECD / daycare and home-based
   childcare go to the daycare questionnaire; everything else to the ECD
   centre questionnaire. A pre-primary unit inside a primary school gets two
   extra sections for whole-school financials.
4. **Answer what you can.** Nothing else is required. If a respondent won't
   answer or doesn't know, tap **Refused** or **Doesn't know** rather than
   leaving it blank — that is recorded as a real answer, not a gap.
5. **Exit** at any time saves a draft. Come back to it from the survey list.
6. **Review & finish** lists everything unanswered and every data check that
   looks off, each with a **Fix** button that jumps straight to the field.
   Both are warnings. You can always submit.
7. Submitting syncs immediately if there is signal, and queues if not.

---

## Admin notes

- **Nothing is required except the essentials.** Only centre name and centre
  type block progress. Everything else can be left blank, refused, or marked
  unknown — the point is to never lose a visit because of a question the
  respondent couldn't answer.
- **Data checks never block.** The review screen flags percentages that don't
  total 100, enrolment above capacity, attendance above enrolment, age bands
  that don't sum, payroll above revenue, income and expense lines that don't
  match the stated totals, a repayment capacity above the surplus, an ECD unit
  bigger than its own school, and phone/email/year formats. All of them are
  warnings with a Fix button.
- **Editing a synced survey** flips it back to "Not synced" and re-uploads on
  the next sync, overwriting nothing else.
- **Exports** live under **☰**: JSON (full, including photos) and CSV (one row
  per survey).
- **Sample list.** `centres.js` ships empty, so the centre-name field is free
  text. Drop a sampling frame in and name matching, auto-fill of centre type
  and county/district, and the `ref_*` columns start working with no code
  change. The shape is documented in the file.

---

## Files

```
index.html        app shell
styles.css        Jackfruit brand styling (Montserrat, deep teal, gold)
schema.js         both questionnaires, country packs, enumerators
app.js            engine: skip logic, flags, storage, sync, review
centres.js        optional sample list for name autocomplete (ships empty)
sw.js             offline cache
manifest.json     home-screen install
backend/Code.gs   Google Sheet + Drive receiver
```

### Changing a question

Questions live in `schema.js` as plain objects. Nothing else needs touching —
rendering, skip logic, review, export columns and the Sheet's header row all
follow the schema.

```js
{ id:"num_toilets", label:"# toilets", type:"integer",
  showIf:{ field:"child_toilets", eq:"Yes" } }
```

`unit:"MONEY"` renders the enumerator's currency. A label of `"@adminL1Label"`
resolves per country ("County" in Kenya, "District" in Uganda), and
`optionsKey:"lenderOptions"` pulls a country-specific list. `other:true` adds
an "Other" choice with a specify box. `half:true` puts two fields on one line.
`help:"..."` hides an explanation behind a tappable ⓘ.

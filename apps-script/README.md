# Google Sheets sync — setup

Ten minutes, once. After this every enumerator's completed responses land
in one spreadsheet.

## 1. Create the spreadsheet

1. Make a new Google Sheet, e.g. **ECD survey responses**.
2. **Extensions → Apps Script**.
3. Delete the placeholder `Code.gs` content and paste in the contents of
   [`Code.gs`](Code.gs) from this folder.
4. *(Optional but recommended)* set a shared token near the top:

   ```js
   var SHARED_TOKEN = 'pick-something-long-and-random';
   ```

5. Save.

## 2. Deploy it

1. **Deploy → New deployment → Select type → Web app**.
2. Description: `ECD survey receiver`.
3. **Execute as:** *Me*.
4. **Who has access:** *Anyone*.

   This is what lets a phone in the field POST to it. The endpoint only
   ever appends rows; with a shared token set, requests without the token
   are rejected.
5. **Deploy**, authorise when prompted, and copy the **Web app URL** —
   it ends in `/exec`.

## 3. Point the app at it

On each enumerator's device: open the app → **Sync & export** → paste the
web app URL and the shared token → **Test connection** → **Sync completed
responses**.

The URL is stored on that device only. It is not in the source code, so
the repo can stay public.

## What the script does

- One tab per questionnaire: **ECD centres** and **Daycare & home-based**.
- One row per response, keyed on `response_id`. Re-syncing the same
  response **updates its row** rather than duplicating it — so an
  enumerator can correct an answer and sync again safely.
- New columns are appended automatically if the questionnaire ever grows,
  so an older deployment never drops data.
- A **Sync log** tab records every receipt with a timestamp.

## Re-deploying after an edit

Apps Script keeps the old code live until you redeploy. After editing
`Code.gs`: **Deploy → Manage deployments → (pencil) → Version: New
version → Deploy**. The URL stays the same.

## Troubleshooting

| Symptom | Cause |
|---|---|
| `Test connection` says HTTP 401/403 | "Who has access" is not *Anyone*. |
| `Invalid token` | The token in the app doesn't match `SHARED_TOKEN`. |
| `Unexpected response from the sheet` | Usually an un-authorised deployment — open the `/exec` URL in a browser once and accept the prompt. |
| Rows stop appearing after a code edit | You edited but didn't redeploy a **new version**. |

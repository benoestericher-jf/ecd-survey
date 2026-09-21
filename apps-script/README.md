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

Nothing to do — the `/exec` URL is compiled into the app as
`DEFAULT_ENDPOINT` in [`../js/sync.js`](../js/sync.js). Enumerators just use
the app: completed responses sync on submit, and anything captured offline
goes up when they next tap **Sync completed responses**.

If you redeploy to a **new** URL, update `DEFAULT_ENDPOINT` and push — or, as
a stopgap on one phone, set it under **Sync & export → Advanced** (with
**Restore built-in endpoint** to undo).

Because the repo is public, so is the endpoint. It is append-only and cannot
read or alter the sheet; to lock it down further, set `SHARED_TOKEN` above and
the matching `DEFAULT_TOKEN` in `js/sync.js`.

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

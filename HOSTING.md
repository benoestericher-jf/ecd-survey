# Hosting the survey + auto-updates + Google Drive sync

This guide gets you to three things:

1. The survey live on the web (HTTPS) so enumerators can use it on phones.
2. **Future changes flow to the live site automatically** — when the files in
   the `ecd-app` folder change, the live site updates on its own.
3. Responses and photos syncing into Google Drive (a Google Sheet + a Drive
   folder), viewable only by people you've shared with.

The trick for auto-updates: connect the folder to **GitHub**, then connect
**Netlify** to that GitHub repo. After that, every update is "save → one click
to push → site rebuilds itself." Netlify watches GitHub and redeploys for you.

---

## Part 1 — One-time setup (about 15 minutes)

You only ever do this once.

### Step 1. Make a GitHub account

Go to github.com and sign up (free). GitHub stores the survey's files and is
what Netlify watches for changes.

### Step 2. Install GitHub Desktop

Download from desktop.github.com and install. This is a simple app — no
command line needed. Sign in with the GitHub account from Step 1.

### Step 3. Turn the survey folder into a repository

1. In GitHub Desktop: **File ▸ Add Local Repository**.
2. Choose this folder:
   `…/CHAI health lending/ecd-app`
3. It will say "this directory is not a Git repository" — click
   **create a repository** (the blue link), then **Create Repository**.
4. Click **Publish repository** (top right). Untick "Keep this code private"
   only if you want it public; private is fine. Click **Publish Repository**.

Your files are now on GitHub.

### Step 4. Connect Netlify to the GitHub repo

1. Go to netlify.com and sign up — choose **"Sign up with GitHub"** so they're
   linked.
2. Click **Add new site ▸ Import an existing project ▸ Deploy with GitHub**.
3. Authorize Netlify, then pick the **ecd-app** repository.
4. Leave **Build command** empty and set **Publish directory** to `.` (just a
   dot, meaning the folder root). Click **Deploy**.
5. After ~1 minute you get a live URL like `random-name-123.netlify.app`.
   (You can rename it under **Site configuration ▸ Change site name**.)

Open that URL on your phone and choose **Add to Home Screen** — it then works
like an installed app, fully offline.

That's it. Setup is done.

---

## Part 2 — How future updates reach the live site

Whenever Claude (or anyone) changes the files in the `ecd-app` folder:

1. Open **GitHub Desktop**. It automatically shows the changed files on the
   left.
2. Type a short note in the "Summary" box (e.g. "Updated survey questions").
3. Click **Commit to main**.
4. Click **Push origin** (top right).

Within about a minute, Netlify rebuilds and the live site is updated — no other
steps. Enumerators just reopen the app (it refreshes itself in the background;
if they have it open, pulling down to reload picks up the new version).

So the only manual action ever is: **Commit → Push** in GitHub Desktop. That one
click is what ships every future update.

> Want it even more hands-off? Claude can run the commit-and-push for you at the
> end of a session if you set up a GitHub access token once — ask Claude to walk
> you through it. Otherwise the two clicks above are the simplest reliable way.

---

## Part 3 — Sync responses to Google Drive

This sends every submitted survey into a Google Sheet, and every photo into a
Google Drive folder. Both live in your Google account; viewing them requires a
Google login you've shared with.

### Step 1. Create the Sheet

In the Jackfruit Google account, create a new Google Sheet (e.g.
"ECD Survey Responses"). Share it with whoever needs to see the data.

### Step 2. Add the sync script

1. In that Sheet: **Extensions ▸ Apps Script**.
2. Delete the placeholder code.
3. Open `ecd-app/backend/Code.gs` (in this folder), copy all of it, and
   paste it into the Apps Script editor. Click the **Save** icon.

### Step 3. Publish the script as a web app

1. Click **Deploy ▸ New deployment**.
2. Click the gear icon ▸ choose **Web app**.
3. Set **Execute as: Me** and **Who has access: Anyone**.
   (This lets enumerators submit without needing Google logins; the data itself
   stays private in your Sheet.)
4. Click **Deploy**, then **Authorize access** and allow the permissions
   (Sheets + Drive) when prompted.
5. Copy the **Web app URL** — it ends in `/exec`.

### Step 4. Point the app at it

**Already done.** The `/exec` URL is compiled into the app
(`DEFAULT_ENDPOINT` near the top of `app.js`), so no phone needs configuring —
enumerators just open the app and use it.

You only touch this if you deploy the script to a *new* URL. Then either update
`DEFAULT_ENDPOINT` and push (Part 2), or, as a stopgap on one phone, set it
under **☰ ▸ Sync URL**.

From now on:

- Submitted surveys append to the Sheet — an **ECD centres** tab and a
  **Daycare & home-based** tab are created automatically, one column per
  question (including any matched sample records, "Refused"/"Doesn't know"
  flags, and GPS).
- Photos (consent forms, fee schedules) are saved to a Drive folder called
  **JF ECD Survey Photos**, with the link stored in the Sheet.
- If a phone is offline, surveys queue and upload automatically when it's back
  online (or via the "Sync pending" button).

**Note:** because the endpoint ships inside the app and this folder may be
published, the URL is effectively public. The script only ever *appends* rows —
it cannot read the Sheet, change existing rows or delete anything — so the worst
case is junk rows, which are easy to spot and remove. To close that off, set
`SHARED_SECRET` in `Code.gs` and add the matching `secret` to the payload in
`app.js`. To kill a leaked URL, deploy a new script version and update
`DEFAULT_ENDPOINT`.

### Updating the script later

If Claude changes `Code.gs`, paste the new version into Apps Script, then
**Deploy ▸ Manage deployments ▸ (edit) ▸ New version**. The `/exec` URL stays
the same, so nothing in the app needs to change.

---

## Quick reference

| Task | Where | Action |
|------|-------|--------|
| Publish first time | GitHub Desktop + Netlify | Part 1 |
| Ship an update | GitHub Desktop | Commit → Push (auto-deploys) |
| Turn on Drive sync | Google Sheet ▸ Apps Script | Part 3, paste URL into app Settings |
| Add a new enumerator phone | The app | Open the link, Add to Home Screen — nothing to configure |

## One note on the backend folder

The `ecd-app/backend/Code.gs` file gets published to the web with everything
else. That's harmless **as long as you don't put a password in it** (the
`SHARED_SECRET` line — leave it blank, which is the default). If you ever set a
secret there, delete the `backend` folder from the published site first.

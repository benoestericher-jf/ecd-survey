# Push this to github.com/benoestericher-jf/ecd-survey

The app could not be pushed from the Claude session: the cloud sandbox is
only allowed to authenticate to repositories that have been added to the
session's authorised sources, and the sandbox has no credentials for this
one. Everything else is finished — this folder is the complete repo.

Run this in Terminal (it uses your own GitHub login):

```bash
cd "$HOME/Documents/Claude/Projects/Jackfruit/CHAI health lending/ecd-survey"
git init
git add -A
git commit -m "ECD & childcare centre survey - offline field app"
git branch -M main
git remote add origin https://github.com/benoestericher-jf/ecd-survey.git
git push -u origin main
```

Then, once:

1. GitHub → the repo → **Settings → Pages → Source: GitHub Actions**.
2. The workflow in `.github/workflows/pages.yml` publishes on every push.
3. The app goes live at
   **https://benoestericher-jf.github.io/ecd-survey/**

Send that link to the four enumerators and have each of them add it to
their phone's home screen. It works with no signal after the first load.

## Then set up the Google Sheet

Follow `apps-script/README.md`. Roughly ten minutes, once:
new Sheet → Extensions → Apps Script → paste `apps-script/Code.gs` →
Deploy as a Web App (Execute as: Me, Access: Anyone) → copy the `/exec`
URL → paste it into each phone under **Sync & export**.

## Housekeeping

A broken `.git` directory was left in `../_to_delete/` — the Claude session
can create files in this folder but is not permitted to delete them, and
git could not manage its own lock files under that restriction. Delete
`_to_delete/` in Finder; nothing in it is needed.

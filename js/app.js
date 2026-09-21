/* ------------------------------------------------------------------
   App shell: screens, navigation, autosave, review & submit.
   ------------------------------------------------------------------ */

const APP_VERSION = '1.1.0';

const App = {
  record: null,
  schema: null,
  sectionIdx: 0,
  saveTimer: null,

  async start() {
    await Store.init();
    this.bindChrome();
    Render.onChange = (q, rerender) => this.onAnswerChange(q, rerender);
    const resume = Store.setting('current');
    if (resume) {
      const r = await Store.get(resume);
      if (r && r.status === 'draft') { this.open(r); return; }
    }
    this.showHome();
  },

  /* ---------------- chrome ---------------- */
  bindChrome() {
    window.addEventListener('online', () => this.paintNet());
    window.addEventListener('offline', () => this.paintNet());
    this.paintNet();
    document.getElementById('brandHome').addEventListener('click', e => {
      e.preventDefault(); this.leaveToHome();
    });
    window.addEventListener('beforeunload', () => { if (this.record) this.save(true); });
  },

  paintNet() {
    const n = document.getElementById('netPill');
    const on = navigator.onLine;
    n.textContent = on ? 'Online' : 'Offline — answers saved on this device';
    n.className = 'net-pill ' + (on ? 'on' : 'off');
  },

  screen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === 'screen-' + name));
    window.scrollTo(0, 0);
  },

  toast(msg, kind) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show ' + (kind || '');
    clearTimeout(this._tt);
    this._tt = setTimeout(() => { t.className = 'toast'; }, 4000);
  },

  /* ---------------- home ---------------- */
  async showHome() {
    this.record = null; Store.setting('current', null);
    this.screen('home');
    const host = document.getElementById('enumList');
    host.innerHTML = '';
    ENUMERATORS.forEach(e => {
      const c = COUNTRIES[e.country];
      const b = document.createElement('button');
      b.className = 'enum-card';
      b.innerHTML = `<span class="enum-name"></span>
        <span class="enum-meta"><span class="flagish">${e.country === 'KE' ? 'Kenya' : 'Uganda'}</span>
        <span>${e.region}</span><span class="cur">${c.currency}</span></span>`;
      b.querySelector('.enum-name').textContent = e.name;
      b.addEventListener('click', () => this.chooseEnumerator(e));
      host.append(b);
    });
    const sel = Store.setting('enumerator');
    if (sel) {
      const e = ENUMERATORS.find(x => x.id === sel);
      if (e) document.getElementById('lastEnum').textContent = 'Last used: ' + e.name;
    }
    await this.paintDraftCount();
  },

  async paintDraftCount() {
    const all = await Store.all();
    const d = all.filter(r => r.status === 'draft').length;
    const c = all.filter(r => r.status === 'complete').length;
    const s = all.filter(r => r.status === 'synced').length;
    document.getElementById('homeCounts').textContent =
      `${all.length} response${all.length === 1 ? '' : 's'} on this device · ${d} draft · ${c} ready to sync · ${s} synced`;
  },

  chooseEnumerator(e) {
    Store.setting('enumerator', e.id);
    this.pendingEnum = e;
    const c = COUNTRIES[e.country];
    document.getElementById('newFor').textContent =
      `${e.name} — ${c.name} · all money in ${c.currency}`;
    const host = document.getElementById('typeList');
    host.innerHTML = '';
    CENTRE_TYPES.forEach(t => {
      const b = document.createElement('button');
      b.className = 'type-card';
      const routed = DAYCARE_TYPES.includes(t);
      b.innerHTML = `<span class="type-name"></span>
        <span class="type-route">${routed ? 'Daycare &amp; home-based questionnaire (Sections 1–19)' : 'ECD centre questionnaire (Sections 0–IX)'}</span>`;
      b.querySelector('.type-name').textContent = t;
      if (routed) b.classList.add('routed');
      if (t === 'Pre-primary attached to a primary school')
        b.append(Object.assign(document.createElement('span'),
          { className: 'type-flag', textContent: 'Adds a second financials section for the whole school' }));
      b.addEventListener('click', () => this.newResponse(e, t));
      host.append(b);
    });
    this.screen('new');
  },

  async newResponse(e, centreType) {
    const path = DAYCARE_TYPES.includes(centreType) ? 'daycare' : 'ecd';
    const rec = {
      id: uid(),
      path,
      enumeratorId: e.id,
      enumeratorName: e.name,
      enumeratorRegion: e.region,
      country: e.country,
      status: 'draft',
      appVersion: APP_VERSION,
      createdAt: new Date().toISOString(),
      answers: {
        centre_type: centreType,
        enumerator_name: e.name,
        interview_date: new Date().toISOString().slice(0, 10)
      }
    };
    await Store.put(rec);
    this.open(rec);
  },

  /* ---------------- drafts ---------------- */
  async showDrafts() {
    const all = await Store.all();
    const host = document.getElementById('draftList');
    host.innerHTML = '';
    if (!all.length) {
      host.append(Object.assign(document.createElement('p'),
        { className: 'empty', textContent: 'No responses saved on this device yet.' }));
    }
    all.forEach(r => {
      const schema = Exporter.schemaFor(r.path);
      const p = Engine.progress(schema, r);
      const card = document.createElement('div');
      card.className = 'draft-card status-' + r.status;
      const name = r.answers.centre_name || '(unnamed centre)';
      card.innerHTML = `
        <div class="draft-main">
          <strong class="draft-name"></strong>
          <span class="draft-meta"></span>
          <div class="bar"><span style="width:${p.pct}%"></span></div>
        </div>
        <div class="draft-actions"></div>`;
      card.querySelector('.draft-name').textContent = name;
      card.querySelector('.draft-meta').textContent =
        `${r.path === 'daycare' ? 'Daycare' : 'ECD centre'} · ${r.enumeratorName} · ` +
        `${(COUNTRIES[r.country] || {}).currency} · ${p.pct}% complete · ` +
        `${r.status} · ${new Date(r.updatedAt).toLocaleString()}`;
      const acts = card.querySelector('.draft-actions');
      const open = Object.assign(document.createElement('button'),
        { className: 'btn-secondary', textContent: r.status === 'draft' ? 'Continue' : 'View' });
      open.addEventListener('click', () => this.open(r));
      acts.append(open);
      const del = Object.assign(document.createElement('button'),
        { className: 'btn-mini danger', textContent: 'Delete' });
      del.addEventListener('click', async () => {
        if (!confirm('Delete this response? This cannot be undone.')) return;
        await Store.remove(r.id); this.showDrafts(); this.paintDraftCount();
      });
      acts.append(del);
      host.append(card);
    });
    this.screen('drafts');
  },

  /* ---------------- form ---------------- */
  open(record) {
    this.record = record;
    this.schema = Exporter.schemaFor(record.path);
    Store.setting('current', record.id);
    this.sectionIdx = 0;
    this.screen('form');
    this.renderForm();
  },

  sections() { return Engine.visibleSections(this.schema, this.record); },

  renderForm() {
    const secs = this.sections();
    if (this.sectionIdx >= secs.length) this.sectionIdx = secs.length - 1;
    if (this.sectionIdx < 0) this.sectionIdx = 0;
    const sec = secs[this.sectionIdx];

    /* header */
    const c = Engine.ctx(this.record);
    document.getElementById('formTitle').textContent = this.schema.title;
    document.getElementById('formSub').textContent =
      `${this.record.answers.centre_name || '(unnamed centre)'} · ${this.record.enumeratorName} · ${c.name} · ${c.currency}`;

    /* rail */
    const rail = document.getElementById('rail');
    rail.innerHTML = '';
    secs.forEach((s, i) => {
      const b = document.createElement('button');
      b.className = 'rail-item' + (i === this.sectionIdx ? ' on' : '') + (s.phase === 2 ? ' p2' : '');
      const errs = Engine.validateSection(s, this.record).filter(e => !e.soft);
      const p = this.sectionProgress(s);
      if (p === 100) b.classList.add('done');
      b.innerHTML = `<span class="rail-num"></span><span class="rail-title"></span>`;
      b.querySelector('.rail-num').textContent = s.num;
      b.querySelector('.rail-title').textContent = s.title;
      b.addEventListener('click', () => { this.sectionIdx = i; this.renderForm(); });
      rail.append(b);
    });

    /* body */
    const body = document.getElementById('formBody');
    body.innerHTML = '';
    body.append(Render.section(sec, this.record));

    /* nav */
    document.getElementById('navPrev').disabled = this.sectionIdx === 0;
    const next = document.getElementById('navNext');
    next.textContent = this.sectionIdx === secs.length - 1 ? 'Review →' : 'Next →';
    document.getElementById('navPos').textContent = `Section ${this.sectionIdx + 1} of ${secs.length}`;

    const prog = Engine.progress(this.schema, this.record);
    document.getElementById('formBar').style.width = prog.pct + '%';
    document.getElementById('formProg').textContent =
      `${prog.pct}% · ${prog.reqDone}/${prog.reqTotal} required answered`;

    this._sig = this.renderSignature();
    this.showErrors([]);
  },

  sectionProgress(s) {
    const qs = Engine.visibleQuestions(s, this.record);
    if (!qs.length) return 100;
    const done = qs.filter(q => {
      const v = this.record.answers[q.id];
      return !(v === undefined || v === null || v === '' ||
        (Array.isArray(v) && v.length === 0) ||
        (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0));
    }).length;
    return Math.round(done / qs.length * 100);
  },

  /* Signature of what is currently ON SCREEN. Compared after every answer,
     so a change that unlocks a question or a whole new section repaints at
     once. It must be captured at render time, not recomputed from the
     answers - by the time onAnswerChange runs the answer is already set. */
  renderSignature() {
    const secs = this.sections();
    const sec = secs[this.sectionIdx];
    return secs.map(s => s.id).join('|') + '#' +
      (sec ? Engine.visibleQuestions(sec, this.record).map(x => x.id).join('|') : '');
  },

  onAnswerChange(q, forceRerender) {
    this.save();
    document.getElementById('saveState').textContent = 'Saving…';
    const before = this._sig;
    setTimeout(() => {
      if (forceRerender || this.renderSignature() !== before) {
        const ae = document.activeElement;
        const focusId = ae && ae.id;
        let caret = null;
        try { caret = ae && ae.selectionStart; } catch (e) {}
        this.renderForm();
        if (focusId) {
          const f = document.getElementById(focusId);
          if (f && f.focus) {
            f.focus();
            try { if (caret != null && f.setSelectionRange) f.setSelectionRange(caret, caret); } catch (e) {}
          }
        }
      } else {
        const prog = Engine.progress(this.schema, this.record);
        document.getElementById('formBar').style.width = prog.pct + '%';
        document.getElementById('formProg').textContent =
          `${prog.pct}% · ${prog.reqDone}/${prog.reqTotal} required answered`;
        document.getElementById('formSub').textContent =
          `${this.record.answers.centre_name || '(unnamed centre)'} · ${this.record.enumeratorName} · ${Engine.ctx(this.record).name} · ${Engine.ctx(this.record).currency}`;
      }
    }, 0);
  },

  save(sync) {
    clearTimeout(this.saveTimer);
    const doIt = async () => {
      if (!this.record) return;
      await Store.put(this.record);
      const s = document.getElementById('saveState');
      if (s) { s.textContent = 'Saved ' + new Date().toLocaleTimeString(); }
    };
    if (sync) { doIt(); return; }
    this.saveTimer = setTimeout(doIt, 250);
  },

  showErrors(errs) {
    document.querySelectorAll('.q').forEach(n => { n.classList.remove('has-err'); const e = n.querySelector('.q-err'); if (e) e.textContent = ''; });
    const box = document.getElementById('formErrors');
    box.innerHTML = '';
    if (!errs.length) { box.classList.remove('show'); return; }
    box.classList.add('show');
    box.append(Object.assign(document.createElement('strong'),
      { textContent: errs.length + ' item' + (errs.length === 1 ? '' : 's') + ' need attention before this section is complete' }));
    errs.forEach(e => {
      const n = document.querySelector(`.q[data-qid="${e.id}"]`);
      if (n) { n.classList.add('has-err'); const m = n.querySelector('.q-err'); if (m) m.textContent = e.msg; }
    });
    const first = document.querySelector('.q.has-err');
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  },

  next() {
    const secs = this.sections();
    const sec = secs[this.sectionIdx];
    const errs = Engine.validateSection(sec, this.record);
    const hard = errs.filter(e => !e.soft);
    if (hard.length && sec.phase !== 2) { this.showErrors(errs); return; }
    if (errs.length) this.showErrors(errs);
    if (this.sectionIdx === secs.length - 1) { this.review(); return; }
    this.sectionIdx++;
    this.renderForm();
  },

  prev() { if (this.sectionIdx > 0) { this.sectionIdx--; this.renderForm(); } },

  /* ---------------- review ---------------- */
  review() {
    const r = this.record;
    const secs = this.sections();
    const host = document.getElementById('reviewBody');
    host.innerHTML = '';

    const missing = [];
    secs.forEach(s => Engine.validateSection(s, r).filter(e => !e.soft).forEach(e => {
      const q = Engine.visibleQuestions(s, r).find(x => x.id === e.id);
      missing.push({ sec: s, q, msg: e.msg });
    }));

    const warns = Engine.crossChecks(r);

    const sum = document.createElement('div');
    sum.className = 'review-sum';
    const p = Engine.progress(this.schema, r);
    sum.innerHTML = `<h2></h2><p class="review-meta"></p>`;
    sum.querySelector('h2').textContent = r.answers.centre_name || '(unnamed centre)';
    sum.querySelector('.review-meta').textContent =
      `${this.schema.title} · ${r.enumeratorName} · ${Engine.ctx(r).name} · ${Engine.ctx(r).currency} · ${p.pct}% of visible questions answered`;
    host.append(sum);

    if (missing.length) {
      const b = document.createElement('div'); b.className = 'review-block bad';
      b.append(Object.assign(document.createElement('h3'),
        { textContent: missing.length + ' required question' + (missing.length === 1 ? '' : 's') + ' still blank' }));
      const ul = document.createElement('ul');
      missing.forEach(m => {
        const li = document.createElement('li');
        const a = document.createElement('button'); a.className = 'link';
        a.textContent = `Section ${m.sec.num} — ${Engine.label(m.q, r)}`;
        a.addEventListener('click', () => {
          this.sectionIdx = secs.findIndex(s => s.id === m.sec.id);
          this.screen('form'); this.renderForm();
          setTimeout(() => this.showErrors([{ id: m.q.id, msg: m.msg }]), 50);
        });
        li.append(a); ul.append(li);
      });
      b.append(ul); host.append(b);
    } else {
      const b = document.createElement('div'); b.className = 'review-block good';
      b.append(Object.assign(document.createElement('h3'), { textContent: 'All required questions answered' }));
      host.append(b);
    }

    if (warns.length) {
      const b = document.createElement('div'); b.className = 'review-block warn';
      b.append(Object.assign(document.createElement('h3'),
        { textContent: warns.length + ' consistency check' + (warns.length === 1 ? '' : 's') + ' to confirm with the respondent' }));
      const ul = document.createElement('ul');
      warns.forEach(w => ul.append(Object.assign(document.createElement('li'), { textContent: w })));
      b.append(ul);
      b.append(Object.assign(document.createElement('p'),
        { className: 'muted', textContent: 'These are warnings, not blockers — you can still submit.' }));
      host.append(b);
    }

    /* full answer readback */
    secs.forEach(s => {
      const qs = Engine.visibleQuestions(s, r).filter(q => {
        const v = r.answers[q.id];
        return !(v === undefined || v === null || v === '' ||
          (Array.isArray(v) && v.length === 0) ||
          (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0));
      });
      if (!qs.length) return;
      const d = document.createElement('details'); d.className = 'review-sec';
      const su = document.createElement('summary');
      su.textContent = `Section ${s.num} — ${s.title} (${qs.length} answered)`;
      d.append(su);
      const dl = document.createElement('dl');
      qs.forEach(q => {
        const dt = document.createElement('dt'); dt.textContent = Engine.label(q, r);
        const dd = document.createElement('dd'); dd.textContent = this.readback(q, r.answers[q.id], r);
        dl.append(dt); dl.append(dd);
      });
      d.append(dl); host.append(d);
    });

    document.getElementById('submitBtn').disabled = missing.length > 0;
    document.getElementById('submitNote').textContent = missing.length
      ? 'Fill the required questions above to submit. You can leave it as a draft in the meantime.'
      : (r.status === 'draft'
        ? 'Marks this response complete and queues it for sync.'
        : 'This response is already marked ' + r.status + '.');
    this.screen('review');
  },

  readback(q, v, r) {
    if (v === undefined || v === null) return '';
    if (q.type === 'currency') return Engine.fmtMoney(v, r);
    if (q.type === 'percent') return v === 'n/a' ? 'n/a' : v + '%';
    if (q.type === 'geo') return v.lat ? `${Number(v.lat).toFixed(5)}, ${Number(v.lng).toFixed(5)}` : '';
    if (q.type === 'photo') return (v.length || 0) + ' photo(s)';
    if (q.type === 'matrix') {
      return Object.entries(v).filter(([, row]) => Object.values(row).some(x => x !== '' && x !== undefined))
        .map(([k, row]) => k + ': ' + Object.entries(row).map(([ck, cv]) => `${ck}=${cv}`).join(', ')).join(' | ');
    }
    if (q.type === 'percentgroup') {
      return Object.entries(v).filter(([, x]) => x !== '' && x !== undefined).map(([k, x]) => `${k} ${x}%`).join(', ');
    }
    if (q.type === 'repeat') {
      return v.map((it, i) => `#${i + 1} ` + Object.entries(it).filter(([, x]) => x !== '' && x !== undefined)
        .map(([k, x]) => `${k}=${x}`).join(', ')).join(' | ');
    }
    if (Array.isArray(v)) return v.join('; ');
    return String(v);
  },

  async submit() {
    const r = this.record;
    r.status = 'complete';
    r.submittedAt = new Date().toISOString();
    await Store.put(r);
    Store.setting('current', null);
    this.toast('Response marked complete and queued for sync.', 'ok');
    if (Sync.configured() && navigator.onLine) {
      try { await Sync.pushOne(r); r.status = 'synced'; r.syncedAt = new Date().toISOString(); await Store.put(r);
        this.toast('Submitted and synced to the Google Sheet.', 'ok'); }
      catch (e) { this.toast('Saved on device. Sync failed (' + e.message + ') — retry from Sync & export.', 'warn'); }
    }
    this.record = null;
    this.showHome();
  },

  leaveToHome() {
    if (this.record) this.save(true);
    this.record = null;
    Store.setting('current', null);
    this.showHome();
  },

  /* ---------------- sync & export ---------------- */
  async showSync() {
    const all = await Store.all();
    document.getElementById('syncEndpoint').value = Sync.endpoint;
    document.getElementById('syncToken').value = Sync.token;
    const pending = all.filter(r => r.status === 'complete');
    document.getElementById('syncCounts').textContent =
      `${all.length} on device · ${pending.length} ready to sync · ${all.filter(r => r.status === 'synced').length} already synced · ${all.filter(r => r.status === 'draft').length} still drafts`;
    const mode = document.getElementById('syncMode');
    if (mode) {
      mode.textContent = Sync.usingDefault()
        ? 'Using the built-in endpoint — nothing to set up on this phone.'
        : 'Using a custom endpoint set on this device.';
      mode.className = 'sync-mode ' + (Sync.usingDefault() ? 'default' : 'custom');
    }
    const est = await Store.estimate();
    document.getElementById('syncStorage').textContent = est && est.usage
      ? `Local storage used: ${(est.usage / 1048576).toFixed(1)} MB of ~${(est.quota / 1048576).toFixed(0)} MB available`
      : '';
    this.screen('sync');
  },

  async doSync() {
    Sync.endpoint = document.getElementById('syncEndpoint').value.trim();
    Sync.token = document.getElementById('syncToken').value.trim();
    if (!Sync.configured()) { this.toast('Paste the Google Sheets web-app URL first.', 'warn'); return; }
    if (!navigator.onLine) { this.toast('No connection — try again when you have signal.', 'warn'); return; }
    const btn = document.getElementById('syncBtn');
    btn.disabled = true;
    const st = document.getElementById('syncStatus');
    const res = await Sync.pushAll((i, n, r) => {
      st.textContent = `Syncing ${i} of ${n}: ${r.answers.centre_name || '(unnamed)'}…`;
    });
    btn.disabled = false;
    st.textContent = `Synced ${res.ok} of ${res.total}.` +
      (res.failed.length ? ' Failed: ' + res.failed.map(f => f.name + ' (' + f.error + ')').join('; ') : '');
    this.toast(res.failed.length ? 'Some records did not sync — see details.' : 'All queued records synced.',
      res.failed.length ? 'warn' : 'ok');
    this.showSync();
  },

  async testSync() {
    Sync.endpoint = document.getElementById('syncEndpoint').value.trim();
    Sync.token = document.getElementById('syncToken').value.trim();
    const st = document.getElementById('syncStatus');
    st.textContent = 'Testing…';
    try { const d = await Sync.test(); st.textContent = 'Endpoint OK — ' + (d.sheet || 'connected') + '.'; }
    catch (e) { st.textContent = 'Test failed: ' + e.message; }
  },

  /* Escape hatch: undo a bad hand-typed endpoint without reinstalling. */
  resetEndpoint() {
    Sync.resetToDefault();
    this.showSync();
    document.getElementById('syncStatus').textContent = 'Restored the built-in endpoint.';
  },

  async exportCSV(which) {
    let all = await Store.all();
    if (which === 'ecd') all = all.filter(r => r.path === 'ecd');
    if (which === 'daycare') all = all.filter(r => r.path === 'daycare');
    if (!all.length) { this.toast('Nothing to export.', 'warn'); return; }
    Exporter.download(`ecd-survey_${which}_${Exporter.stamp()}.csv`, Exporter.csv(all), 'text/csv;charset=utf-8');
  },

  async exportJSON() {
    const all = await Store.all();
    if (!all.length) { this.toast('Nothing to export.', 'warn'); return; }
    Exporter.download(`ecd-survey_backup_${Exporter.stamp()}.json`, Exporter.json(all), 'application/json');
  },

  async importJSON(file) {
    const text = await file.text();
    let rows;
    try { rows = JSON.parse(text); } catch (e) { this.toast('Not a valid backup file.', 'warn'); return; }
    if (!Array.isArray(rows)) { this.toast('Not a valid backup file.', 'warn'); return; }
    let n = 0;
    for (const r of rows) {
      if (!r.id || !r.answers) continue;
      delete r.flat;
      await Store.put(r); n++;
    }
    this.toast(`Imported ${n} response(s).`, 'ok');
    this.showSync();
  }
};

document.addEventListener('DOMContentLoaded', () => App.start());

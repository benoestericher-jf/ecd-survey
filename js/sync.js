/* ------------------------------------------------------------------
   Google Sheets sync.
   Posts each completed response to an Apps Script Web App endpoint
   (see apps-script/Code.gs). Uses a no-preflight text/plain POST so
   it works from GitHub Pages without CORS headaches, and retries any
   record that is marked complete but not yet synced.
   ------------------------------------------------------------------ */

/* Built into the app so enumerators never have to type anything.
   A device can still override it (Sync & export) if the script is ever
   redeployed to a new URL before everyone can update the app. */
const DEFAULT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbx-QH5K02E5HsBMeU5X9a3zeOGBBz4qvKmL-dJx6fgOvbIiP_eMtDuf6PEt5c1x5sI2/exec';
const DEFAULT_TOKEN = '';

const Sync = {
  get endpoint() { return Store.setting('sheets_endpoint') || DEFAULT_ENDPOINT; },
  set endpoint(v) {
    // Only persist a genuine override; blank or same-as-built-in falls back.
    const t = (v || '').trim();
    Store.setting('sheets_endpoint', (!t || t === DEFAULT_ENDPOINT) ? null : t);
  },
  get token() {
    const o = Store.setting('sheets_token');
    return (o === null || o === undefined) ? DEFAULT_TOKEN : o;
  },
  set token(v) {
    const t = (v || '').trim();
    Store.setting('sheets_token', t === DEFAULT_TOKEN ? null : t);
  },

  configured() { return !!this.endpoint; },
  usingDefault() { return this.endpoint === DEFAULT_ENDPOINT; },
  resetToDefault() {
    Store.setting('sheets_endpoint', null);
    Store.setting('sheets_token', null);
  },

  async pushOne(record) {
    if (!this.configured()) throw new Error('No Google Sheets endpoint configured.');
    const payload = {
      token: this.token,
      appVersion: APP_VERSION,
      record: {
        id: record.id,
        questionnaire: record.path,
        enumerator: record.enumeratorName,
        country: record.country,
        currency: (COUNTRIES[record.country] || {}).currency,
        status: record.status,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        submittedAt: record.submittedAt
      },
      flat: Exporter.flatten(record),
      answers: record.answers
    };
    const res = await fetch(this.endpoint, {
      method: 'POST',
      // text/plain keeps this a "simple request" - no CORS preflight
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    let data;
    try { data = await res.json(); } catch (e) { throw new Error('Unexpected response from the sheet.'); }
    if (!data.ok) throw new Error(data.error || 'Sheet rejected the record.');
    return data;
  },

  /* Sync everything that is complete but unsynced */
  async pushAll(onProgress) {
    const all = await Store.all();
    const pending = all.filter(r => r.status === 'complete');
    let ok = 0; const failed = [];
    for (let i = 0; i < pending.length; i++) {
      const r = pending[i];
      if (onProgress) onProgress(i + 1, pending.length, r);
      try {
        await this.pushOne(r);
        r.status = 'synced';
        r.syncedAt = new Date().toISOString();
        await Store.put(r);
        ok++;
      } catch (e) {
        failed.push({ id: r.id, name: r.answers.centre_name || '(unnamed)', error: e.message });
      }
    }
    return { total: pending.length, ok, failed };
  },

  async test() {
    if (!this.configured()) throw new Error('No endpoint configured.');
    const res = await fetch(this.endpoint + (this.endpoint.includes('?') ? '&' : '?') + 'ping=1', { redirect: 'follow' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const d = await res.json();
    if (!d.ok) throw new Error(d.error || 'Endpoint responded but not ready.');
    return d;
  }
};

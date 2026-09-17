/* ------------------------------------------------------------------
   Google Sheets sync.
   Posts each completed response to an Apps Script Web App endpoint
   (see apps-script/Code.gs). Uses a no-preflight text/plain POST so
   it works from GitHub Pages without CORS headaches, and retries any
   record that is marked complete but not yet synced.
   ------------------------------------------------------------------ */

const Sync = {
  get endpoint() { return Store.setting('sheets_endpoint') || ''; },
  set endpoint(v) { Store.setting('sheets_endpoint', v); },
  get token() { return Store.setting('sheets_token') || ''; },
  set token(v) { Store.setting('sheets_token', v); },

  configured() { return !!this.endpoint; },

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

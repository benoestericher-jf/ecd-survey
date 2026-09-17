/* ------------------------------------------------------------------
   Flattening + export. One row per response; stable column order
   derived from the schema so every export lines up.
   ------------------------------------------------------------------ */

const Exporter = {

  schemaFor(path) { return path === 'daycare' ? DAYCARE_SCHEMA : ECD_SCHEMA; },

  /* Flatten one record into a flat {column: value} map */
  flatten(record) {
    const out = {};
    const c = COUNTRIES[record.country] || COUNTRIES.KE;
    out['response_id'] = record.id;
    out['questionnaire'] = record.path === 'daycare' ? 'Daycare / home-based' : 'ECD centre';
    out['enumerator'] = record.enumeratorName || '';
    out['enumerator_region'] = record.enumeratorRegion || '';
    out['country'] = c.name;
    out['currency'] = c.currency;
    out['status'] = record.status;
    out['created_at'] = record.createdAt;
    out['updated_at'] = record.updatedAt;
    out['submitted_at'] = record.submittedAt || '';
    out['app_version'] = record.appVersion || APP_VERSION;

    const schema = this.schemaFor(record.path);
    schema.sections.forEach(sec => {
      (sec.groups || []).forEach(g => {
        (g.questions || []).forEach(q => {
          if (q.type === 'note' || q.type === 'subhead') return;
          const v = record.answers[q.id];
          const base = q.id;
          if (q.type === 'matrix') {
            (q.rows || []).forEach(r => {
              (q.cols || []).forEach(cl => {
                if (cl.type === 'computed') return;
                out[`${base}__${this.slug(r)}__${cl.id}`] = ((v || {})[r] || {})[cl.id] ?? '';
              });
            });
            const moneyCol = (q.cols || []).find(x => x.type === 'currency');
            if (moneyCol) out[`${base}__TOTAL`] = Engine.matrixColTotal(q, v, moneyCol.id) || '';
          } else if (q.type === 'percentgroup') {
            (q.rows || []).forEach(r => { out[`${base}__${this.slug(r)}_pct`] = (v || {})[r] ?? ''; });
          } else if (q.type === 'repeat') {
            const arr = Array.isArray(v) ? v : [];
            const n = Math.max(3, arr.length);
            for (let i = 0; i < n; i++) {
              (q.fields || []).forEach(f => {
                out[`${base}_${i + 1}__${f.id}`] = (arr[i] || {})[f.id] ?? '';
              });
            }
            out[`${base}__count`] = arr.length;
          } else if (q.type === 'geo') {
            out[`${base}_lat`] = (v || {}).lat ?? '';
            out[`${base}_lng`] = (v || {}).lng ?? '';
            out[`${base}_accuracy_m`] = (v || {}).acc ?? '';
          } else if (q.type === 'photo') {
            out[`${base}__count`] = Array.isArray(v) ? v.length : 0;
          } else if (Array.isArray(v)) {
            out[base] = v.join('; ');
          } else {
            out[base] = v ?? '';
          }
        });
      });
    });
    return out;
  },

  slug(s) {
    return String(s).toLowerCase()
      .replace(/[–—]/g, '-')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '').slice(0, 40);
  },

  /* Union of columns across records, schema order first */
  columns(records) {
    const seen = new Set(); const cols = [];
    records.forEach(r => Object.keys(this.flatten(r)).forEach(k => {
      if (!seen.has(k)) { seen.add(k); cols.push(k); }
    }));
    return cols;
  },

  csv(records) {
    const cols = this.columns(records);
    const esc = v => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const lines = [cols.map(esc).join(',')];
    records.forEach(r => {
      const f = this.flatten(r);
      lines.push(cols.map(c => esc(f[c])).join(','));
    });
    return '﻿' + lines.join('\r\n');
  },

  json(records) {
    return JSON.stringify(records.map(r => ({
      ...r,
      answers: r.answers,
      flat: this.flatten(r)
    })), null, 2);
  },

  download(filename, content, mime) {
    const blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
  },

  stamp() {
    const d = new Date();
    return d.toISOString().slice(0, 10) + '_' + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0');
  }
};

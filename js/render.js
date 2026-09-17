/* ------------------------------------------------------------------
   Question renderers. Every control writes straight into
   record.answers and calls onChange() so the form autosaves.
   ------------------------------------------------------------------ */

const el = (tag, cls, txt) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (txt !== undefined) n.textContent = txt;
  return n;
};

const Render = {
  onChange: () => {},

  section(section, record) {
    const wrap = el('div', 'section');

    const head = el('div', 'section-head');
    const h = el('h2');
    h.append(el('span', 'sec-num', 'Section ' + section.num));
    h.append(document.createTextNode(section.title));
    head.append(h);
    if (section.phase === 2) head.append(el('span', 'badge badge-phase2', 'Phase 2 — optional'));
    if (section.enumeratorOnly) head.append(el('span', 'badge badge-enum', 'Enumerator only'));
    wrap.append(head);

    const note = (section.noteFn && section.noteFn(record.answers)) || section.note;
    if (note) wrap.append(el('p', 'section-note', note));
    if (section.script) {
      const s = el('div', 'script-box');
      s.append(el('span', 'script-label', 'Read aloud'));
      s.append(el('p', null, '“' + section.script + '”'));
      wrap.append(s);
    }

    (section.groups || []).forEach(g => {
      if (!Engine.visible(g, record)) return;
      const gw = el('div', 'group');
      const gt = (g.titleFn && g.titleFn(record.answers)) || g.title;
      if (gt) gw.append(el('h3', 'group-title', gt));
      let any = false;
      (g.questions || []).forEach(q => {
        if (!Engine.visible(q, record)) return;
        const node = this.question(q, record);
        if (node) { gw.append(node); any = true; }
      });
      if (any) wrap.append(gw);
    });

    return wrap;
  },

  question(q, record) {
    if (q.type === 'note') {
      return el('p', 'inline-note', q.label);
    }
    if (q.type === 'subhead') {
      return el('h4', 'subhead', q.label);
    }

    const row = el('div', 'q' + (q.indent ? ' q-indent' : ''));
    row.dataset.qid = q.id;

    const lab = el('label', 'q-label');
    lab.setAttribute('for', 'f_' + q.id);
    lab.append(document.createTextNode(Engine.label(q, record)));
    if (q.required) lab.append(el('span', 'req', '*'));
    if (q.phase === 2) lab.append(el('span', 'tag-p2', 'P2'));
    row.append(lab);
    if (q.help) row.append(el('p', 'q-help', q.help));

    const ctrl = el('div', 'q-ctrl');
    ctrl.append(this.control(q, record));
    row.append(ctrl);
    row.append(el('p', 'q-err'));
    return row;
  },

  control(q, record) {
    const a = record.answers;
    const c = Engine.ctx(record);
    const set = (v) => { a[q.id] = v; Render.onChange(q); };
    const id = 'f_' + q.id;

    switch (q.type) {

      case 'text': case 'email': case 'phone': case 'taxid': {
        const i = el('input'); i.id = id;
        i.type = q.type === 'email' ? 'email' : (q.type === 'phone' ? 'tel' : 'text');
        if (q.type === 'phone') i.placeholder = c.phoneHint;
        if (q.type === 'taxid') i.placeholder = c.taxIdHint;
        if (q.placeholder) i.placeholder = q.placeholder;
        i.value = a[q.id] || '';
        if (q.locked) { i.readOnly = true; i.classList.add('locked'); }
        i.addEventListener('input', () => set(i.value));
        return i;
      }

      case 'textarea': {
        const i = el('textarea'); i.id = id; i.rows = 3;
        i.value = a[q.id] || '';
        i.addEventListener('input', () => set(i.value));
        return i;
      }

      case 'number': case 'integer': {
        const w = el('div', 'inline-field');
        if (q.prefixLabel) w.append(el('span', 'affix', q.prefixLabel));
        const i = el('input'); i.id = id; i.type = 'number'; i.inputMode = 'numeric';
        if (q.type === 'integer') i.step = '1';
        if (q.min !== undefined) i.min = q.min;
        if (q.max !== undefined) i.max = q.max;
        i.value = a[q.id] ?? '';
        i.addEventListener('input', () => set(i.value === '' ? '' : Number(i.value)));
        w.append(i);
        if (q.unitLabel) w.append(el('span', 'affix', q.unitLabel));
        return w;
      }

      case 'year': {
        const i = el('input'); i.id = id; i.type = 'number'; i.inputMode = 'numeric';
        i.min = 1900; i.max = new Date().getFullYear(); i.placeholder = 'YYYY';
        i.value = a[q.id] ?? '';
        i.addEventListener('input', () => set(i.value === '' ? '' : Number(i.value)));
        return i;
      }

      case 'currency': {
        const w = el('div', 'inline-field money');
        w.append(el('span', 'affix cur', c.currency));
        const i = el('input'); i.id = id; i.type = 'number'; i.inputMode = 'decimal'; i.min = 0;
        i.value = a[q.id] ?? '';
        const echo = el('span', 'money-echo');
        const paint = () => { echo.textContent = i.value === '' ? '' : Engine.fmtMoney(i.value, record); };
        i.addEventListener('input', () => { set(i.value === '' ? '' : Number(i.value)); paint(); });
        paint();
        w.append(i);
        if (q.unitLabel) w.append(el('span', 'affix', q.unitLabel));
        w.append(echo);
        return w;
      }

      case 'percent': {
        const w = el('div', 'inline-field');
        const i = el('input'); i.id = id; i.type = 'number'; i.inputMode = 'decimal';
        i.min = 0; i.max = 100;
        i.value = (a[q.id] === 'n/a' ? '' : a[q.id]) ?? '';
        i.addEventListener('input', () => set(i.value === '' ? '' : Number(i.value)));
        w.append(i);
        w.append(el('span', 'affix', q.unitLabel || '%'));
        if (q.allowNA) {
          const b = el('label', 'na-box');
          const cb = el('input'); cb.type = 'checkbox'; cb.checked = a[q.id] === 'n/a';
          cb.addEventListener('change', () => {
            if (cb.checked) { i.value = ''; i.disabled = true; set('n/a'); }
            else { i.disabled = false; set(''); }
          });
          if (cb.checked) i.disabled = true;
          b.append(cb); b.append(document.createTextNode('n/a'));
          w.append(b);
        }
        return w;
      }

      case 'date': {
        const i = el('input'); i.id = id; i.type = 'date';
        i.value = a[q.id] || (q.prefillToday && !a[q.id] ? new Date().toISOString().slice(0, 10) : '');
        if (q.prefillToday && !a[q.id]) set(i.value);
        i.addEventListener('input', () => set(i.value));
        return i;
      }

      case 'time': {
        const i = el('input'); i.id = id; i.type = 'time';
        i.value = a[q.id] || '';
        i.addEventListener('input', () => set(i.value));
        return i;
      }

      case 'yesno': case 'yesnounsure': case 'select': case 'select_country': {
        let opts;
        if (q.type === 'yesno') opts = ['Yes', 'No'];
        else if (q.type === 'yesnounsure') opts = ['Yes', 'No', 'Unsure'];
        else opts = Engine.options(q, record);

        if (opts.length <= 4 && opts.every(o => o.length <= 22)) {
          const w = el('div', 'chips');
          opts.forEach(o => {
            const b = el('button', 'chip', o);
            b.type = 'button';
            if (a[q.id] === o) b.classList.add('on');
            b.addEventListener('click', () => {
              set(a[q.id] === o ? '' : o);
              w.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x.textContent === a[q.id]));
            });
            w.append(b);
          });
          w.id = id;
          if (q.locked) w.classList.add('locked');
          return w;
        }
        const s = el('select'); s.id = id;
        s.append(new Option('— select —', ''));
        opts.forEach(o => s.append(new Option(o, o)));
        s.value = a[q.id] || '';
        if (q.locked) { s.disabled = true; s.classList.add('locked'); }
        s.addEventListener('change', () => set(s.value));
        return s;
      }

      case 'multiselect': case 'multiselect_country': {
        const opts = Engine.options(q, record);
        const w = el('div', 'checks'); w.id = id;
        const cur = () => Array.isArray(a[q.id]) ? a[q.id] : [];
        opts.forEach(o => {
          const l = el('label', 'check');
          const cb = el('input'); cb.type = 'checkbox'; cb.checked = cur().includes(o);
          cb.addEventListener('change', () => {
            let v = cur().slice();
            if (cb.checked) {
              if (q.max && v.length >= q.max) { cb.checked = false; return; }
              v.push(o);
            } else v = v.filter(x => x !== o);
            set(v);
            Render.onChange(q);
          });
          l.append(cb); l.append(el('span', null, o));
          w.append(l);
        });
        if (q.max) w.append(el('p', 'q-help', 'Select up to ' + q.max + '.'));
        return w;
      }

      case 'percentgroup': {
        const w = el('div', 'pctgroup'); w.id = id;
        if (!a[q.id]) a[q.id] = {};
        const tot = el('div', 'pct-total');
        const paint = () => {
          const s = q.rows.reduce((x, r) => x + (Number(a[q.id][r]) || 0), 0);
          tot.textContent = 'Total: ' + s + '%';
          tot.className = 'pct-total ' + (Math.abs(s - 100) < 0.5 ? 'ok' : (s > 100 ? 'bad' : 'warn'));
        };
        q.rows.forEach(r => {
          const line = el('div', 'pct-row');
          line.append(el('span', 'pct-label', r));
          const i = el('input'); i.type = 'number'; i.min = 0; i.max = 100; i.inputMode = 'decimal';
          i.value = a[q.id][r] ?? '';
          i.addEventListener('input', () => {
            a[q.id][r] = i.value === '' ? '' : Number(i.value);
            paint(); Render.onChange(q);
          });
          line.append(i); line.append(el('span', 'affix', '%'));
          w.append(line);
        });
        paint(); w.append(tot);
        return w;
      }

      case 'matrix': {
        const w = el('div', 'matrix-wrap'); w.id = id;
        if (!a[q.id]) a[q.id] = {};
        const t = el('table', 'matrix');
        const thead = el('thead'); const hr = el('tr');
        hr.append(el('th', 'mx-rowhead', q.rowLabel || ''));
        q.cols.forEach(cl => hr.append(el('th', null, (cl.label || '').replace(/@CUR/g, c.currency))));
        thead.append(hr); t.append(thead);
        const tb = el('tbody');
        const footCells = {};
        const repaint = () => {
          q.cols.forEach(cl => {
            if (footCells[cl.id]) {
              const s = Engine.matrixColTotal(q, a[q.id], cl.id);
              footCells[cl.id].textContent = cl.type === 'currency'
                ? Engine.fmtMoney(s, record) : (s || '');
            }
          });
          w.querySelectorAll('[data-computed]').forEach(td => {
            const r = td.dataset.row;
            const rowv = a[q.id][r] || {};
            const s = q.cols.filter(x => x.type === 'integer')
              .reduce((x, cl) => x + (Number(rowv[cl.id]) || 0), 0);
            td.textContent = s || '';
          });
        };
        q.rows.forEach(r => {
          if (!a[q.id][r]) a[q.id][r] = {};
          const tr = el('tr');
          tr.append(el('th', 'mx-rowhead', r));
          q.cols.forEach(cl => {
            const td = el('td');
            if (cl.type === 'computed') {
              td.dataset.computed = '1'; td.dataset.row = r; td.className = 'mx-computed';
            } else if (cl.type === 'yesno_cell') {
              const s = el('select');
              s.append(new Option('—', ''));
              ['Yes', 'No'].forEach(o => s.append(new Option(o, o)));
              s.value = a[q.id][r][cl.id] || '';
              s.addEventListener('change', () => { a[q.id][r][cl.id] = s.value; Render.onChange(q); });
              td.append(s);
            } else {
              const i = el('input'); i.type = 'number'; i.inputMode = 'decimal'; i.min = 0;
              i.value = a[q.id][r][cl.id] ?? '';
              i.addEventListener('input', () => {
                a[q.id][r][cl.id] = i.value === '' ? '' : Number(i.value);
                repaint(); Render.onChange(q);
              });
              td.append(i);
            }
            tr.append(td);
          });
          tb.append(tr);
        });
        t.append(tb);
        if (q.totalRow) {
          const tf = el('tfoot'); const tr = el('tr');
          tr.append(el('th', 'mx-rowhead', q.totalRow));
          q.cols.forEach(cl => {
            const td = el('td', 'mx-total');
            if (cl.type !== 'yesno_cell') footCells[cl.id] = td;
            tr.append(td);
          });
          tf.append(tr); t.append(tf);
        }
        w.append(t); repaint();
        return w;
      }

      case 'repeat': {
        const w = el('div', 'repeat'); w.id = id;
        if (!Array.isArray(a[q.id])) a[q.id] = [];
        const list = el('div', 'repeat-list');
        const draw = () => {
          list.innerHTML = '';
          a[q.id].forEach((item, idx) => {
            const card = el('div', 'repeat-item');
            const hd = el('div', 'repeat-head');
            hd.append(el('strong', null, (q.itemLabel || 'Item') + ' ' + (idx + 1)));
            const del = el('button', 'btn-mini danger', 'Remove'); del.type = 'button';
            del.addEventListener('click', () => { a[q.id].splice(idx, 1); draw(); Render.onChange(q); });
            hd.append(del); card.append(hd);
            q.fields.forEach(f => {
              const fr = el('div', 'q');
              fr.append(el('label', 'q-label', Engine.label(f, record)));
              const proxy = { answers: item, country: record.country };
              const ctrlWrap = el('div', 'q-ctrl');
              ctrlWrap.append(Render.control(f, proxy));
              fr.append(ctrlWrap);
              card.append(fr);
            });
            list.append(card);
          });
          addBtn.style.display = (q.max && a[q.id].length >= q.max) ? 'none' : '';
        };
        const addBtn = el('button', 'btn-secondary', q.addLabel || 'Add');
        addBtn.type = 'button';
        addBtn.addEventListener('click', () => { a[q.id].push({}); draw(); Render.onChange(q); });
        w.append(list); w.append(addBtn);
        draw();
        return w;
      }

      case 'geo_l1': {
        const s = el('select'); s.id = id;
        s.append(new Option('— select —', ''));
        c.adminL1.forEach(o => s.append(new Option(o, o)));
        s.value = a[q.id] || '';
        s.addEventListener('change', () => {
          set(s.value);
          if (q.id === 'admin_l1') { a.admin_l2 = ''; a.admin_l3 = ''; }
          Render.onChange(q, true);
        });
        return s;
      }

      case 'geo_l2': {
        const s = el('select'); s.id = id;
        const subs = (c.geo[a.admin_l1] || {});
        s.append(new Option('— select —', ''));
        Object.keys(subs).forEach(o => s.append(new Option(o, o)));
        s.append(new Option('Other (specify)', 'Other (specify)'));
        s.value = a[q.id] || '';
        s.addEventListener('change', () => { set(s.value); a.admin_l3 = ''; Render.onChange(q, true); });
        if (!Object.keys(subs).length) {
          const i = el('input'); i.id = id; i.type = 'text'; i.value = a[q.id] || '';
          i.addEventListener('input', () => set(i.value));
          return i;
        }
        return s;
      }

      case 'geo_l3': {
        const wards = ((c.geo[a.admin_l1] || {})[a.admin_l2] || []);
        if (!wards.length) {
          const i = el('input'); i.id = id; i.type = 'text'; i.value = a[q.id] || '';
          i.addEventListener('input', () => set(i.value));
          return i;
        }
        const s = el('select'); s.id = id;
        s.append(new Option('— select —', ''));
        wards.forEach(o => s.append(new Option(o, o)));
        s.append(new Option('Other (specify)', 'Other (specify)'));
        s.value = a[q.id] || '';
        s.addEventListener('change', () => set(s.value));
        return s;
      }

      case 'geo_settlement': {
        const s = el('select'); s.id = id;
        s.append(new Option('— select —', ''));
        c.settlements.forEach(o => s.append(new Option(o, o)));
        s.value = a[q.id] || '';
        s.addEventListener('change', () => set(s.value));
        return s;
      }

      case 'geo': {
        const w = el('div', 'geo'); w.id = id;
        const out = el('div', 'geo-val');
        const paint = () => {
          const v = a[q.id];
          out.textContent = v && v.lat
            ? `${Number(v.lat).toFixed(5)}, ${Number(v.lng).toFixed(5)}` +
              (v.acc ? ` (±${Math.round(v.acc)} m)` : '')
            : 'Not captured';
          out.className = 'geo-val' + (v && v.lat ? ' has' : '');
        };
        const b = el('button', 'btn-secondary', 'Use my location'); b.type = 'button';
        b.addEventListener('click', () => {
          if (!navigator.geolocation) { out.textContent = 'Geolocation not available'; return; }
          b.disabled = true; b.textContent = 'Locating…';
          navigator.geolocation.getCurrentPosition(p => {
            set({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy, at: new Date().toISOString() });
            paint(); b.disabled = false; b.textContent = 'Update location';
          }, err => {
            out.textContent = 'Could not get location (' + err.message + ') — enter manually below';
            b.disabled = false; b.textContent = 'Retry';
            man.style.display = '';
          }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
        });
        const man = el('div', 'geo-manual'); man.style.display = (a[q.id] && a[q.id].lat) ? 'none' : '';
        const la = el('input'); la.type = 'number'; la.step = 'any'; la.placeholder = 'Latitude';
        const lo = el('input'); lo.type = 'number'; lo.step = 'any'; lo.placeholder = 'Longitude';
        if (a[q.id]) { la.value = a[q.id].lat ?? ''; lo.value = a[q.id].lng ?? ''; }
        const upd = () => { set({ lat: la.value, lng: lo.value, manual: true }); paint(); };
        la.addEventListener('input', upd); lo.addEventListener('input', upd);
        man.append(la); man.append(lo);
        w.append(b); w.append(out); w.append(man);
        paint();
        return w;
      }

      case 'photo': {
        const w = el('div', 'photos'); w.id = id;
        if (!Array.isArray(a[q.id])) a[q.id] = [];
        const grid = el('div', 'photo-grid');
        const draw = () => {
          grid.innerHTML = '';
          a[q.id].forEach((p, i) => {
            const cell = el('div', 'photo-cell');
            const img = el('img'); img.src = p.data; img.alt = p.name || 'photo';
            const x = el('button', 'photo-del', '×'); x.type = 'button';
            x.addEventListener('click', () => { a[q.id].splice(i, 1); draw(); Render.onChange(q); });
            cell.append(img); cell.append(x); grid.append(cell);
          });
        };
        const inp = el('input'); inp.type = 'file'; inp.accept = 'image/*';
        inp.capture = 'environment';
        if (q.multiple) inp.multiple = true;
        inp.addEventListener('change', async () => {
          for (const f of Array.from(inp.files)) {
            const data = await Render.shrinkImage(f);
            a[q.id].push({ name: f.name, data, at: new Date().toISOString() });
          }
          inp.value = ''; draw(); Render.onChange(q);
        });
        w.append(inp); w.append(grid);
        w.append(el('p', 'q-help', 'Photos are compressed and stored on this device only until you sync.'));
        draw();
        return w;
      }

      default: {
        const i = el('input'); i.id = id; i.type = 'text';
        i.value = a[q.id] || '';
        i.addEventListener('input', () => set(i.value));
        return i;
      }
    }
  },

  /* Downscale photos so a day of fieldwork fits comfortably on device */
  shrinkImage(file, maxDim = 1280, quality = 0.7) {
    return new Promise(resolve => {
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          let { width: w, height: h } = img;
          const scale = Math.min(1, maxDim / Math.max(w, h));
          w = Math.round(w * scale); h = Math.round(h * scale);
          const cv = document.createElement('canvas');
          cv.width = w; cv.height = h;
          cv.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(cv.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(fr.result);
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
};

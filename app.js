/* =====================================================================
   Jackfruit x Open Capital — ECD & Childcare Centre Survey — engine
   Offline-first PWA: enumerator selection, data-driven form with skip
   logic, GPS, photo capture, IndexedDB storage, and sync to a Google
   Apps Script endpoint (which writes to a Sheet + Drive).

   Same engine as the Jackfruit + CHAI health survey, with one addition:
   the enumerator's name sets the country, and every money field, place
   name, option list and phone format follows from it (KES + Kenyan
   geography, or UGX + Ugandan geography).
   ===================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* IndexedDB tiny wrapper                                              */
  /* ------------------------------------------------------------------ */
  const DB_NAME = "jf_ecd_survey";
  const DB_VER = 1;
  let _db = null;

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("submissions"))
          db.createObjectStore("submissions", { keyPath: "id" });
        if (!db.objectStoreNames.contains("kv"))
          db.createObjectStore("kv", { keyPath: "key" });
      };
      req.onsuccess = () => { _db = req.result; resolve(_db); };
      req.onerror = () => reject(req.error);
    });
  }
  function tx(store, mode) { return _db.transaction(store, mode).objectStore(store); }
  function idbGet(store, key) {
    return new Promise((res, rej) => { const r = tx(store, "readonly").get(key); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  }
  function idbAll(store) {
    return new Promise((res, rej) => { const r = tx(store, "readonly").getAll(); r.onsuccess = () => res(r.result || []); r.onerror = () => rej(r.error); });
  }
  function idbPut(store, val) {
    return new Promise((res, rej) => { const r = tx(store, "readwrite").put(val); r.onsuccess = () => res(val); r.onerror = () => rej(r.error); });
  }
  function idbDel(store, key) {
    return new Promise((res, rej) => { const r = tx(store, "readwrite").delete(key); r.onsuccess = () => res(); r.onerror = () => rej(r.error); });
  }

  /* settings helpers (kv store) */
  async function getKV(key, dflt) { const v = await idbGet("kv", key); return v ? v.value : dflt; }
  async function setKV(key, value) { return idbPut("kv", { key, value }); }

  /* ------------------------------------------------------------------ */
  /* small utilities                                                    */
  /* ------------------------------------------------------------------ */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const app = $("#app");
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => { const r = Math.random()*16|0; return (c==="x"?r:(r&0x3|0x8)).toString(16); }));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]));
  const fmtDate = (ts) => { const d = new Date(ts); return d.toLocaleDateString(undefined,{day:"numeric",month:"short"}) + " " + d.toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit"}); };

  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2200);
  }
  function modal(html) {
    const root = $("#modalRoot");
    root.innerHTML = `<div class="modal-back">${html}</div>`;
    root.querySelector(".modal-back").addEventListener("click", (e) => { if (e.target.classList.contains("modal-back")) closeModal(); });
    return root;
  }
  function closeModal() { $("#modalRoot").innerHTML = ""; }

  // Enumerators come from the schema so each carries its country.
  const DEFAULT_ENUMERATORS = window.SURVEY.ENUMERATORS.map(e => e.name);
  const COUNTRY_OF = {};
  const REGION_OF = {};
  window.SURVEY.ENUMERATORS.forEach(e => { COUNTRY_OF[e.name] = e.country; REGION_OF[e.name] = e.region; });

  // Sync URL shipped with the app so no device needs manual setup.
  // (Can still be overridden per device in the settings menu.)
  const DEFAULT_ENDPOINT = "https://script.google.com/macros/s/AKfycbx-QH5K02E5HsBMeU5X9a3zeOGBBz4qvKmL-dJx6fgOvbIiP_eMtDuf6PEt5c1x5sI2/exec";

  /* ---------------- country resolution ------------------------------
     The enumerator picked on the first screen decides the country, and
     the country decides currency, place names, option lists, tax-ID
     label and phone format. A survey stores its country so a record
     collected in Kampala still reads back in UGX on any device.       */
  function countryOf(name) { return COUNTRY_OF[name] || "KE"; }
  function CO() {
    const code = (state.current && state.current.country) || countryOf(state.enumerator);
    return window.SURVEY.COUNTRIES[code] || window.SURVEY.COUNTRIES.KE;
  }
  const CUR = () => CO().currency;
  // Resolve "@adminL1Label" style labels and country-specific option lists.
  function qLabel(q) {
    const l = q.label || "";
    return l.charAt(0) === "@" ? (CO()[l.slice(1)] || l) : l;
  }
  function qOptions(q) {
    if (q.optionsKey) return CO()[q.optionsKey] || [];
    if (q.cascade === "l2") {
      const a = state.current.answers;
      return Object.keys((CO().geo || {})[a.admin_l1] || {});
    }
    if (q.cascade === "l3") {
      const a = state.current.answers;
      return (((CO().geo || {})[a.admin_l1] || {})[a.admin_l2]) || [];
    }
    return q.options || [];
  }
  function qUnit(q) { return q.unit === "MONEY" ? CUR() : q.unit; }

  /* ------------------------------------------------------------------ */
  /* network status                                                     */
  /* ------------------------------------------------------------------ */
  function updateNet() {
    const on = navigator.onLine;
    const d = $("#netDot");
    d.className = "netdot " + (on ? "online" : "offline");
    $("#netText").textContent = on ? "Online" : "Offline";
    if (on) syncAll(true);
  }
  window.addEventListener("online", updateNet);
  window.addEventListener("offline", updateNet);

  /* ------------------------------------------------------------------ */
  /* condition / skip-logic engine                                      */
  /* ------------------------------------------------------------------ */
  function answerVal(answers, field) { return answers[field]; }
  function evalCond(cond, answers) {
    if (!cond) return true;
    if (cond.all) return cond.all.every(c => evalCond(c, answers));
    if (cond.any) return cond.any.some(c => evalCond(c, answers));
    const v = answerVal(answers, cond.field);
    if ("eq" in cond) return v === cond.eq;
    if ("ne" in cond) return v !== cond.ne;
    if ("in" in cond) return cond.in.includes(v);
    if ("gt" in cond) return Number(v) > cond.gt;
    if ("contains" in cond) return Array.isArray(v) && v.includes(cond.contains);
    return true;
  }
  function questionVisible(q, answers) { return evalCond(q.showIf, answers); }
  function sectionVisible(sec, answers) { return evalCond(sec.showIf, answers); }

  /* ------------------------------------------------------------------ */
  /* APP STATE                                                          */
  /* ------------------------------------------------------------------ */
  let state = {
    enumerator: null,
    enumerators: DEFAULT_ENUMERATORS.slice(),
    endpoint: "",
    current: null,        // active submission object
    sections: [],         // built sections for current branch
    sectionIdx: 0,        // absolute index into sections
  };

  /* ------------------------------------------------------------------ */
  /* ROUTING                                                            */
  /* ------------------------------------------------------------------ */
  async function route() {
    if (!state.enumerator) return renderEnumeratorPicker();
    return renderHome();
  }

  /* ===================== ENUMERATOR PICKER ========================== */
  function renderEnumeratorPicker() {
    const rows = state.enumerators.map((n, i) => {
      const c = window.SURVEY.COUNTRIES[countryOf(n)] || {};
      const region = REGION_OF[n] || "";
      return `
      <div class="enum-row">
        <div class="name" data-pick="${i}">
          <span class="enum-nm">${esc(n)}</span>
          <span class="enum-meta">${esc(c.name || "")}${region ? " · " + esc(region) : ""} <span class="cur-pill">${esc(c.currency || "")}</span></span>
        </div>
        <button class="del" data-del="${i}" title="Remove">✕</button>
      </div>`;
    }).join("");
    app.innerHTML = `
      <div class="screen">
        <h1 class="page-title">Who is collecting today?</h1>
        <p class="sub">Select your name to begin. Your name is attached to every survey you submit, and it sets the currency and place names used throughout.</p>
        <div class="enum-list">${rows || '<p class="kv">No enumerators yet — add one below.</p>'}</div>
        <hr class="soft" />
        <button id="addEnum" class="btn btn-outline btn-block">+ Add enumerator</button>
      </div>`;
    app.querySelectorAll("[data-pick]").forEach(el => el.addEventListener("click", async () => {
      state.enumerator = state.enumerators[+el.dataset.pick];
      await setKV("currentEnumerator", state.enumerator);
      renderHome();
    }));
    app.querySelectorAll("[data-del]").forEach(el => el.addEventListener("click", async () => {
      state.enumerators.splice(+el.dataset.del, 1);
      await setKV("enumerators", state.enumerators);
      renderEnumeratorPicker();
    }));
    $("#addEnum").addEventListener("click", () => {
      modal(`<div class="modal"><h3>Add enumerator</h3>
        <input id="newEnum" type="text" placeholder="Full name" />
        <div class="row" style="margin-top:14px">
          <button class="btn btn-outline" id="cancel">Cancel</button>
          <button class="btn btn-primary" id="save">Add</button>
        </div></div>`);
      $("#cancel").addEventListener("click", closeModal);
      $("#save").addEventListener("click", async () => {
        const v = $("#newEnum").value.trim(); if (!v) return;
        state.enumerators.push(v); await setKV("enumerators", state.enumerators); closeModal(); renderEnumeratorPicker();
      });
      $("#newEnum").focus();
    });
  }

  /* ========================== HOME ================================== */
  async function renderHome() {
    // Only show surveys collected by the currently selected enumerator.
    const all = (await idbAll("submissions"))
      .filter(s => s.enumerator === state.enumerator)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    const pending = all.filter(s => s.status === "pending" || s.status === "error" || s.status === "pending_delete").length;
    const items = all.map(s => {
      const label = s.answers.centre_name || s.answers.interviewee_name || "(unnamed centre)";
      const editBtn = (s.status !== "pending_delete")
        ? `<button class="editbtn" data-editsurvey="${s.id}" title="Edit survey">✎ Edit</button>` : "";
      const delBtn = (s.status !== "pending_delete")
        ? `<button class="del" data-delsurvey="${s.id}" title="Delete survey">🗑</button>` : "";
      return `<div class="card survey-item">
        <div class="meta tappable" data-open="${s.id}">
          <div class="title">${esc(label)}</div>
          <div class="small">${esc(s.centreType || "—")} · ${esc((window.SURVEY.COUNTRIES[s.country]||{}).currency || "")} · ${fmtDate(s.updatedAt)}</div>
        </div>
        <span class="badge ${s.status}">${statusLabel(s.status)}</span>
        ${editBtn}
        ${delBtn}
      </div>`;
    }).join("");

    app.innerHTML = `
      <div class="screen">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <div>
            <h1 class="page-title" style="margin:0">Surveys</h1>
            <p class="sub" style="margin:2px 0 0">Collecting as <strong>${esc(state.enumerator)}</strong> · ${esc((window.SURVEY.COUNTRIES[countryOf(state.enumerator)]||{}).name || "")} · ${esc((window.SURVEY.COUNTRIES[countryOf(state.enumerator)]||{}).currency || "")} · <span class="muted-link" id="switchEnum">switch</span></p>
          </div>
        </div>
        <button id="newSurvey" class="btn btn-primary btn-block btn-lg" style="margin:14px 0">+ Start new survey</button>
        ${pending ? `<button id="syncNow" class="btn btn-gold btn-block" style="margin-bottom:14px">⟳ Sync ${pending} pending survey${pending>1?"s":""}</button>` : ""}
        ${all.length ? items : `<div class="empty-state"><div class="big">🧸</div>No surveys yet.<br/>Tap “Start new survey”.</div>`}
      </div>`;

    $("#newSurvey").addEventListener("click", startNewSurvey);
    $("#switchEnum").addEventListener("click", async () => { state.enumerator = null; await setKV("currentEnumerator", null); renderEnumeratorPicker(); });
    if (pending) $("#syncNow").addEventListener("click", () => syncAll(false));
    app.querySelectorAll("[data-open]").forEach(el => el.addEventListener("click", () => openSubmission(el.dataset.open)));
    app.querySelectorAll("[data-editsurvey]").forEach(el => el.addEventListener("click", (e) => {
      e.stopPropagation(); openSubmission(el.dataset.editsurvey);
    }));
    app.querySelectorAll("[data-delsurvey]").forEach(el => el.addEventListener("click", (e) => {
      e.stopPropagation(); confirmDeleteSurvey(el.dataset.delsurvey);
    }));
  }
  async function confirmDeleteSurvey(id) {
    const sub = await idbGet("submissions", id);
    if (!sub) return;
    const wasSynced = !!sub.syncedAt || sub.status === "synced";
    const body = wasSynced
      ? `<h3>Delete this survey?</h3><p>This permanently removes it from this device <strong>and</strong> from the Google Sheet and Drive. This can't be undone.</p>`
      : `<h3>Delete survey?</h3><p>This survey hasn't been submitted. Deleting it can't be undone.</p>`;
    modal(`<div class="modal">${body}
      <div class="row">
        <button class="btn btn-outline" id="cancelDel">Cancel</button>
        <button class="btn btn-danger" id="confirmDel">Delete</button>
      </div></div>`);
    $("#cancelDel").addEventListener("click", closeModal);
    $("#confirmDel").addEventListener("click", async () => {
      closeModal();
      if (!wasSynced) { await idbDel("submissions", id); toast("Survey deleted"); renderHome(); return; }
      // Synced: mark for backend deletion, then attempt it now.
      sub.status = "pending_delete"; await idbPut("submissions", sub); renderHome();
      if (navigator.onLine && state.endpoint) {
        const ok = await deleteOne(sub);
        toast(ok ? "Deleted from device and cloud ✓" : "Couldn't reach cloud — will delete when online");
      } else {
        toast("Queued — will delete from the cloud when back online");
      }
      if (!state.current) renderHome();
    });
  }
  function statusLabel(s) { return ({ draft:"Draft", pending:"Not synced", synced:"Synced", error:"Sync failed", pending_delete:"Deleting…" })[s] || s; }

  /* ===================== START / OPEN SURVEY ======================== */
  async function startNewSurvey() {
    const sub = {
      id: uuid(), enumerator: state.enumerator,
      country: countryOf(state.enumerator), region: REGION_OF[state.enumerator] || "",
      centreType: null,
      answers: {}, fieldStatus: {}, status: "draft", createdAt: Date.now(), updatedAt: Date.now(), syncedAt: null, autoGeo: null,
    };
    await idbPut("submissions", sub);
    captureAutoGeo(sub.id);       // best-effort background GPS
    openSubmission(sub.id);
  }
  async function openSubmission(id) {
    const sub = await idbGet("submissions", id);
    if (!sub) return renderHome();
    if (sub.status === "synced") {
      // allow review only
    }
    if (!sub.country) sub.country = countryOf(sub.enumerator); // older drafts
    state.current = sub;
    state.sections = window.SURVEY.buildSections(sub.centreType);
    state.sectionIdx = 0;
    renderSection();
  }

  function captureAutoGeo(id) {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async pos => {
      const sub = await idbGet("submissions", id); if (!sub) return;
      sub.autoGeo = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy), ts: Date.now() };
      await idbPut("submissions", sub);
      if (state.current && state.current.id === id) state.current.autoGeo = sub.autoGeo;
    }, () => {}, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  }

  /* ======================== SAVE answer ============================= */
  async function persist() {
    state.current.updatedAt = Date.now();
    if (state.current.status === "synced") state.current.status = "pending";
    await idbPut("submissions", state.current);
  }

  /* ===================== RENDER A SECTION =========================== */
  function visibleSectionIndexes() {
    return state.sections.map((s, i) => i).filter(i => sectionVisible(state.sections[i], state.current.answers));
  }

  function renderSection(opts) {
    opts = opts || {};
    const prevY = window.scrollY;
    const a = state.current.answers;
    // Always rebuild from the selected centre type so daycare vs ECD routing
    // is correct. Comparing section COUNT is not enough to detect a branch
    // switch, so the sections are rebuilt on every render.
    state.sections = window.SURVEY.buildSections(state.current.centreType);

    const vis = visibleSectionIndexes();
    // ensure current section is visible; if not, snap to nearest visible
    if (!vis.includes(state.sectionIdx)) state.sectionIdx = vis.find(i => i >= state.sectionIdx) ?? vis[vis.length-1];

    const sec = state.sections[state.sectionIdx];
    const posInVis = vis.indexOf(state.sectionIdx);
    const pct = Math.round(((posInVis + 1) / vis.length) * 100);

    let groupsHtml = "";
    sec.groups.forEach(g => {
      const qHtml = g.questions
        .filter(q => questionVisible(q, a))
        .map(q => renderQuestion(q, a)).join("");
      if (!qHtml.trim()) return; // hide empty groups
      groupsHtml += `<div class="group-head">${esc(g.title)}</div>` +
        (g.note ? `<p class="help" style="margin-top:-2px">${esc(g.note)}</p>` : "") + qHtml;
    });

    const isFirst = posInVis === 0;
    const isLast = posInVis === vis.length - 1;

    app.innerHTML = `
      <div class="progress-wrap">
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="progress-label"><span>Step ${posInVis+1} of ${vis.length} · ${pct}%</span><button class="exitbtn" id="navExit">Exit ✕</button></div>
      </div>
      <div class="screen">
        <div class="section-head">
          <h2>${esc(sec.section)}</h2>
          ${sec.note ? `<div class="note">${esc(sec.note)}</div>` : ""}
        </div>
        ${sec.script ? `<div class="script-box"><span class="lbl">Read aloud</span><p>“${esc(sec.script)}”</p></div>` : ""}
        ${groupsHtml}
      </div>
      <div class="footnav">
        <button class="btn btn-outline" id="navPrev">${isFirst ? "Exit" : "Back"}</button>
        ${isLast
          ? `<button class="btn btn-primary" id="navFinish">Review & finish</button>`
          : `<button class="btn btn-primary" id="navNext">Next</button>`}
      </div>`;

    wireQuestions(sec, a);
    // Keep the enumerator's place on in-place answer updates; jump to top only
    // on real page navigation (Next / Back / first render).
    window.scrollTo(0, opts.keepScroll ? prevY : 0);
    // If we arrived here via a "Fix" button, scroll to and highlight that field.
    if (state.highlightField) {
      const hl = app.querySelector(`[data-qwrap="${state.highlightField}"]`);
      state.highlightField = null;
      if (hl) {
        hl.classList.add("q-highlight");
        if (typeof hl.scrollIntoView === "function") {
          try { hl.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) { try { hl.scrollIntoView(); } catch (e2) {} }
        }
        setTimeout(() => hl.classList.remove("q-highlight"), 2600);
      }
    }

    $("#navExit").addEventListener("click", async () => { await persist(); toast("Saved as draft"); renderHome(); });
    $("#navPrev").addEventListener("click", async () => {
      await persist();
      if (isFirst) return renderHome();
      const prev = [...vis].reverse().find(i => i < state.sectionIdx);
      state.sectionIdx = prev; renderSection();
    });
    if (isLast) $("#navFinish").addEventListener("click", async () => { await persist(); renderReview(); });
    else $("#navNext").addEventListener("click", async () => {
      if (!validateSection(sec, a)) { toast("Please complete the required fields"); renderSection(); return; }
      await persist();
      const next = vis.find(i => i > state.sectionIdx);
      state.sectionIdx = next; renderSection();
    });
  }

  /* ===================== RENDER ONE QUESTION ======================== */
  function renderQuestion(q, a) {
    const val = a[q.id];
    const req = q.required ? ' <span class="req-star">*</span>' : "";
    // help renders behind a tappable ⓘ "explanation bubble"
    const helpIcon = q.help ? `<button type="button" class="help-toggle" data-helptoggle="${q.id}" aria-label="Explanation">i</button>` : "";
    const help = q.help ? `<div class="qhelp" data-qhelp="${q.id}" hidden>${esc(q.help)}</div>` : "";
    let body = "";

    switch (q.type) {
      case "text": case "email": case "phone":
        if (q.autocomplete) {
          const ref = state.current.centreRef;
          const matched = (ref && val && ref.name && ref.name.toLowerCase() === String(val).toLowerCase())
            ? `<div class="ac-matched">✓ Matched <strong>${esc(ref.source)}</strong>${facCounty(ref) ? " · " + esc(facCounty(ref)) : ""} — known records attached (see review).</div>`
            : (val ? `<div class="help" style="margin-top:6px">Not in the sample list — recorded as a new centre.</div>` : "");
          body = `<div class="ac-wrap">
            <input type="text" autocomplete="off" data-ac data-q="${q.id}" value="${esc(val||"")}" placeholder="${esc(q.placeholder||"")}" />
            <div class="ac-results" data-acresults hidden></div>
            ${matched}
          </div>`;
        } else {
          const ph = q.type === 'phone' ? CO().phoneHint : (q.id === 'tax_id' ? CO().taxIdHint : (q.placeholder || ""));
          body = `<input type="${q.type==='phone'?'tel':(q.inputType||'text')}" data-q="${q.id}" value="${esc(val||"")}" placeholder="${esc(ph)}" />`;
        }
        break;
      case "textarea":
        body = `<textarea data-q="${q.id}" placeholder="${esc(q.placeholder||"")}">${esc(val||"")}</textarea>`;
        break;
      case "integer": case "number":
        body = affix(q, `<input type="number" inputmode="${q.type==='integer'?'numeric':'decimal'}" step="${q.type==='integer'?'1':'any'}" data-q="${q.id}" value="${val??""}" placeholder="${esc(q.placeholder||"")}" />`);
        break;
      case "percent":
        body = `<div class="input-affix"><input type="number" inputmode="numeric" min="0" max="100" data-q="${q.id}" value="${(val&&val!=='Unknown')?val:""}" ${val==='Unknown'?'disabled':''} placeholder="0–100" /><span class="affix suffix">%</span></div>`;
        if (q.allowUnknown) body += `<label class="unknown-toggle"><input type="checkbox" data-unknown="${q.id}" ${val==='Unknown'?'checked':''}/> Unknown</label>`;
        break;
      case "date":
        body = renderDateParts(q, val);
        break;
      case "yesno":
        body = choiceButtons(q.id, ["Yes","No"], val, true);
        break;
      case "yesnounsure":
        body = choiceButtons(q.id, ["Yes","No","Unsure"], val, true);
        break;
      case "select":
        body = renderSelect(q, val);
        break;
      case "multiselect":
        body = renderMulti(q, val);
        break;
      case "geo":
        body = renderGeo(q, val);
        break;
      case "photo":
        body = renderPhoto(q, val);
        break;
      case "repeat":
        body = renderRepeat(q, a);
        break;
      default:
        body = `<em>Unsupported type: ${esc(q.type)}</em>`;
    }
    const u = qUnit(q);
    const unit = (u && !["percent"].includes(q.type)) ? ` <span class="kv">(${esc(u)})</span>` : "";
    const st = fieldStatusOf(q.id);
    const flaggable = !q.noflags && !["photo","geo","repeat"].includes(q.type);
    const flags = flaggable ? `<div class="qflags">
      <button type="button" class="qflag ${st==='refused'?'on':''}" data-flag="${q.id}" data-st="refused">Refused</button>
      <button type="button" class="qflag ${st==='dk'?'on':''}" data-flag="${q.id}" data-st="dk">Doesn't know</button>
    </div>` : "";
    return `<div class="q ${st?'q-flagged':''} ${q.half?'q-half':''}" data-qwrap="${q.id}">
      <label class="qlabel">${esc(qLabel(q))}${unit}${req}${helpIcon}</label>${help}${body}${flags}</div>`;
  }

  function affix(q, inner) {
    const u = qUnit(q);
    if (q.unit === "MONEY") return `<div class="input-affix"><span class="affix">${esc(u)}</span>${inner}</div>`;
    if (u) return `<div class="input-affix">${inner}<span class="affix suffix">${esc(u)}</span></div>`;
    return inner;
  }
  function choiceButtons(qid, opts, val, row) {
    return `<div class="choices ${row?"row":""}">` + opts.map(o =>
      `<button type="button" class="choice ${row?"row":""} ${val===o?"sel":""}" data-choice="${qid}" data-val="${esc(o)}">${esc(o)}</button>`).join("") + `</div>`;
  }
  // Date entry as (Day /) Month / Year dropdowns — Year is a direct pick (no calendar scrolling).
  // q.monthOnly = true renders Month / Year only, stored as "yyyy-mm".
  function renderDateParts(q, val) {
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    let y = "", m = "", d = "";
    if (val) { const p = String(val).split("-"); y = p[0] || ""; m = p[1] || ""; d = p[2] || ""; }
    const now = new Date().getFullYear();
    let mOpts = `<option value="">Month</option>`;
    months.forEach((nm, i) => { const s = String(i+1).padStart(2, "0"); mOpts += `<option value="${s}" ${s===m?"selected":""}>${nm}</option>`; });
    let yOpts = `<option value="">Year</option>`;
    for (let yr = now + 30; yr >= now - 15; yr--) { yOpts += `<option value="${yr}" ${String(yr)===y?"selected":""}>${yr}</option>`; }
    if (q.monthOnly) {
      return `<div class="date-parts">
        <select data-dateq="${q.id}" data-datepart="month">${mOpts}</select>
        <select data-dateq="${q.id}" data-datepart="year">${yOpts}</select>
      </div>`;
    }
    let dOpts = `<option value="">Day</option>`;
    for (let dd = 1; dd <= 31; dd++) { const s = String(dd).padStart(2, "0"); dOpts += `<option value="${s}" ${s===d?"selected":""}>${dd}</option>`; }
    return `<div class="date-parts">
      <select data-dateq="${q.id}" data-datepart="day">${dOpts}</select>
      <select data-dateq="${q.id}" data-datepart="month">${mOpts}</select>
      <select data-dateq="${q.id}" data-datepart="year">${yOpts}</select>
    </div>`;
  }
  function renderDropdown(q, val) {
    const selectedOther = val === "__other__";
    let opts = `<option value="">— select —</option>`;
    opts += qOptions(q).map(o => `<option value="${esc(o)}" ${val===o?"selected":""}>${esc(o)}</option>`).join("");
    if (q.other) opts += `<option value="__other__" ${selectedOther?"selected":""}>Other</option>`;
    let html = `<select data-selq="${q.id}">${opts}</select>`;
    if (q.other && selectedOther) html += `<input type="text" style="margin-top:8px" data-other="${q.id}" placeholder="Please specify" value="${esc(window.__otherText(q.id)||"")}" />`;
    return html;
  }
  function renderSelect(q, val) {
    if (q.dropdown) return renderDropdown(q, val);
    const selectedOther = typeof val === "string" && val === "__other__";
    let html = `<div class="choices">` + qOptions(q).map(o =>
      `<button type="button" class="choice ${val===o?"sel":""}" data-choice="${q.id}" data-val="${esc(o)}">${esc(o)}${val===o?'<span class="tick">✓</span>':''}</button>`).join("");
    if (q.other) html += `<button type="button" class="choice ${selectedOther?"sel":""}" data-choice="${q.id}" data-val="__other__">Other${selectedOther?'<span class="tick">✓</span>':''}</button>`;
    html += `</div>`;
    if (q.other && selectedOther) html += `<input type="text" style="margin-top:8px" data-other="${q.id}" placeholder="Please specify" value="${esc(window.__otherText(q.id)||"")}" />`;
    return html;
  }
  function renderMulti(q, val) {
    const arr = Array.isArray(val) ? val : [];
    let html = `<div class="choices">` + qOptions(q).map(o =>
      `<button type="button" class="choice ${arr.includes(o)?"sel":""}" data-multi="${q.id}" data-val="${esc(o)}">${esc(o)}${arr.includes(o)?'<span class="tick">✓</span>':''}</button>`).join("");
    if (q.other) { const on = arr.includes("__other__");
      html += `<button type="button" class="choice ${on?"sel":""}" data-multi="${q.id}" data-val="__other__">Other${on?'<span class="tick">✓</span>':''}</button>`; }
    html += `</div>`;
    if (q.maxSelect) html += `<div class="help" style="margin:6px 0 0">Select up to ${q.maxSelect}.</div>`;
    if (q.other && arr.includes("__other__")) html += `<input type="text" style="margin-top:8px" data-other="${q.id}" placeholder="Please specify" value="${esc(window.__otherText(q.id)||"")}" />`;
    return html;
  }
  function renderGeo(q, val) {
    const auto = state.current.autoGeo;
    const g = val || (auto ? { ...auto, auto: true } : null);
    const read = g
      ? `<div class="geo-read">📍 ${g.lat.toFixed(6)}, ${g.lng.toFixed(6)} <span class="kv">(±${g.accuracy||"?"}m${g.auto?", auto":""})</span></div>`
      : `<div class="geo-read empty">No location captured yet.</div>`;
    return `<div class="geo-box">${read}<button type="button" class="btn btn-outline" data-geo="${q.id}">${g?"Update location":"Capture location"}</button></div>`;
  }
  function renderPhoto(q, val) {
    const arr = Array.isArray(val) ? val : [];
    const thumbs = arr.map((p, i) => `<div class="thumb"><img src="${p.dataUrl}" alt=""/><button type="button" data-photodel="${q.id}" data-i="${i}">✕</button></div>`).join("");
    return `<div class="photo-box">
      <div class="photo-thumbs">${thumbs}</div>
      <input type="file" accept="image/*" class="file-hidden" data-photo="${q.id}" />
      <button type="button" class="btn btn-outline" data-photobtn="${q.id}">📷 ${arr.length?"Add another photo":"Take photo or upload"}</button>
    </div>`;
  }
  function renderRepeat(q, a) {
    const n = Math.max(0, parseInt(a[q.countField] || 0, 10) || 0);
    const items = Array.isArray(a[q.id]) ? a[q.id] : [];
    let html = "";
    for (let i = 0; i < n; i++) {
      const item = items[i] || {};
      const fields = q.item.map(sub => {
        const v = item[sub.id];
        let inner;
        if (sub.type === "select") {
          inner = `<select data-repeat="${q.id}" data-i="${i}" data-sub="${sub.id}">
            <option value="">— select —</option>` + qOptions(sub).map(o => `<option ${v===o?"selected":""}>${esc(o)}</option>`).join("") + `</select>`;
        } else if (sub.type === "percent") {
          inner = `<div class="input-affix"><input type="number" min="0" max="100" data-repeat="${q.id}" data-i="${i}" data-sub="${sub.id}" value="${v??""}"/><span class="affix suffix">%</span></div>`;
        } else {
          inner = affix(sub, `<input type="${sub.type==='text'?'text':'number'}" data-repeat="${q.id}" data-i="${i}" data-sub="${sub.id}" value="${esc(v??"")}"/>`);
        }
        const su = qUnit(sub);
        return `<label class="qlabel" style="font-size:14px;margin-top:8px">${esc(qLabel(sub))}${su&&sub.type!=='percent'?` <span class="kv">(${esc(su)})</span>`:""}</label>${inner}`;
      }).join("");
      html += `<div class="repeat-item"><div class="ri-head">Loan ${i+1}</div>${fields}</div>`;
    }
    if (n === 0) html = `<p class="help">Set the count above to add loan details.</p>`;
    return html;
  }

  /* otherText storage helper (kept on answers as id__other) */
  window.__otherText = function (qid) { return state.current ? state.current.answers[qid + "__other"] : ""; };

  /* ===================== WIRE EVENTS =============================== */
  function wireQuestions(sec, a) {
    // text / number / date / email / phone / textarea (excluding the facility autocomplete)
    app.querySelectorAll("[data-q]:not([data-ac])").forEach(el => {
      el.addEventListener("input", () => { setAnswer(el.dataset.q, el.value === "" ? undefined : el.value); });
      el.addEventListener("change", () => { setAnswer(el.dataset.q, el.value === "" ? undefined : el.value); persist(); renderSection({keepScroll:true}); });
    });
    // facility-name searchable autocomplete
    app.querySelectorAll("[data-ac]").forEach(el => {
      const panel = el.parentElement.querySelector("[data-acresults]");
      el.addEventListener("input", () => {
        setAnswer(el.dataset.q, el.value === "" ? undefined : el.value);
        renderAcResults(panel, el.value);
      });
      el.addEventListener("focus", () => { if (el.value) renderAcResults(panel, el.value); });
      el.addEventListener("blur", () => { setTimeout(() => { persist(); renderSection({keepScroll:true}); }, 200); });
      if (panel) panel.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-acpick]"); if (!btn) return;
        el.value = btn.dataset.acpick; setAnswer(el.dataset.q, btn.dataset.acpick);
        persist(); panel.hidden = true; renderSection({keepScroll:true});
      });
    });
    // percent unknown
    app.querySelectorAll("[data-unknown]").forEach(el => el.addEventListener("change", () => {
      setAnswer(el.dataset.unknown, el.checked ? "Unknown" : undefined); persist(); renderSection({keepScroll:true});
    }));
    // yes/no/unsure
    app.querySelectorAll("[data-choice]").forEach(el => el.addEventListener("click", () => {
      const id = el.dataset.choice, v = el.dataset.val;
      setAnswer(id, a[id] === v ? undefined : v); persist(); renderSection({keepScroll:true});
    }));
    // multiselect
    app.querySelectorAll("[data-multi]").forEach(el => el.addEventListener("click", () => {
      const id = el.dataset.multi, v = el.dataset.val;
      const cur = Array.isArray(a[id]) ? a[id].slice() : [];
      const q = findQ(sec, id);
      const idx = cur.indexOf(v);
      if (idx >= 0) cur.splice(idx, 1);
      else { if (q.maxSelect && cur.length >= q.maxSelect) { toast(`Select up to ${q.maxSelect}`); return; } cur.push(v); }
      setAnswer(id, cur.length ? cur : undefined); persist(); renderSection({keepScroll:true});
    }));
    // dropdown selects
    app.querySelectorAll("[data-selq]").forEach(el => el.addEventListener("change", () => {
      setAnswer(el.dataset.selq, el.value === "" ? undefined : el.value); persist(); renderSection({keepScroll:true});
    }));
    // date parts — no re-render, so partial selections aren't lost. Supports Month/Year-only.
    app.querySelectorAll("[data-dateq]").forEach(el => el.addEventListener("change", () => {
      const id = el.dataset.dateq, wrap = el.closest(".date-parts");
      const dSel = wrap.querySelector('[data-datepart="day"]');
      const m = wrap.querySelector('[data-datepart="month"]').value;
      const y = wrap.querySelector('[data-datepart="year"]').value;
      if (dSel) { const d = dSel.value; setAnswer(id, (d && m && y) ? `${y}-${m}-${d}` : undefined); }
      else { setAnswer(id, (m && y) ? `${y}-${m}` : undefined); }
      persist();
    }));
    // explanation-bubble toggles
    app.querySelectorAll("[data-helptoggle]").forEach(el => el.addEventListener("click", (e) => {
      e.stopPropagation();
      const box = app.querySelector(`[data-qhelp="${el.dataset.helptoggle}"]`);
      if (box) box.hidden = !box.hidden;
    }));
    // other text
    app.querySelectorAll("[data-other]").forEach(el => {
      el.addEventListener("input", () => setAnswer(el.dataset.other + "__other", el.value || undefined));
    });
    // geo
    app.querySelectorAll("[data-geo]").forEach(el => el.addEventListener("click", () => captureGeo(el.dataset.geo)));
    // photo
    app.querySelectorAll("[data-photobtn]").forEach(el => el.addEventListener("click", () => {
      app.querySelector(`[data-photo="${el.dataset.photobtn}"]`).click();
    }));
    app.querySelectorAll("[data-photo]").forEach(el => el.addEventListener("change", (e) => handlePhoto(el.dataset.photo, e.target.files[0])));
    app.querySelectorAll("[data-photodel]").forEach(el => el.addEventListener("click", () => {
      const id = el.dataset.photodel; const arr = (a[id] || []).slice(); arr.splice(+el.dataset.i, 1);
      setAnswer(id, arr.length ? arr : undefined); persist(); renderSection({keepScroll:true});
    }));
    // refused / doesn't-know flags
    app.querySelectorAll("[data-flag]").forEach(el => el.addEventListener("click", () => markStatus(el.dataset.flag, el.dataset.st)));
    // repeat sub-fields
    app.querySelectorAll("[data-repeat]").forEach(el => el.addEventListener("change", () => {
      const id = el.dataset.repeat, i = +el.dataset.i, sub = el.dataset.sub;
      const arr = Array.isArray(a[id]) ? a[id].slice() : [];
      while (arr.length <= i) arr.push({});
      arr[i] = { ...arr[i], [sub]: el.value === "" ? undefined : el.value };
      setAnswer(id, arr); persist();
    }));
  }
  function findQ(sec, id) { for (const g of sec.groups) { const q = g.questions.find(q => q.id === id); if (q) return q; } return {}; }
  function setAnswer(id, v) {
    if (v === undefined) delete state.current.answers[id];
    else { state.current.answers[id] = v; if (state.current.fieldStatus) delete state.current.fieldStatus[id]; }
    if (id === "centre_type") state.current.centreType = (v === "__other__") ? "Other" : v;
    // Changing the top-level location clears the cascade below it.
    if (id === "admin_l1") { delete state.current.answers.admin_l2; delete state.current.answers.admin_l3; }
    if (id === "admin_l2") { delete state.current.answers.admin_l3; }
    if (id === "centre_name") {
      const entry = lookupCentre(v);
      state.current.centreRef = entry
        ? { name: entry.name, type: entry.type, source: entry.source, fields: entry.fields }
        : null;
      // Auto-populate centre type + county from the matched sample record.
      if (entry) {
        const ct = centreTypeFromEntry(entry);
        if (ct) {
          state.current.answers.centre_type = ct;
          state.current.centreType = ct;
          if (state.current.fieldStatus) delete state.current.fieldStatus.centre_type;
        }
        const cty = adminL1FromEntry(entry);
        if (cty) {
          state.current.answers.admin_l1 = cty;
          state.current.answers.obs_admin_l1 = cty;
          if (state.current.fieldStatus) { delete state.current.fieldStatus.admin_l1; delete state.current.fieldStatus.obs_admin_l1; }
        }
      }
    }
  }
  function centreTypeFromEntry(e) {
    if (!e) return null;
    const c = (e.fields && (e.fields.Category || e.fields.Type)) || "";
    const match = (window.SURVEY.CENTRE_TYPES || []).find(t => t.toLowerCase() === String(c).toLowerCase());
    return match || null;
  }
  function adminL1FromEntry(e) {
    const f = (e && e.fields) || {};
    let raw = f["County"] || f["District"] || f["Jackfruit county name"] || "";
    raw = String(raw).replace(/\s*(County|District)$/i, "").trim();
    return (CO().adminL1 || []).includes(raw) ? raw : null;
  }
  // Mark a question Refused / Doesn't know (instead of leaving it blank).
  function markStatus(id, status) {
    const fs = state.current.fieldStatus = state.current.fieldStatus || {};
    if (fs[id] === status) { delete fs[id]; }
    else { fs[id] = status; delete state.current.answers[id]; delete state.current.answers[id + "__other"]; }
    persist(); renderSection({keepScroll:true});
  }
  function fieldStatusOf(id) { return (state.current.fieldStatus || {})[id]; }

  /* ---- sample centre list (autocomplete + attached metadata) ------
     window.CENTRE_LIST is supplied by centres.js. It ships empty: when a
     sampling frame for ECD centres exists, drop it in and name matching,
     auto-fill and the ref_* columns all start working with no code
     change. Until then the field behaves as plain free text.          */
  let _facIndex = null;
  function facIndex() {
    if (_facIndex) return _facIndex;
    _facIndex = new Map();
    (window.CENTRE_LIST || []).forEach(e => _facIndex.set(e.name.trim().toLowerCase(), e));
    return _facIndex;
  }
  function lookupCentre(name) { return name ? (facIndex().get(String(name).trim().toLowerCase()) || null) : null; }
  function facCounty(e) {
    const f = (e && e.fields) || {};
    return f["County"] || f["District"] || f["Jackfruit county name"] || "";
  }
  function facTypeLabel(e) { return (e.fields && (e.fields["Category"] || e.fields["Type"])) || "Centre"; }
  // Substring search across name and county, ranked: name-prefix, then name-includes, then county.
  function searchCentres(query) {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return [];
    const list = window.CENTRE_LIST || [];
    const pre = [], inc = [], cty = [];
    for (const e of list) {
      const n = e.name.toLowerCase();
      const i = n.indexOf(q);
      if (i === 0) pre.push(e);
      else if (i > 0) inc.push(e);
      else if (facCounty(e).toLowerCase().includes(q)) cty.push(e);
    }
    return pre.concat(inc, cty).slice(0, 40);
  }
  function renderAcResults(el, query) {
    const results = searchCentres(query);
    if (!results.length) {
      el.innerHTML = query.trim()
        ? `<div class="ac-empty">No sample match — “${esc(query)}” will be saved as a new centre.</div>` : "";
      el.hidden = !query.trim();
      return;
    }
    el.innerHTML = results.map(e => `<button type="button" class="ac-item" data-acpick="${esc(e.name)}">
      <span class="ac-name">${esc(e.name)}</span>
      <span class="ac-sub">${esc([facCounty(e), facTypeLabel(e)].filter(Boolean).join(" · "))}</span>
    </button>`).join("");
    el.hidden = false;
  }
  // Flatten the matched record for the sheet / CSV (kept separate via ref_ prefix).
  function refColumns(sub) {
    const out = {};
    if (sub && sub.centreRef) {
      out["matched_sample"] = sub.centreRef.source + ": " + sub.centreRef.name;
      const f = sub.centreRef.fields || {};
      Object.keys(f).forEach(k => { out["ref_" + k] = f[k]; });
    }
    return out;
  }

  /* ---------------- GPS capture (manual) --------------------------- */
  function captureGeo(qid) {
    if (!navigator.geolocation) return toast("Geolocation not available");
    toast("Getting location…");
    navigator.geolocation.getCurrentPosition(pos => {
      setAnswer(qid, { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy), ts: Date.now() });
      persist(); renderSection({keepScroll:true}); toast("Location captured");
    }, err => toast("Location error: " + err.message), { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
  }

  /* ---------------- Photo capture + compress ----------------------- */
  function handlePhoto(qid, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1280; let { width, height } = img;
        if (width > max || height > max) { const r = Math.min(max/width, max/height); width = Math.round(width*r); height = Math.round(height*r); }
        const c = document.createElement("canvas"); c.width = width; c.height = height;
        c.getContext("2d").drawImage(img, 0, 0, width, height);
        const dataUrl = c.toDataURL("image/jpeg", 0.7);
        const arr = Array.isArray(state.current.answers[qid]) ? state.current.answers[qid].slice() : [];
        arr.push({ name: file.name || `photo_${arr.length+1}.jpg`, dataUrl });
        setAnswer(qid, arr); persist(); renderSection({keepScroll:true}); toast("Photo added");
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* ---------------- validation (light) ----------------------------- */
  function validateSection(sec, a) {
    let ok = true;
    sec.groups.forEach(g => g.questions.forEach(q => {
      if (q.required && questionVisible(q, a)) {
        const v = a[q.id];
        if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) ok = false;
      }
    }));
    return ok;
  }

  /* ---- unanswered-question detection ---- */
  function isAnswered(q, a) {
    if (fieldStatusOf(q.id)) return true; // Refused / Doesn't know counts as answered
    const v = a[q.id];
    if (q.type === "repeat") return true;
    if (q.type === "geo") return !!(v || (state.current && state.current.autoGeo));
    if (q.type === "photo") return Array.isArray(v) && v.length > 0;
    if (Array.isArray(v)) return v.length > 0;
    return !(v === undefined || v === null || v === "");
  }
  function missingQuestions() {
    const a = state.current.answers; const out = [];
    visibleSectionIndexes().forEach(si => {
      const sec = state.sections[si];
      sec.groups.forEach(g => g.questions.forEach(q => {
        if (q.type === "repeat") return;
        if (!questionVisible(q, a)) return;
        if (!isAnswered(q, a)) out.push({ qid: q.id, secIdx: si, section: sec.section, label: q.label });
      }));
    });
    return out;
  }
  // Absolute index of the section containing a question id.
  function sectionIdxOfField(qid) {
    for (let i = 0; i < state.sections.length; i++) {
      if (state.sections[i].groups.some(g => g.questions.some(q => q.id === qid))) return i;
    }
    return null;
  }
  // Jump back to a field, highlight it for review correction.
  function gotoField(qid) {
    const idx = sectionIdxOfField(qid);
    if (idx == null) return;
    state.sectionIdx = idx;
    state.highlightField = qid;
    renderSection();
  }

  function answeredCount() {
    const a = state.current.answers; let n = 0;
    visibleSectionIndexes().forEach(si => state.sections[si].groups.forEach(g => g.questions.forEach(q => {
      if (q.type === "repeat") return;
      if (questionVisible(q, a) && isAnswered(q, a)) n++;
    })));
    return n;
  }
  // Phone check by country. National significant number after stripping
  // spaces/dashes/+ and an optional country code or leading 0:
  //   Kenya  9 digits, mobile starts 7 or 1, landline 2/4/5/6
  //   Uganda 9 digits, mobile starts 7, landline 2/3/4
  function isValidPhone(raw, code) {
    let d = String(raw).replace(/[^\d]/g, "");
    if (code === "UG") {
      if (d.startsWith("256")) d = d.slice(3);
      else if (d.startsWith("0")) d = d.slice(1);
      return /^[2347]\d{8}$/.test(d);
    }
    if (d.startsWith("254")) d = d.slice(3);
    else if (d.startsWith("0")) d = d.slice(1);
    return /^[1245679]\d{8}$/.test(d);
  }

  // Soft data-quality warnings (never block submission).
  function dataWarnings() {
    const a = state.current.answers, w = [];
    const cur = CUR();
    const money = n => cur + " " + Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
    const num = id => { const n = parseFloat(a[id]); return (a[id] !== undefined && a[id] !== "" && a[id] !== "Unknown" && !isNaN(n)) ? n : null; };
    const sumOf = ids => ids.reduce((t, id) => t + (num(id) || 0), 0);

    /* percentage groups that should add to 100 */
    const pctGroups = [
      { label: "Revenue source %", ids: ["rev_pct_fees","rev_pct_government","rev_pct_donor","rev_pct_other"] },
      { label: "School revenue source %", ids: ["sch_rev_pct_fees","sch_rev_pct_government","sch_rev_pct_donor","sch_rev_pct_other"] },
    ];
    pctGroups.forEach(g => {
      const present = g.ids.filter(id => num(id) !== null);
      if (present.length) {
        const sum = present.reduce((t, id) => t + num(id), 0);
        if (Math.abs(sum - 100) > 1) w.push({ msg: `${g.label} adds up to ${Math.round(sum)}%, not 100%`, qid: present[0] });
      }
    });

    /* enrolment sanity */
    if (num("enrol_total") !== null && num("max_capacity") !== null && num("enrol_total") > num("max_capacity"))
      w.push({ msg: `Enrolment (${a.enrol_total}) is above the stated maximum capacity (${a.max_capacity})`, qid: "max_capacity" });
    if (num("avg_daily_attendance") !== null && num("enrol_total") !== null && num("avg_daily_attendance") > num("enrol_total"))
      w.push({ msg: "Average daily attendance is higher than total enrolment", qid: "avg_daily_attendance" });
    const bands = sumOf(["enrol_0_2","enrol_2_3","enrol_3_5","enrol_6p"]);
    if (bands > 0 && num("enrol_total") !== null && Math.abs(bands - num("enrol_total")) > 2)
      w.push({ msg: `Age bands add up to ${bands} but total enrolment is ${a.enrol_total}`, qid: "enrol_total" });
    const dcBands = sumOf(["enrol_u1_boys","enrol_u1_girls","enrol_1_boys","enrol_1_girls","enrol_2_boys","enrol_2_girls",
                           "enrol_3_boys","enrol_3_girls","enrol_4_boys","enrol_4_girls","enrol_5_boys","enrol_5_girls"]);
    if (dcBands > 0 && num("enrol_total") !== null && Math.abs(dcBands - num("enrol_total")) > 2)
      w.push({ msg: `The age table adds up to ${dcBands} but total enrolment is ${a.enrol_total}`, qid: "enrol_total" });
    if (num("peak_children") !== null && num("enrol_total") !== null && num("peak_children") < num("enrol_total"))
      w.push({ msg: "The highest number ever cared for is below current enrolment", qid: "peak_children" });

    /* staffing */
    const staffParts = sumOf(["staff_trained_ecd","staff_support"]) || sumOf(["staff_caregivers","staff_teachers","staff_cook","staff_cleaner"]);
    if (staffParts > 0 && num("staff_total") !== null && staffParts > num("staff_total"))
      w.push({ msg: `Staff categories add up to ${staffParts}, above the total of ${a.staff_total}`, qid: "staff_total" });
    if (num("caregiver_ratio") !== null && num("caregiver_ratio") > 25)
      w.push({ msg: `One caregiver to ${a.caregiver_ratio} children is very high — please confirm`, qid: "caregiver_ratio" });

    /* money sanity */
    if (num("payroll_monthly") !== null && num("monthly_revenue") !== null && num("payroll_monthly") > num("monthly_revenue"))
      w.push({ msg: "Monthly payroll is above monthly revenue — please confirm", qid: "payroll_monthly" });
    [["dd_rev_2025","cost_total"],["sdd_rev_2025","sdd_cost_total"]].forEach(([r, c]) => {
      const rev = num(r), cost = num(c);
      if (rev !== null && cost !== null && rev > 0 && cost > rev * 1.5)
        w.push({ msg: "Total costs are well above 2025 revenue — please confirm", qid: c });
    });
    /* daycare income / expense tables vs the stated surplus */
    const inc = sumOf(["inc_childcare_fees","inc_meals","inc_registration","inc_donations","inc_government","inc_ngo","inc_group","inc_other"]);
    const exp = sumOf(["exp_rent","exp_salaries","exp_food","exp_water","exp_electricity","exp_fuel","exp_learning",
                       "exp_toys","exp_cleaning","exp_transport","exp_repairs","exp_licences","exp_airtime","exp_other"]);
    if (inc > 0 && num("inc_total") !== null && Math.abs(inc - num("inc_total")) > Math.max(100, inc * 0.05))
      w.push({ msg: `Income lines add up to ${money(inc)} but the stated total is ${money(num("inc_total"))}`, qid: "inc_total" });
    if (exp > 0 && num("exp_total") !== null && Math.abs(exp - num("exp_total")) > Math.max(100, exp * 0.05))
      w.push({ msg: `Expense lines add up to ${money(exp)} but the stated total is ${money(num("exp_total"))}`, qid: "exp_total" });
    if (inc > 0 && exp > 0 && num("monthly_surplus") !== null &&
        Math.abs((inc - exp) - num("monthly_surplus")) > Math.max(1000, inc * 0.05))
      w.push({ msg: `Stated surplus ${money(num("monthly_surplus"))} does not match income minus expenses (${money(inc - exp)})`, qid: "monthly_surplus" });
    const surplus = (num("monthly_surplus") !== null) ? num("monthly_surplus") : ((inc > 0 && exp > 0) ? inc - exp : null);
    if (surplus !== null && surplus > 0 && num("repay_capacity_month") !== null && num("repay_capacity_month") > surplus)
      w.push({ msg: `Stated repayment capacity ${money(num("repay_capacity_month"))} is above the monthly surplus (${money(surplus)})`, qid: "repay_capacity_month" });
    if (num("income_lowest_12m") !== null && num("income_highest_12m") !== null && num("income_lowest_12m") > num("income_highest_12m"))
      w.push({ msg: "Lowest monthly income is above the highest", qid: "income_lowest_12m" });

    /* attached-to-primary: the unit cannot exceed the school */
    if (a.centre_type === window.SURVEY.ATTACHED_TYPE) {
      if (num("monthly_revenue") !== null && num("sch_monthly_revenue") !== null && num("monthly_revenue") > num("sch_monthly_revenue"))
        w.push({ msg: "ECD-unit revenue is above whole-school revenue", qid: "sch_monthly_revenue" });
      if (num("enrol_total") !== null && num("school_total_enrolment") !== null && num("enrol_total") > num("school_total_enrolment"))
        w.push({ msg: "ECD-unit enrolment is above total school enrolment", qid: "school_total_enrolment" });
    }

    /* fee period vs fee amount */
    if (a.fee_period === "No fees / free" && num("fee_amount") !== null && num("fee_amount") > 0)
      w.push({ msg: "The centre is recorded as free but a fee amount is entered", qid: "fee_amount" });

    /* formats */
    const yr = a.year_opened;
    if (yr != null && yr !== "") {
      const y = parseInt(yr, 10);
      if (isNaN(y) || String(yr).length !== 4 || y < 1900 || y > new Date().getFullYear())
        w.push({ msg: `Year opened (${yr}) looks off`, qid: "year_opened" });
    }
    ["owner_email","centre_email"].forEach(id => {
      if (a[id] && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a[id])) w.push({ msg: "Email format looks invalid", qid: id });
    });
    if (a.centre_phone != null && String(a.centre_phone).trim() !== "" && !isValidPhone(a.centre_phone, CO().code))
      w.push({ msg: `Phone number (${a.centre_phone}) doesn't look like a valid ${CO().name} number`, qid: "centre_phone" });

    return w;
  }

  /* ===================== REVIEW & SUBMIT =========================== */
  function renderReview() {
    const a = state.current.answers;
    const vis = visibleSectionIndexes();
    let html = "";
    vis.forEach(si => {
      const sec = state.sections[si];
      let rows = "";
      sec.groups.forEach(g => g.questions.forEach(q => {
        if (!questionVisible(q, a)) return;
        const disp = displayValue(q, a);
        if (disp === "" || disp == null) return;
        rows += `<div style="display:flex;gap:10px;padding:6px 0;border-bottom:1px solid var(--line)">
          <div style="flex:1;color:var(--muted);font-size:13px">${esc(qLabel(q))}</div>
          <div style="flex:1;font-weight:600;font-size:14px">${disp}</div></div>`;
      }));
      if (rows) html += `<div class="card"><div class="group-head" style="margin-top:0">${esc(sec.section)}</div>${rows}</div>`;
    });

    let refCard = "";
    if (state.current.centreRef) {
      const f = state.current.centreRef.fields || {};
      const rows = Object.keys(f).map(k => `<div style="display:flex;gap:10px;padding:6px 0;border-bottom:1px solid var(--line)">
        <div style="flex:1;color:var(--muted);font-size:13px">${esc(k)}</div>
        <div style="flex:1;font-weight:600;font-size:14px">${esc(f[k] == null ? "" : f[k])}</div></div>`).join("");
      refCard = `<div class="card" style="border-color:var(--teal)">
        <div class="group-head" style="margin-top:0">Matched record · ${esc(state.current.centreRef.source)}</div>
        <p class="help" style="margin-top:-2px">Pre-filled from the sample list and stored alongside the survey.</p>
        ${rows}</div>`;
    }
    let missingCard = "";
    const miss = missingQuestions();
    if (miss.length) {
      const items = miss.map(m => `<div class="fixrow">
        <span>${esc(m.label)} <span class="kv">· ${esc(m.section.replace(/ ·.*/, ""))}</span></span>
        <button class="btn-fix" data-fix="${esc(m.qid)}">Fix</button></div>`).join("");
      missingCard = `<div class="card" style="border-color:var(--warn)">
        <div class="group-head" style="margin-top:0;color:var(--warn)">⚠ ${miss.length} question${miss.length>1?"s":""} not filled in</div>
        <p class="help" style="margin-top:-2px">You can still submit — these will be saved blank.</p>
        ${items}</div>`;
    }
    let warnCard = "";
    const warns = dataWarnings();
    if (warns.length) {
      const items = warns.map(x => `<div class="fixrow">
        <span>${esc(x.msg)}</span>
        ${x.qid ? `<button class="btn-fix" data-fix="${esc(x.qid)}">Fix</button>` : ""}</div>`).join("");
      warnCard = `<div class="card" style="border-color:var(--danger)">
        <div class="group-head" style="margin-top:0;color:var(--danger)">⚑ ${warns.length} data check${warns.length>1?"s":""} to review</div>
        <p class="help" style="margin-top:-2px">Warnings only — you can still submit.</p>
        ${items}</div>`;
    }
    app.innerHTML = `
      <div class="screen">
        <h1 class="page-title">Review</h1>
        <p class="sub">${esc(state.enumerator)} · ${esc(CO().name)} · all money in ${esc(CUR())}. Check the answers, then submit. Submitted data syncs when you’re online.</p>
        ${warnCard}${missingCard}${refCard}${html || '<p class="kv">No answers recorded.</p>'}
      </div>
      <div class="footnav">
        <button class="btn btn-ghost" id="reviewExit">Exit</button>
        <button class="btn btn-outline" id="backEdit">Back to edit</button>
        <button class="btn btn-primary" id="submitSurvey">Submit</button>
      </div>`;
    $("#reviewExit").addEventListener("click", async () => { await persist(); toast("Saved as draft"); renderHome(); });
    $("#backEdit").addEventListener("click", () => { state.sectionIdx = vis[vis.length-1]; renderSection(); });
    $("#submitSurvey").addEventListener("click", submitSurvey);
    app.querySelectorAll("[data-fix]").forEach(el => el.addEventListener("click", () => gotoField(el.dataset.fix)));
  }
  function displayValue(q, a) {
    const st = fieldStatusOf(q.id);
    if (st) return st === "refused" ? "<em>Refused</em>" : "<em>Doesn't know</em>";
    let v = a[q.id];
    if (v === undefined) return "";
    if (q.type === "photo") return Array.isArray(v) ? `${v.length} photo(s)` : "";
    if (q.type === "geo") { const g = v || state.current.autoGeo; return g ? `📍 ${g.lat.toFixed(5)}, ${g.lng.toFixed(5)}` : ""; }
    if (q.type === "repeat") return Array.isArray(v) ? `${v.length} loan(s) recorded` : "";
    if (q.type === "percent") return v === "Unknown" ? "Unknown" : esc(v) + "%";
    if (Array.isArray(v)) { v = v.map(x => x === "__other__" ? ("Other: " + (a[q.id+"__other"]||"")) : x); return esc(v.join(", ")); }
    if (v === "__other__") return "Other: " + esc(a[q.id+"__other"]||"");
    if (q.unit === "MONEY" && v !== "" && !isNaN(Number(v)))
      return esc(CUR() + " " + Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 }));
    return esc(v);
  }

  function submitSurvey() {
    const miss = missingQuestions();
    const answered = answeredCount();
    const sparse = answered < 5;
    if (miss.length || sparse) {
      const lines = [];
      if (sparse) lines.push(`<strong>This survey has very little data (${answered} answer${answered===1?"":"s"}).</strong> Please confirm it should be submitted.`);
      if (miss.length) lines.push(`${miss.length} question${miss.length>1?"s are":" is"} not filled in — they'll be saved blank.`);
      modal(`<div class="modal">
        <h3>${sparse ? "Submit a near-empty survey?" : `Submit with ${miss.length} unanswered?`}</h3>
        <p>${lines.join("<br><br>")}</p>
        <div class="row">
          <button class="btn btn-outline" id="keepEditing">Keep editing</button>
          <button class="btn btn-primary" id="submitAnyway">Submit anyway</button>
        </div></div>`);
      $("#keepEditing").addEventListener("click", closeModal);
      $("#submitAnyway").addEventListener("click", () => { closeModal(); doSubmit(); });
      return;
    }
    doSubmit();
  }
  async function doSubmit() {
    state.current.status = "pending";
    state.current.completedAt = Date.now();
    state.current.updatedAt = Date.now();
    await idbPut("submissions", state.current);
    if (navigator.onLine && state.endpoint) {
      toast("Submitting…");
      const ok = await syncOne(state.current);
      toast(ok ? "Submitted & synced ✓" : "Saved — will sync later");
    } else {
      toast(state.endpoint ? "Saved offline — will sync when online" : "Saved. Set sync URL in ☰ to upload");
    }
    state.current = null;
    renderHome();
  }

  /* ===================== SYNC ====================================== */
  async function syncOne(sub) {
    if (!state.endpoint) return false;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000); // never hang forever
    try {
      const payload = {
        id: sub.id, enumerator: sub.enumerator, centreType: sub.centreType,
        country: sub.country || countryOf(sub.enumerator),
        currency: (window.SURVEY.COUNTRIES[sub.country || countryOf(sub.enumerator)] || {}).currency,
        region: sub.region || "",
        // Survey answers plus the matched sample record (ref_* columns), kept distinct.
        answers: Object.assign({}, serializeAnswers(sub), refColumns(sub)),
        centreRef: sub.centreRef || null,
        autoGeo: sub.autoGeo,
        createdAt: sub.createdAt, completedAt: sub.completedAt || sub.updatedAt,
      };
      const res = await fetch(state.endpoint, {
        method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload), signal: ctrl.signal, redirect: "follow",
      });
      const out = await res.json().catch(() => ({}));
      if (out && out.ok) {
        sub.status = "synced"; sub.syncedAt = Date.now(); await idbPut("submissions", sub); return true;
      }
      sub.status = "error"; await idbPut("submissions", sub); return false;
    } catch (e) {
      sub.status = "error"; await idbPut("submissions", sub); return false;
    } finally {
      clearTimeout(timer);
    }
  }
  // flatten answers for the sheet; photos -> array of {name,dataUrl}; combine other text
  function serializeAnswers(sub) {
    const a = sub.answers; const out = {};
    Object.keys(a).forEach(k => {
      if (k.endsWith("__other")) return;
      let v = a[k];
      if (Array.isArray(v) && v.length && typeof v[0] === "object" && v[0].dataUrl) { out[k] = v; return; } // photos
      if (Array.isArray(v) && v.length && typeof v[0] === "object") { out[k] = v; return; } // repeat
      if (Array.isArray(v)) v = v.map(x => x === "__other__" ? ("Other: " + (a[k+"__other"]||"")) : x).join("; ");
      else if (v === "__other__") v = "Other: " + (a[k+"__other"]||"");
      out[k] = v;
    });
    // include Refused / Doesn't know flags as the recorded value
    const fs = sub.fieldStatus || {};
    Object.keys(fs).forEach(k => { if (!(k in out)) out[k] = fs[k] === "refused" ? "Refused" : "Doesn't know"; });
    return out;
  }
  // Ask the backend to remove a synced survey (row + photos), then drop it locally.
  async function deleteOne(sub) {
    if (!state.endpoint) return false;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    try {
      const res = await fetch(state.endpoint, {
        method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "delete", id: sub.id, centreType: sub.centreType }),
        signal: ctrl.signal, redirect: "follow",
      });
      const out = await res.json().catch(() => ({}));
      if (out && out.ok) { await idbDel("submissions", sub.id); return true; }
      return false;
    } catch (e) { return false; } finally { clearTimeout(timer); }
  }
  let _syncing = false;
  async function syncAll(silent) {
    if (_syncing) { if (!silent) toast("Sync already running…"); return; }
    if (!navigator.onLine) { if (!silent) toast("You're offline — will sync when back online"); return; }
    if (!state.endpoint) { if (!silent) toast("Add the Sync URL in ☰ Settings first"); return; }
    const all = await idbAll("submissions");
    const uploads = all.filter(s => s.status === "pending" || s.status === "error");
    const deletes = all.filter(s => s.status === "pending_delete");
    if (!uploads.length && !deletes.length) { if (!silent) toast("Nothing to sync"); return; }
    _syncing = true; if (!silent) toast(`Syncing ${uploads.length + deletes.length}…`);
    let done = 0;
    try {
      for (const s of uploads) { if (await syncOne(s)) done++; }
      for (const s of deletes) { if (await deleteOne(s)) done++; }
    } finally {
      _syncing = false; // always release, even if a request hung or threw
    }
    const total = uploads.length + deletes.length;
    toast(done === total ? `Synced ${done} ✓` : `Synced ${done} of ${total} — others will retry`);
    if (!state.current) renderHome();
  }

  /* ===================== SETTINGS ================================== */
  $("#menuBtn").addEventListener("click", renderSettings);
  function renderSettings() {
    modal(`<div class="modal">
      <h3>Settings</h3>
      <div class="settings-field">
        <label>Sync URL (Google Apps Script)</label>
        <input type="text" id="setEndpoint" placeholder="https://script.google.com/macros/s/…/exec" value="${esc(state.endpoint||"")}" />
        <div class="help">Where submissions and photos are sent. From your deployed Apps Script web app.</div>
      </div>
      <div class="row" style="margin-bottom:10px">
        <button class="btn btn-outline" id="exportJson">Export JSON</button>
        <button class="btn btn-outline" id="exportCsv">Export CSV</button>
      </div>
      <div class="row">
        <button class="btn btn-ghost" id="closeSet">Close</button>
        <button class="btn btn-primary" id="saveSet">Save</button>
      </div>
    </div>`);
    $("#closeSet").addEventListener("click", closeModal);
    $("#saveSet").addEventListener("click", async () => {
      state.endpoint = $("#setEndpoint").value.trim(); await setKV("endpoint", state.endpoint); closeModal(); toast("Saved"); updateNet();
    });
    $("#exportJson").addEventListener("click", exportJson);
    $("#exportCsv").addEventListener("click", exportCsv);
  }
  async function exportJson() {
    const all = await idbAll("submissions");
    download("jf_ecd_surveys.json", JSON.stringify(all, null, 2), "application/json");
  }
  async function exportCsv() {
    const all = await idbAll("submissions");
    const rows = all.map(s => {
      const flat = serializeAnswers(s);
      Object.keys(flat).forEach(k => { if (Array.isArray(flat[k])) flat[k] = `[${flat[k].length} item(s)]`; });
      return { id:s.id, enumerator:s.enumerator, centreType:s.centreType,
        country:(window.SURVEY.COUNTRIES[s.country]||{}).name || "",
        currency:(window.SURVEY.COUNTRIES[s.country]||{}).currency || "",
        status:s.status,
        created: new Date(s.createdAt).toISOString(),
        gps: s.autoGeo ? `${s.autoGeo.lat},${s.autoGeo.lng}` : "", ...flat, ...refColumns(s) };
    });
    const cols = [...new Set(rows.flatMap(r => Object.keys(r)))];
    const csv = [cols.join(",")].concat(rows.map(r => cols.map(c => csvCell(r[c])).join(","))).join("\n");
    download("jf_ecd_surveys.csv", csv, "text/csv");
  }
  function csvCell(v) { if (v == null) return ""; const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; }
  function download(name, content, type) {
    const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
  }

  /* ===================== BOOT ====================================== */
  async function boot() {
    await openDB();
    state.enumerators = await getKV("enumerators", DEFAULT_ENUMERATORS.slice());
    // Make sure every shipped enumerator is present, so a device that stored
    // an older list still offers the full team (and their countries).
    DEFAULT_ENUMERATORS.forEach(n => { if (!state.enumerators.includes(n)) state.enumerators.push(n); });
    await setKV("enumerators", state.enumerators);
    state.enumerator = await getKV("currentEnumerator", null);
    state.endpoint = (await getKV("endpoint", "")) || DEFAULT_ENDPOINT;
    updateNet();
    route();
    if ("serviceWorker" in navigator) {
      try {
        const reg = await navigator.serviceWorker.register("sw.js");
        // Auto-apply a new version: when an updated worker finishes installing
        // and a controller already exists (i.e. this is an update, not the
        // first install), reload so the new files take effect immediately.
        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", () => {
            if (nw.state === "installed" && navigator.serviceWorker.controller) {
              if (!window.__jfReloaded) { window.__jfReloaded = true; location.reload(); }
            }
          });
        });
        // Check for a new version on every launch.
        reg.update();
      } catch (e) { /* ignore */ }
    }
  }
  boot();
})();

/* ------------------------------------------------------------------
   Rendering + logic engine.
   Resolves country-dependent labels/options, evaluates skip logic,
   renders every question type, validates, and computes totals.
   ------------------------------------------------------------------ */

const Engine = {

  /* ---------- context ---------- */
  ctx(record) {
    return COUNTRIES[record.country] || COUNTRIES.KE;
  },

  /* ---------- label resolution ---------- */
  label(q, record) {
    const c = this.ctx(record);
    if (q.labelFn) return q.labelFn(record.answers, c);
    let l = q.label || '';
    if (l.startsWith('@')) l = c[l.slice(1)] || l;
    return l.replace(/@CUR/g, c.currency);
  },

  options(q, record) {
    const c = this.ctx(record);
    if (q.optionsFn) return q.optionsFn(c);
    if (q.optionsKey) return c[q.optionsKey] || [];
    if (q.optionsRef === 'MONTHS') return MONTHS;
    if (q.optionsRef === 'WEEKDAYS') return WEEKDAYS;
    return q.options || [];
  },

  /* ---------- visibility ---------- */
  visible(item, record) {
    if (!item.when) return true;
    try { return !!item.when(record.answers, this.ctx(record)); }
    catch (e) { return true; }
  },

  visibleSections(schema, record) {
    return schema.sections.filter(s => this.visible(s, record));
  },

  visibleQuestions(section, record) {
    const out = [];
    (section.groups || []).forEach(g => {
      if (!this.visible(g, record)) return;
      (g.questions || []).forEach(q => {
        if (q.type === 'note' || q.type === 'subhead') return;
        if (!this.visible(q, record)) return;
        out.push(q);
      });
    });
    return out;
  },

  /* ---------- formatting ---------- */
  fmtMoney(v, record) {
    if (v === '' || v === null || v === undefined || isNaN(v)) return '';
    const c = this.ctx(record);
    return c.currency + ' ' + Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 });
  },

  /* ---------- totals ---------- */
  matrixTotal(q, val) {
    const v = val || {};
    let sum = 0;
    const moneyCol = (q.cols || []).find(c => c.type === 'currency' || c.type === 'integer');
    if (!moneyCol) return 0;
    (q.rows || []).forEach(r => {
      const n = Number((v[r] || {})[moneyCol.id]);
      if (!isNaN(n)) sum += n;
    });
    return sum;
  },

  matrixColTotal(q, val, colId) {
    const v = val || {};
    let sum = 0;
    (q.rows || []).forEach(r => {
      const n = Number((v[r] || {})[colId]);
      if (!isNaN(n)) sum += n;
    });
    return sum;
  },

  /* ---------- validation ---------- */
  validateSection(section, record) {
    const errs = [];
    this.visibleQuestions(section, record).forEach(q => {
      const v = record.answers[q.id];
      const empty = v === undefined || v === null || v === '' ||
        (Array.isArray(v) && v.length === 0);
      if (q.required && empty) {
        errs.push({ id: q.id, msg: 'Required' });
      }
      if (q.type === 'percentgroup' && v) {
        const sum = (q.rows || []).reduce((s, r) => s + (Number(v[r]) || 0), 0);
        if (sum > 0 && Math.abs(sum - 100) > 0.5) {
          errs.push({ id: q.id, msg: `Must sum to 100% (currently ${sum}%)`, soft: true });
        }
      }
      if (q.type === 'percent' && v !== '' && v !== undefined && v !== null && v !== 'n/a') {
        const n = Number(v);
        if (!isNaN(n) && (n < 0 || n > 100)) errs.push({ id: q.id, msg: 'Must be between 0 and 100' });
      }
      if (q.min !== undefined && v !== '' && v !== undefined && Number(v) < q.min)
        errs.push({ id: q.id, msg: 'Minimum ' + q.min });
      if (q.max !== undefined && q.type !== 'multiselect' && v !== '' && v !== undefined && Number(v) > q.max)
        errs.push({ id: q.id, msg: 'Maximum ' + q.max });
      if (q.type === 'multiselect' && q.max && Array.isArray(v) && v.length > q.max)
        errs.push({ id: q.id, msg: 'Select at most ' + q.max });
    });
    return errs;
  },

  /* Soft consistency warnings shown on the review screen */
  crossChecks(record) {
    const a = record.answers, w = [];
    const num = k => { const n = Number(a[k]); return isNaN(n) ? null : n; };

    if (num('enrol_total') !== null && num('max_capacity') !== null && a.max_capacity !== '' &&
        num('enrol_total') > num('max_capacity'))
      w.push('Enrolment (' + a.enrol_total + ') exceeds stated maximum capacity (' + a.max_capacity + ').');

    if (num('avg_daily_attendance') !== null && num('enrol_total') !== null &&
        num('avg_daily_attendance') > num('enrol_total'))
      w.push('Average daily attendance exceeds total enrolment.');

    const ageSum = ['enrol_0_2', 'enrol_2_3', 'enrol_3_5', 'enrol_6p']
      .reduce((s, k) => s + (Number(a[k]) || 0), 0);
    if (ageSum > 0 && num('enrol_total') !== null && Math.abs(ageSum - num('enrol_total')) > 2)
      w.push('Age-band enrolment sums to ' + ageSum + ' but total enrolment is ' + a.enrol_total + '.');

    if (a.enrol_by_age && num('enrol_total') !== null) {
      let t = 0;
      Object.values(a.enrol_by_age).forEach(r => { t += (Number(r.boys) || 0) + (Number(r.girls) || 0); });
      if (t > 0 && Math.abs(t - num('enrol_total')) > 2)
        w.push('Enrolment table sums to ' + t + ' but total enrolment is ' + a.enrol_total + '.');
    }

    if (num('staff_total') !== null) {
      const sub = ['staff_trained_ecd', 'staff_support'].reduce((s, k) => s + (Number(a[k]) || 0), 0);
      if (sub > num('staff_total'))
        w.push('Staff sub-categories (' + sub + ') exceed total staff (' + a.staff_total + ').');
    }

    if (a.income_table && a.expense_table) {
      const inc = Object.values(a.income_table).reduce((s, r) => s + (Number(r.amount) || 0), 0);
      const exp = Object.values(a.expense_table).reduce((s, r) => s + (Number(r.amount) || 0), 0);
      const stated = num('monthly_surplus');
      if (stated !== null && inc > 0 && Math.abs((inc - exp) - stated) > Math.max(1000, inc * 0.05))
        w.push('Stated monthly surplus (' + this.fmtMoney(stated, record) + ') differs from income minus expenses (' +
               this.fmtMoney(inc - exp, record) + ').');
      if (num('repay_capacity_month') !== null && inc - exp > 0 && num('repay_capacity_month') > (inc - exp))
        w.push('Stated repayment capacity exceeds the monthly surplus.');
    }

    if (num('monthly_revenue') !== null && num('payroll_monthly') !== null &&
        num('payroll_monthly') > num('monthly_revenue'))
      w.push('Monthly payroll exceeds monthly revenue.');

    if (a.centre_type === 'Pre-primary attached to a primary school') {
      const ecd = num('monthly_revenue'), sch = num('sch_monthly_revenue');
      if (ecd !== null && sch !== null && ecd > sch)
        w.push('ECD-unit monthly revenue exceeds whole-school monthly revenue.');
      if (num('enrol_total') !== null && num('school_total_enrolment') !== null &&
          num('enrol_total') > num('school_total_enrolment'))
        w.push('ECD-unit enrolment exceeds total school enrolment.');
    }

    if (num('year_opened') !== null && num('year_opened') > new Date().getFullYear())
      w.push('Year opened is in the future.');

    return w;
  },

  /* ---------- progress ---------- */
  progress(schema, record) {
    let total = 0, done = 0, reqTotal = 0, reqDone = 0;
    this.visibleSections(schema, record).forEach(s => {
      this.visibleQuestions(s, record).forEach(q => {
        const v = record.answers[q.id];
        const filled = !(v === undefined || v === null || v === '' ||
          (Array.isArray(v) && v.length === 0) ||
          (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0));
        total++; if (filled) done++;
        if (q.required) { reqTotal++; if (filled) reqDone++; }
      });
    });
    return { total, done, reqTotal, reqDone, pct: total ? Math.round(done / total * 100) : 0 };
  }
};

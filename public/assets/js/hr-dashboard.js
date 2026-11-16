import { BANDS, fmt2 } from './model.js';
import { $, $$, api, esc, fmtDate, bandClass, toast } from './ui.js';
import { requireSession } from './hr-shell.js';

const STATUS_LABEL = { pending: 'Pending interview', interviewed: 'Interviewed', closed: 'Closed' };
const view = { q: '', band: '', status: '', sort: 'submitted_at', dir: 'desc' };
let all = [];

await requireSession();

$('[data-filter-band]').insertAdjacentHTML('beforeend', BANDS.map((b) => `<option>${b}</option>`).join(''));

try {
  ({ candidates: all } = await api('/api/candidates'));
  all.forEach((c) => { c.panel_status ||= 'pending'; });
  $('[data-export]').disabled = all.length === 0;
} catch (err) {
  toast(err.message, { error: true });
}
renderStats();
renderTable();

/* ------------------------------------------------------------ stats */

function renderStats() {
  const n = all.length;
  const avg = n ? all.reduce((s, c) => s + c.overall, 0) / n : 0;
  const pending = all.filter((c) => c.panel_status === 'pending').length;
  const weekAgo = Date.now() - 7 * 864e5;
  const thisWeek = all.filter((c) => new Date(c.submitted_at).getTime() > weekAgo).length;
  const counts = BANDS.map((b) => ({ b, k: all.filter((c) => c.overall_band === b).length }));

  $('[data-stats]').innerHTML = `
    <div class="stat"><span class="eyebrow">Submissions</span><b class="mono">${n}</b><span class="muted small">${thisWeek} in the last 7 days</span></div>
    <div class="stat"><span class="eyebrow">Average overall</span><b class="mono">${n ? fmt2(avg) : '—'}<small> / 5</small></b><span class="muted small">weighted self-rating</span></div>
    <div class="stat"><span class="eyebrow">Awaiting interview</span><b class="mono">${pending}</b><span class="muted small">panel status pending</span></div>
    <div class="stat stat-dist">
      <span class="eyebrow">Overall band mix</span>
      <div class="dist" role="img" aria-label="${counts.map((c) => `${c.b} ${c.k}`).join(', ')}">
        ${counts.map((c) => `<i class="${bandClass(c.b)}" data-flex="${c.k}" title="${c.b}: ${c.k}"></i>`).join('')}
      </div>
      <div class="dist-legend">${counts.map((c) => `<span><i class="${bandClass(c.b)}"></i>${c.b} <b class="mono">${c.k}</b></span>`).join('')}</div>
    </div>`;
  $$('.dist > i').forEach((i) => {
    i.style.flexGrow = i.dataset.flex;
    if (i.dataset.flex === '0') i.style.display = 'none';
  });
  if (!n) $('.dist').classList.add('dist-empty');
}

/* ------------------------------------------------------------ table */

function filtered() {
  const q = view.q.toLowerCase();
  return all
    .filter((c) => !view.band || c.overall_band === view.band)
    .filter((c) => !view.status || c.panel_status === view.status)
    .filter((c) => !q || [c.name, c.email, c.phone, c.candidate_code, c.role_track].some((v) => String(v || '').toLowerCase().includes(q)))
    .sort((a, b) => {
      const k = view.sort;
      let x = a[k];
      let y = b[k];
      if (k === 'submitted_at') { x = new Date(x).getTime(); y = new Date(y).getTime(); }
      if (typeof x === 'string') return view.dir === 'asc' ? x.localeCompare(y) : y.localeCompare(x);
      return view.dir === 'asc' ? x - y : y - x;
    });
}

function renderTable() {
  const rows = filtered();
  const empty = $('[data-empty]');
  $('[data-rows]').innerHTML = rows.map((c) => `
    <tr data-id="${esc(c.id)}" tabindex="0">
      <td>
        <a class="cand" href="/hr/report?id=${encodeURIComponent(c.id)}">
          <span class="cand-name">${esc(c.name)}</span>
          <span class="cand-code mono">${esc(c.candidate_code)}</span>
        </a>
      </td>
      <td class="hide-md small"><span class="d-block">${esc(c.email)}</span><span class="muted">${esc(c.phone)}</span></td>
      <td class="hide-sm small">${c.role_track ? esc(c.role_track) : '<span class="muted">—</span>'}</td>
      <td class="small nowrap">${fmtDate(c.submitted_at)}</td>
      <td class="num">
        <span class="overall mono">${fmt2(c.overall)}</span>
        <span class="bar thin"><i data-w="${(c.overall / 5) * 100}"></i></span>
      </td>
      <td><span class="chip ${bandClass(c.overall_band)}">${esc(c.overall_band)}</span></td>
      <td class="hide-sm"><span class="chip plain status-${esc(c.panel_status)}">${STATUS_LABEL[c.panel_status] || 'Pending interview'}</span></td>
    </tr>`).join('');
  $$('[data-rows] .bar > i').forEach((i) => i.style.setProperty('--w', `${i.dataset.w}%`));

  if (!all.length) {
    empty.innerHTML = `<p class="h3">No submissions yet</p><p class="muted">Share the candidate link — completed self-assessments appear here automatically.</p>`;
    empty.hidden = false;
  } else if (!rows.length) {
    empty.innerHTML = `<p class="h3">No matches</p><p class="muted">Try a different search or clear the filters.</p>`;
    empty.hidden = false;
  } else {
    empty.hidden = true;
  }

  $$('[data-sort]').forEach((b) => {
    b.classList.toggle('sorted', b.dataset.sort === view.sort);
    b.classList.toggle('desc', b.dataset.sort === view.sort && view.dir === 'desc');
    b.closest('th').setAttribute('aria-sort', b.dataset.sort === view.sort ? (view.dir === 'asc' ? 'ascending' : 'descending') : 'none');
  });
}

$('[data-rows]').addEventListener('click', (e) => {
  if (e.target.closest('a')) return;
  const tr = e.target.closest('tr[data-id]');
  if (tr) location.href = `/hr/report?id=${encodeURIComponent(tr.dataset.id)}`;
});
$('[data-rows]').addEventListener('keydown', (e) => {
  const tr = e.target.closest('tr[data-id]');
  if (tr && e.key === 'Enter') location.href = `/hr/report?id=${encodeURIComponent(tr.dataset.id)}`;
});

let t;
$('[data-search]').addEventListener('input', (e) => {
  clearTimeout(t);
  t = setTimeout(() => { view.q = e.target.value.trim(); renderTable(); }, 120);
});
$('[data-filter-band]').addEventListener('change', (e) => { view.band = e.target.value; renderTable(); });
$('[data-filter-status]').addEventListener('change', (e) => { view.status = e.target.value; renderTable(); });
$$('[data-sort]').forEach((b) => b.addEventListener('click', () => {
  const k = b.dataset.sort;
  view.dir = view.sort === k && view.dir === 'desc' ? 'asc' : view.sort === k ? 'desc' : (k === 'name' || k === 'role_track' ? 'asc' : 'desc');
  view.sort = k;
  renderTable();
}));

/* ------------------------------------------------------------ CSV export */

$('[data-export]').addEventListener('click', () => {
  const cols = [
    ['Reference', 'candidate_code'], ['Name', 'name'], ['Email', 'email'], ['Phone', 'phone'],
    ['Role / track', 'role_track'], ['Submitted', 'submitted_at'], ['Overall weighted score', 'overall'],
    ['Overall band', 'overall_band'], ['Panel status', 'panel_status'],
  ];
  const cell = (v) => {
    let s = String(v ?? '');
    if (/^[=+\-@]/.test(s)) s = `'${s}`; // neutralise spreadsheet formulas
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [cols.map((c) => c[0]).join(',')].concat(
    filtered().map((c) => cols.map(([, k]) => cell(k === 'overall' ? fmt2(c.overall) : k === 'submitted_at' ? new Date(c.submitted_at).toISOString() : c[k])).join(',')),
  );
  const blob = new Blob([`﻿${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: `gmr-candidates-${new Date().toISOString().slice(0, 10)}.csv`,
  });
  a.click();
  URL.revokeObjectURL(a.href);
});

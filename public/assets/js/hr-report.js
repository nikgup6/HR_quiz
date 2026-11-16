import { BEHAVIOURS, ITEMS, RATING_SCALE, PANEL_SCALE, INSTRUMENT, evaluate, fmt2 } from './model.js';
import { $, $$, api, esc, fmtDate, fmtDateTime, bandClass, toast } from './ui.js';
import { requireSession } from './hr-shell.js';
import { radarSvg, scoreBarsHtml, hydrateBars } from './charts.js';
import { executiveSummary } from './summary.js';

const root = $('[data-report]');
const id = new URLSearchParams(location.search).get('id');
const STATUS = [['pending', 'Pending interview'], ['interviewed', 'Interviewed'], ['closed', 'Closed']];
let candidate;
let dirty = false;

await requireSession();

if (!id) {
  showError('No candidate selected.');
} else {
  try {
    ({ candidate } = await api(`/api/candidates?id=${encodeURIComponent(id)}`));
    renderReport();
  } catch (err) {
    showError(err.status === 404 ? 'This submission no longer exists.' : err.message);
  }
}

function showError(msg) {
  root.innerHTML = `<div class="empty"><p class="h3">${esc(msg)}</p><p><a href="/hr/dashboard">← Back to candidates</a></p></div>`;
}

/* ------------------------------------------------------------ render */

function renderReport() {
  const c = candidate;
  const result = evaluate(c.ratings);
  const panel = c.panel || {};
  document.title = `${c.name} · Panel insight report`;

  root.innerHTML = `
    <a class="back no-print" href="/hr/dashboard">← All candidates</a>

    <header class="report-head">
      <div>
        <p class="eyebrow">${esc(INSTRUMENT.reportTitle)}</p>
        <h1 class="h1">${esc(c.name)}</h1>
        <dl class="meta">
          <div><dt>Reference</dt><dd class="mono">${esc(c.candidate_code)}</dd></div>
          <div><dt>Role / track</dt><dd>${c.role_track ? esc(c.role_track) : '—'}</dd></div>
          <div><dt>Assessment date</dt><dd>${fmtDate(c.submitted_at)}</dd></div>
          <div><dt>Email</dt><dd><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></dd></div>
          <div><dt>Phone</dt><dd><a href="tel:${esc(c.phone.replace(/[^\d+]/g, ''))}">${esc(c.phone)}</a></dd></div>
        </dl>
      </div>
      <div class="report-actions no-print">
        <button class="btn btn-ghost btn-sm" type="button" data-print>Export PDF</button>
        <button class="btn btn-danger btn-sm" type="button" data-delete>Delete</button>
      </div>
    </header>

    <nav class="subnav no-print" aria-label="Report sections">
      <a href="#overview">Overview</a>
      <a href="#summary">Executive summary</a>
      <a href="#profile">Score profile</a>
      <a href="#interpretation">Panel interpretation</a>
      <a href="#panel">Interview &amp; panel review</a>
      <a href="#responses">Candidate responses</a>
    </nav>

    <section id="overview" class="overview">
      <div class="card ov-score">
        <p class="eyebrow">Overall weighted score</p>
        <div class="big">${fmt2(result.overall)}<small> / 5</small></div>
        <div class="ov-score-foot">
          <span class="chip ${bandClass(result.overallBand)}">${esc(result.overallBand)}</span>
          <span class="muted small">Completion <b class="mono">${esc(result.completion)}</b></span>
        </div>
        <div class="band-scale" aria-hidden="true">${bandScale(result.overall)}</div>
      </div>
      <div class="card ov-insight">
        <p class="eyebrow">Strongest self-rated behaviour</p>
        <p class="insight">${esc(result.strongestText)}</p>
        <hr class="rule">
        <p class="eyebrow">Priority interview hypothesis</p>
        <p class="insight accent">${esc(result.priorityText)}</p>
      </div>
      <p class="usenote small muted">${esc(INSTRUMENT.useNote)}</p>
    </section>

    <section id="summary" class="block">
      <div class="block-head"><h2 class="h2">Consolidated executive summary</h2><p class="muted">Auto-generated overview of the candidate's behavioural profile across all five constructs.</p></div>
      <div class="card card-pad exec-summary">
        <p>${executiveSummary(c.ratings, result, c.name).map(esc).join(' ')}</p>
      </div>
    </section>

    <section id="profile" class="block">
      <div class="block-head"><h2 class="h2">Score profile</h2><p class="muted">Self-assessment scores by behaviour, averaged across each behaviour's five statements.</p></div>
      <div class="profile-grid">
        <div class="card card-pad radar-card">
          <p class="eyebrow">Five-construct radar chart</p>
          ${radarSvg(result.rows)}
        </div>
        <div class="card card-pad">
          <p class="eyebrow">Construct scores</p>
          <div class="sbars">${scoreBarsHtml(result.rows)}</div>
        </div>
      </div>
    </section>

    <section id="interpretation" class="block">
      <div class="block-head"><h2 class="h2">Panel interpretation</h2><p class="muted">Generated from the candidate's ratings to focus the structured interview.</p></div>
      <div class="card interp-table" role="table" aria-label="Behaviour interpretation">
        <div class="it-row it-head" role="row">
          <span role="columnheader">Behaviour</span><span role="columnheader" class="num">Score / 5</span><span role="columnheader" class="num">Weight</span>
          <span role="columnheader">Band</span><span role="columnheader">Panel interpretation</span><span role="columnheader">Panel recommendation</span>
        </div>
        ${result.rows.map((r) => `
          <div class="it-row" role="row">
            <span role="cell" class="it-name">${esc(r.name)}</span>
            <span role="cell" class="num mono it-score">${fmt2(r.score)}</span>
            <span role="cell" class="num mono muted it-weight">${Math.round(r.weight * 100)}%</span>
            <span role="cell"><span class="chip ${bandClass(r.band)}">${esc(r.band)}</span></span>
            <span role="cell" class="it-text">${esc(r.interpretation)}</span>
            <span role="cell" class="it-text">${esc(r.recommendation)}</span>
          </div>`).join('')}
      </div>
    </section>

    <section id="panel" class="block">
      <div class="block-head">
        <h2 class="h2">Interview &amp; panel review</h2>
        <p class="muted">${esc(INSTRUMENT.panelRatingGuidance)}</p>
      </div>
      <div class="scale-strip">${PANEL_SCALE.map((p) => `<span><b class="mono">${p.value}</b>${esc(p.label)}</span>`).join('')}</div>

      <form data-panel-form>
        <div class="panel-list">
          ${result.rows.map((r) => panelRow(r, panel)).join('')}
        </div>

        <div class="card card-pad synthesis">
          <p class="eyebrow">Panel synthesis</p>
          <dl class="syn-auto">
            <div><dt>Strongest self-rated behaviour</dt><dd>${esc(result.strongestText)}</dd></div>
            <div><dt>Priority interview hypothesis</dt><dd>${esc(result.priorityText)}</dd></div>
          </dl>
          <div class="field">
            <label for="p-status">Panel status</label>
            <select class="select" id="p-status" name="status">
              ${STATUS.map(([v, l]) => `<option value="${v}"${(panel.status || 'pending') === v ? ' selected' : ''}>${l}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label for="p-rec">Panel recommendation</label>
            <textarea class="textarea" id="p-rec" name="recommendation" rows="3">${esc(panel.recommendation ?? INSTRUMENT.panelRecommendationDefault)}</textarea>
            <div class="print-only print-text" data-mirror="p-rec"></div>
          </div>
          <div class="field">
            <label for="p-rat">Decision rationale</label>
            <textarea class="textarea" id="p-rat" name="rationale" rows="5" placeholder="${esc(INSTRUMENT.decisionRationaleGuide)}">${esc(panel.rationale || '')}</textarea>
            <div class="print-only print-text" data-mirror="p-rat"></div>
          </div>
        </div>

        <div class="savebar no-print" data-savebar>
          <span class="small muted" data-save-meta>${c.panel_updated_at ? `Last saved ${fmtDateTime(c.panel_updated_at)}${c.panel_updated_by ? ` by ${esc(c.panel_updated_by)}` : ''}` : 'Panel review not yet saved'}</span>
          <button class="btn btn-accent btn-sm" type="submit" data-save>Save panel review</button>
        </div>
      </form>
    </section>

    <section id="responses" class="block">
      <div class="block-head"><h2 class="h2">Candidate responses</h2><p class="muted">All 25 statements with the candidate's rating and any evidence they added.</p></div>
      ${BEHAVIOURS.map((b) => responsesBlock(b, c, result)).join('')}
    </section>

    <section class="guardrails">
      <p>${esc(INSTRUMENT.guardrails)}</p>
      <p>${esc(INSTRUMENT.workflow)}</p>
      <p>${esc(INSTRUMENT.governanceNote)}</p>
    </section>`;

  hydrateBars(root);
  syncMirrors();
  bindReport();
}

function bandScale(score) {
  const marks = [['Emerging', 1, 1.8], ['Developing', 1.8, 2.6], ['Consistent', 2.6, 3.4], ['Strong', 3.4, 4.2], ['Exemplary', 4.2, 5]];
  const pos = Math.max(0, Math.min(100, ((score - 1) / 4) * 100));
  return `<div class="bs-track">${marks.map(([b]) => `<i class="${bandClass(b)}" title="${b}"></i>`).join('')}<b class="bs-pin" data-left="${pos.toFixed(2)}"></b></div>
    <div class="bs-labels mono"><span>1.0</span><span>1.8</span><span>2.6</span><span>3.4</span><span>4.2</span><span>5.0</span></div>`;
}

function panelRow(r, panel) {
  const note = panel.notes?.[r.key] ?? INSTRUMENT.panelNotesTemplate;
  const rating = panel.ratings?.[r.key];
  return `
    <article class="card panel-row">
      <header class="pr-head">
        <div>
          <h3 class="h3">${esc(r.name)}</h3>
          <p class="pr-self small muted">Self-rating <b class="mono">${fmt2(r.score)}</b> · <span class="chip ${bandClass(r.band)}">${esc(r.band)}</span></p>
        </div>
        <fieldset class="pr-rating">
          <legend class="small">Panel rating (1–5)</legend>
          <div class="seg">
            ${PANEL_SCALE.map((p) => `
              <input type="radio" id="pr-${r.key}-${p.value}" name="rating-${r.key}" value="${p.value}"${rating === p.value ? ' checked' : ''}>
              <label for="pr-${r.key}-${p.value}" title="${esc(p.label)}">${p.value}</label>`).join('')}
            <button type="button" class="seg-clear" data-clear="${r.key}" aria-label="Clear panel rating for ${esc(r.name)}">Clear</button>
          </div>
          <span class="pr-rating-label small muted" data-rating-label="${r.key}">${rating ? esc(PANEL_SCALE[rating - 1].label) : 'Not yet rated'}</span>
        </fieldset>
      </header>
      <div class="pr-body">
        <div class="pr-probe">
          <p class="eyebrow">Recommended probe</p>
          <p class="probe-q">${esc(r.panelQuestion)}</p>
          <ul class="probe-tags">${r.panelProbe.replace(/\.$/, '').split(' • ').map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          <p class="small muted pr-focus"><b>Focus:</b> ${esc(r.recommendation)}</p>
        </div>
        <div class="field pr-notes">
          <label for="notes-${r.key}">Panel evidence / notes</label>
          <textarea class="textarea" id="notes-${r.key}" name="notes-${r.key}" rows="7">${esc(note)}</textarea>
          <div class="print-only print-text" data-mirror="notes-${r.key}"></div>
        </div>
      </div>
    </article>`;
}

function responsesBlock(b, c, result) {
  const row = result.rows.find((r) => r.key === b.key);
  return `
    <div class="resp-block">
      <h3 class="resp-head"><span>${esc(b.name)}</span><span class="mono">${fmt2(row.score)} <small class="muted">avg</small></span></h3>
      <ol class="resp-list">
        ${ITEMS.filter((it) => it.behaviour === b.key).map((it) => {
          const v = c.ratings[it.n - 1];
          const label = RATING_SCALE.find((r) => r.value === v)?.label || '—';
          const reflection = c.reflections?.[it.n];
          return `
            <li class="resp">
              <span class="resp-no mono">${String(it.n).padStart(2, '0')}</span>
              <div class="resp-main">
                <p class="resp-text">${esc(it.text)}</p>
                ${reflection ? `<blockquote class="resp-reflect">${esc(reflection)}</blockquote>` : ''}
              </div>
              <div class="resp-val">
                <span class="pips" aria-hidden="true">${[1, 2, 3, 4, 5].map((n) => `<i class="${n <= v ? 'on' : ''}"></i>`).join('')}</span>
                <span class="small"><b class="mono">${v}</b> ${esc(label)}</span>
              </div>
            </li>`;
        }).join('')}
      </ol>
    </div>`;
}

/* ------------------------------------------------------------ behaviour */

function syncMirrors() {
  $$('[data-mirror]').forEach((m) => { m.textContent = $(`#${m.dataset.mirror}`).value; });
  $$('.bs-pin').forEach((p) => p.style.setProperty('--left', `${p.dataset.left}%`));
}

function collectPanel() {
  const f = $('[data-panel-form]');
  const panel = { notes: {}, ratings: {}, status: f.elements.status.value, recommendation: f.elements.recommendation.value, rationale: f.elements.rationale.value };
  for (const b of BEHAVIOURS) {
    panel.notes[b.key] = f.elements[`notes-${b.key}`].value;
    const r = f.querySelector(`input[name="rating-${b.key}"]:checked`);
    if (r) panel.ratings[b.key] = Number(r.value);
  }
  return panel;
}

function setDirty(v) {
  dirty = v;
  $('[data-savebar]').classList.toggle('dirty', v);
  if (v) $('[data-save-meta]').textContent = 'Unsaved changes';
}

function bindReport() {
  const form = $('[data-panel-form]');

  form.addEventListener('input', (e) => {
    setDirty(true);
    const m = $(`[data-mirror="${e.target.id}"]`);
    if (m) m.textContent = e.target.value;
  });
  form.addEventListener('change', (e) => {
    if (e.target.type === 'radio') {
      const key = e.target.name.replace('rating-', '');
      $(`[data-rating-label="${key}"]`).textContent = PANEL_SCALE[Number(e.target.value) - 1].label;
    }
    setDirty(true);
  });
  form.addEventListener('click', (e) => {
    const key = e.target.dataset.clear;
    if (!key) return;
    $$(`input[name="rating-${key}"]`, form).forEach((i) => { i.checked = false; });
    $(`[data-rating-label="${key}"]`).textContent = 'Not yet rated';
    setDirty(true);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('[data-save]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Saving';
    try {
      const res = await api(`/api/candidates?id=${encodeURIComponent(id)}`, { method: 'PATCH', body: { panel: collectPanel() } });
      candidate.panel = res.panel;
      setDirty(false);
      $('[data-save-meta]').textContent = `Last saved ${fmtDateTime(res.panel_updated_at)} by ${res.panel_updated_by}`;
      toast('Panel review saved');
    } catch (err) {
      toast(err.status === 401 ? 'Your session expired — sign in again in a new tab, then save.' : err.message, { error: true });
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save panel review';
    }
  });

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); form.requestSubmit(); }
  });
  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  $('[data-print]').addEventListener('click', () => window.print());

  const dlg = $('[data-delete-dialog]');
  $('[data-delete]').addEventListener('click', () => dlg.showModal());
  $('[data-cancel-delete]').addEventListener('click', () => dlg.close());
  $('[data-confirm-delete]').addEventListener('click', async () => {
    try {
      await api(`/api/candidates?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      dirty = false;
      location.replace('/hr/dashboard');
    } catch (err) {
      dlg.close();
      toast(err.message, { error: true });
    }
  });

  // highlight current section in the sub-nav
  const links = $$('.subnav a');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${en.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['overview', 'summary', 'profile', 'interpretation', 'panel', 'responses'].forEach((s) => io.observe($(`#${s}`)));
}


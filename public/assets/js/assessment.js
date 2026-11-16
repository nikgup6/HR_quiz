import { BEHAVIOURS, ITEMS, ITEM_COUNT, RATING_SCALE } from './model.js';
import { $, $$, html, render, api, store, toast } from './ui.js';

const DRAFT_KEY = 'gmr-draft-v1';
const SECTIONS = BEHAVIOURS.map((b) => ({ ...b, items: ITEMS.filter((it) => it.behaviour === b.key) }));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const state = {
  step: 'intro', // 'intro' | 0..4 | 'review' | 'done'
  details: { name: '', email: '', phone: '', roleTrack: '' },
  ratings: Array(ITEM_COUNT).fill(null),
  reflections: {},
};

/* ------------------------------------------------------------ persistence */

function saveDraft() {
  if (state.step === 'done') return;
  store.set(DRAFT_KEY, { details: state.details, ratings: state.ratings, reflections: state.reflections, savedAt: Date.now() });
}

function loadDraft() {
  const d = store.get(DRAFT_KEY);
  if (!d || !Array.isArray(d.ratings) || d.ratings.length !== ITEM_COUNT) return false;
  // Drafts older than 14 days are discarded.
  if (Date.now() - (d.savedAt || 0) > 14 * 864e5) { store.remove(DRAFT_KEY); return false; }
  Object.assign(state.details, d.details || {});
  state.ratings = d.ratings.map((v) => (Number.isInteger(v) && v >= 1 && v <= 5 ? v : null));
  state.reflections = d.reflections && typeof d.reflections === 'object' ? d.reflections : {};
  return state.ratings.some((v) => v !== null) || Object.values(state.details).some(Boolean);
}

/* ------------------------------------------------------------ static content */

function renderStatic() {
  render($('[data-behaviour-list]'), html`${SECTIONS.map((s) => html`
    <li><strong>${s.name}</strong><span>${s.definition.split(';')[0]}.</span></li>`)}`);

  const scale = html`${RATING_SCALE.map((r) => html`
    <li><b>${r.value}</b><span><em>${r.label}</em> — ${r.meaning}</span></li>`)}`;
  $$('[data-scale-list]').forEach((el) => render(el, scale));

  render($('[data-dots]'), html`${SECTIONS.map(() => html`<li><i></i></li>`)}`);
}

/* ------------------------------------------------------------ details form */

function fillDetailsForm() {
  const f = $('[data-details-form]');
  for (const k of ['name', 'email', 'phone', 'roleTrack']) f.elements[k].value = state.details[k] || '';
}

function validateDetails(f) {
  const v = {
    name: f.elements.name.value.trim(),
    email: f.elements.email.value.trim(),
    phone: f.elements.phone.value.trim(),
    roleTrack: f.elements.roleTrack.value.trim(),
  };
  const errors = {};
  if (v.name.length < 2) errors.name = 'Please enter your full name.';
  if (!EMAIL_RE.test(v.email)) errors.email = 'Please enter a valid email address.';
  const digits = v.phone.replace(/\D/g, '');
  if (!/^\+?[\d\s()-]+$/.test(v.phone) || digits.length < 7 || digits.length > 15) {
    errors.phone = 'Please enter a valid phone number.';
  }
  for (const k of ['name', 'email', 'phone']) {
    const field = f.elements[k].closest('.field');
    field.classList.toggle('invalid', Boolean(errors[k]));
    $(`[data-err="${k}"]`, f).textContent = errors[k] || '';
    f.elements[k].setAttribute('aria-invalid', errors[k] ? 'true' : 'false');
  }
  return { values: v, errors };
}

function bindDetailsForm() {
  const f = $('[data-details-form]');
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const { values, errors } = validateDetails(f);
    const firstBad = ['name', 'email', 'phone'].find((k) => errors[k]);
    if (firstBad) { f.elements[firstBad].focus(); return; }
    state.details = values;
    saveDraft();
    const firstOpen = SECTIONS.findIndex((s) => s.items.some((it) => state.ratings[it.n - 1] === null));
    go(firstOpen === -1 ? 'review' : firstOpen);
  });
  f.addEventListener('input', (e) => {
    const field = e.target.closest('.field.invalid');
    if (field) { field.classList.remove('invalid'); $('.err', field).textContent = ''; }
  });
}

/* ------------------------------------------------------------ section step */

function itemTemplate(it) {
  const value = state.ratings[it.n - 1];
  const reflection = state.reflections[it.n] || '';
  const name = `q${it.n}`;
  return html`
    <li class="item ${value ? 'answered' : ''}" id="item-${it.n}" data-item="${it.n}">
      <fieldset class="item-fieldset" aria-describedby="meaning-${it.n}">
        <legend class="item-head">
          <span class="item-no">${String(it.n).padStart(2, '0')}</span>
          <span class="item-text">${it.text}</span>
        </legend>
        <div class="scale">
          ${RATING_SCALE.map((r) => html`
            <input type="radio" id="${name}-${r.value}" name="${name}" value="${r.value}" ${value === r.value ? html`checked` : ''}>
            <label for="${name}-${r.value}" title="${r.meaning}">
              <span class="n">${r.value}</span><span class="l">${r.label}</span>
            </label>`)}
        </div>
      </fieldset>
      <p class="meaning" id="meaning-${it.n}" aria-live="polite">${meaningText(value)}</p>
      <details class="reflect" ${reflection ? html`open` : ''}>
        <summary>Evidence / reflection (optional)</summary>
        <textarea class="textarea" maxlength="2000" data-reflect="${it.n}"
          aria-label="Evidence or reflection for statement ${it.n}"
          placeholder="A brief example that shows this in practice.">${reflection}</textarea>
        <div class="count"><span data-count="${it.n}">${reflection.length}</span> / 2000</div>
      </details>
    </li>`;
}

function meaningText(value) {
  const r = RATING_SCALE.find((x) => x.value === value);
  return r ? html`<b>${r.label}.</b> ${r.meaning}.` : html`<span>Select the option that fits best.</span>`;
}

function renderSection(i) {
  const s = SECTIONS[i];
  $('[data-section-count]').textContent = `Section ${i + 1} of ${SECTIONS.length}`;
  $('[data-section-title]').textContent = s.name;
  render($('[data-items]'), html`${s.items.map(itemTemplate)}`);
}

function bindItems() {
  const list = $('[data-items]');

  list.addEventListener('change', (e) => {
    if (e.target.type !== 'radio') return;
    const n = Number(e.target.name.slice(1));
    setRating(n, Number(e.target.value));
  });

  list.addEventListener('input', (e) => {
    const n = e.target.dataset.reflect;
    if (!n) return;
    const text = e.target.value;
    if (text.trim()) state.reflections[n] = text; else delete state.reflections[n];
    $(`[data-count="${n}"]`).textContent = text.length;
    saveDraft();
  });

  // Number keys 1–5 rate the statement that currently has focus.
  list.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return;
    const v = Number(e.key);
    if (!(v >= 1 && v <= 5)) return;
    const item = e.target.closest('[data-item]');
    if (!item) return;
    e.preventDefault();
    const n = Number(item.dataset.item);
    const input = $(`#q${n}-${v}`);
    input.checked = true;
    setRating(n, v);
    const next = item.nextElementSibling;
    if (next) {
      const target = $('input:checked', next) || $('input[type=radio]', next);
      target.focus({ preventScroll: true });
      next.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}

function setRating(n, v) {
  state.ratings[n - 1] = v;
  const item = $(`[data-item="${n}"]`);
  if (item) {
    item.classList.add('answered');
    item.classList.remove('missing');
    render($(`#meaning-${n}`), meaningText(v));
  }
  saveDraft();
  updateProgress();
}

/* ------------------------------------------------------------ review step */

function renderReview() {
  const d = state.details;
  render($('[data-review-who]'), html`${d.name}<small>${d.email} · ${d.phone}${d.roleTrack ? ` · ${d.roleTrack}` : ''}</small>`);
  render($('[data-review-list]'), html`${SECTIONS.map((s, si) => {
    const answered = s.items.filter((it) => state.ratings[it.n - 1] !== null).length;
    return html`
      <section class="review-block">
        <h2><span>${s.name}</span><span class="mono muted">${answered}/5</span></h2>
        ${s.items.map((it) => {
          const v = state.ratings[it.n - 1];
          const label = RATING_SCALE.find((r) => r.value === v)?.label || 'Not answered';
          return html`
            <button type="button" class="review-row" data-jump="${si}" data-n="${it.n}">
              <span class="no">${String(it.n).padStart(2, '0')}</span>
              <span class="txt">${it.text}</span>
              <span class="val ${v ? '' : 'empty'}"><span>${label}</span><b>${v ?? '–'}</b></span>
            </button>`;
        })}
      </section>`;
  })}`);
  updateSubmitState();
}

function updateSubmitState() {
  const complete = state.ratings.every((v) => v !== null);
  $('[data-submit]').disabled = !complete || !$('[data-confirm]').checked;
}

function bindReview() {
  $('[data-review-list]').addEventListener('click', (e) => {
    const row = e.target.closest('[data-jump]');
    if (!row) return;
    go(Number(row.dataset.jump), { focusItem: Number(row.dataset.n) });
  });
  $('[data-confirm]').addEventListener('change', updateSubmitState);
  $('[data-edit-details]').addEventListener('click', () => go('intro'));
  $('[data-submit]').addEventListener('click', submit);
}

async function submit() {
  const btn = $('[data-submit]');
  const errBox = $('[data-submit-error]');
  errBox.hidden = true;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Submitting…';
  try {
    const reflections = {};
    for (const [n, t] of Object.entries(state.reflections)) if (t.trim()) reflections[n] = t.trim();
    const { candidateCode } = await api('/api/submit', {
      method: 'POST',
      body: { ...state.details, website: $('#f-website').value, ratings: state.ratings, reflections },
    });
    store.remove(DRAFT_KEY);
    $('[data-done-name]').textContent = state.details.name.split(' ')[0];
    $('[data-done-code]').textContent = candidateCode;
    go('done');
  } catch (err) {
    errBox.textContent = err.status ? err.message : 'We could not reach the server. Check your connection and try again — your answers are saved on this device.';
    errBox.hidden = false;
    btn.textContent = 'Submit responses';
    updateSubmitState();
  }
}

/* ------------------------------------------------------------ navigation */

function go(step, { focusItem } = {}) {
  state.step = step;
  const kind = typeof step === 'number' ? 'items' : step;
  $$('[data-step]').forEach((el) => { el.hidden = el.dataset.step !== kind; });
  $('[data-stepbar]').hidden = kind !== 'items';
  $('[data-open-scale]').hidden = kind !== 'items';

  if (kind === 'intro') fillDetailsForm();
  if (kind === 'items') renderSection(step);
  if (kind === 'review') renderReview();

  updateProgress();
  history.replaceState(null, '', kind === 'items' ? `#section-${step + 1}` : kind === 'intro' ? location.pathname : `#${kind}`);

  if (focusItem) {
    const el = $(`#item-${focusItem}`);
    el.scrollIntoView({ block: 'center' });
    ($('input:checked', el) || $('input', el)).focus({ preventScroll: true });
  } else {
    window.scrollTo({ top: 0 });
    $('#app').focus({ preventScroll: true });
  }
}

function sectionComplete(i) {
  return SECTIONS[i].items.every((it) => state.ratings[it.n - 1] !== null);
}

function bindStepbar() {
  $('[data-back]').addEventListener('click', () => go(state.step === 0 ? 'intro' : state.step - 1));
  $('[data-next]').addEventListener('click', () => {
    const i = state.step;
    if (!sectionComplete(i)) {
      const missing = SECTIONS[i].items.filter((it) => state.ratings[it.n - 1] === null);
      missing.forEach((it) => $(`#item-${it.n}`).classList.add('missing'));
      const first = $(`#item-${missing[0].n}`);
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      $('input', first).focus({ preventScroll: true });
      toast(`${missing.length} statement${missing.length > 1 ? 's' : ''} still need${missing.length > 1 ? '' : 's'} a rating.`);
      return;
    }
    go(i === SECTIONS.length - 1 ? 'review' : i + 1);
  });
}

function updateProgress() {
  const answered = state.ratings.filter((v) => v !== null).length;
  $('.progress-rail > i').style.setProperty('--p', `${state.step === 'done' ? 100 : (answered / ITEM_COUNT) * 100}%`);
  $('[data-answered]').textContent = `${answered} of ${ITEM_COUNT} answered`;
  $$('[data-dots] li').forEach((li, i) => {
    const done = SECTIONS[i].items.filter((it) => state.ratings[it.n - 1] !== null).length;
    li.firstElementChild.style.setProperty('--w', `${(done / 5) * 100}%`);
    li.classList.toggle('current', state.step === i);
  });
  if (typeof state.step === 'number') {
    const last = state.step === SECTIONS.length - 1;
    $('[data-next]').innerHTML = `${last ? 'Review answers' : 'Continue'} <span class="arrow" aria-hidden="true">→</span>`;
  }
}

/* ------------------------------------------------------------ scale dialog */

function bindScaleDialog() {
  const dlg = $('[data-scale-dialog]');
  $('[data-open-scale]').addEventListener('click', () => dlg.showModal());
  $('[data-close-scale]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
}

/* ------------------------------------------------------------ boot */

renderStatic();
bindDetailsForm();
bindItems();
bindReview();
bindStepbar();
bindScaleDialog();
if (loadDraft()) $('[data-resume-note]').hidden = false;
go('intro');

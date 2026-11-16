import { BEHAVIOURS, INSTRUMENT, RATING_SCALE } from './model.js';
import { $, esc } from './ui.js';
import { requireSession } from './hr-shell.js';

await requireSession();

const total = BEHAVIOURS.reduce((s, b) => s + b.weight, 0);

$('[data-framework]').innerHTML = `
  <div class="page-head">
    <div>
      <p class="eyebrow">Reference</p>
      <h1 class="h1">Five observable GCC behaviours</h1>
      <p class="muted fw-sub">Reference, weighting and panel guidance.</p>
    </div>
    <div class="weight-total"><span class="eyebrow">Total weight</span><b class="mono">${Math.round(total * 100)}%</b></div>
  </div>

  <nav class="fw-toc">${BEHAVIOURS.map((b, i) => `<a href="#${b.key}"><span class="mono">0${i + 1}</span>${esc(b.name)}</a>`).join('')}</nav>

  ${BEHAVIOURS.map((b, i) => `
    <article class="card fw" id="${b.key}">
      <header class="fw-head">
        <span class="fw-no mono">0${i + 1}</span>
        <div>
          <h2 class="h2">${esc(b.name)}</h2>
          <p class="fw-def">${esc(b.definition)}</p>
        </div>
        <span class="chip plain fw-weight mono">Weight ${Math.round(b.weight * 100)}%</span>
      </header>
      <div class="fw-grid">
        <section>
          <p class="eyebrow">How this shows up in a GCC</p>
          <ul class="fw-list">${b.showsUp.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
        </section>
        <section>
          <p class="eyebrow">Panel probes</p>
          <ol class="fw-probes">${b.probes.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
        </section>
        <section>
          <p class="eyebrow">GCC example</p>
          <p class="fw-example">${esc(b.example)}</p>
        </section>
        <section>
          <p class="eyebrow">Construct boundary</p>
          <p class="fw-core"><b>Core:</b> ${esc(b.boundaryCore)}</p>
          <p class="fw-not"><b>Not:</b> ${esc(b.boundaryNot)}</p>
        </section>
      </div>
    </article>`).join('')}

  <section class="card card-pad fw-scale">
    <p class="eyebrow">Candidate rating scale</p>
    <ul>${RATING_SCALE.map((r) => `<li><b class="mono">${r.value}</b><span><strong>${esc(r.label)}</strong> — ${esc(r.meaning)}</span></li>`).join('')}</ul>
    <p class="eyebrow fw-bands-title">Score bands</p>
    <div class="fw-bands">
      <span class="chip band-Emerging">Emerging &lt; 1.8</span>
      <span class="chip band-Developing">Developing 1.8 – &lt; 2.6</span>
      <span class="chip band-Consistent">Consistent 2.6 – &lt; 3.4</span>
      <span class="chip band-Strong">Strong 3.4 – &lt; 4.2</span>
      <span class="chip band-Exemplary">Exemplary ≥ 4.2</span>
    </div>
    <p class="small muted">${esc(INSTRUMENT.useNote)}</p>
  </section>

  <section class="guardrails"><p>${esc(INSTRUMENT.governanceNote)}</p></section>`;

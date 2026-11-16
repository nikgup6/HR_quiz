// Hand-built SVG charts for the panel report (no chart library needed).
import { esc, bandClass } from './ui.js';
import { fmt2 } from './model.js';

const NS = 'http://www.w3.org/2000/svg';

/**
 * Five-construct radar chart, scale 0–5.
 * @param {{name:string, score:number}[]} rows
 */
export function radarSvg(rows, { size = 400 } = {}) {
  const pad = 110;
  const W = size + pad * 2;
  const H = size + 70;
  const cx = W / 2;
  const cy = H / 2 + 8;
  const R = size / 2 - 20;
  const n = rows.length;
  const angle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i, v) => [cx + Math.cos(angle(i)) * R * (v / 5), cy + Math.sin(angle(i)) * R * (v / 5)];
  const poly = (v) => rows.map((_, i) => pt(i, v).map((x) => x.toFixed(1)).join(',')).join(' ');

  let s = `<svg xmlns="${NS}" viewBox="0 0 ${W} ${H}" class="radar" role="img" aria-label="Radar chart of self-assessment scores by behaviour">`;
  for (let l = 1; l <= 5; l++) {
    s += `<polygon points="${poly(l)}" class="radar-ring${l === 5 ? ' outer' : ''}"/>`;
  }
  rows.forEach((_, i) => {
    const [x, y] = pt(i, 5);
    s += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="radar-spoke"/>`;
  });
  // ring scale labels on the first spoke
  for (let l = 1; l <= 5; l++) {
    const [x, y] = pt(0, l);
    s += `<text x="${x + 6}" y="${y + 4}" class="radar-tick">${l}</text>`;
  }
  const shape = rows.map((r, i) => pt(i, r.score).map((x) => x.toFixed(1)).join(',')).join(' ');
  s += `<polygon points="${shape}" class="radar-shape"/>`;
  rows.forEach((r, i) => {
    const [x, y] = pt(i, r.score);
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" class="radar-dot"><title>${esc(r.name)}: ${fmt2(r.score)} / 5</title></circle>`;
  });
  rows.forEach((r, i) => {
    const a = angle(i);
    const [x, y] = [cx + Math.cos(a) * (R + 26), cy + Math.sin(a) * (R + 26)];
    const cos = Math.cos(a);
    const anchor = Math.abs(cos) < 0.2 ? 'middle' : cos > 0 ? 'start' : 'end';
    const dy = Math.sin(a) > 0.5 ? 16 : Math.sin(a) < -0.5 ? -24 : 0;
    s += `<text x="${x.toFixed(1)}" y="${(y + dy).toFixed(1)}" text-anchor="${anchor}" class="radar-label">${esc(r.name)}</text>`;
    s += `<text x="${x.toFixed(1)}" y="${(y + dy + 20).toFixed(1)}" text-anchor="${anchor}" class="radar-value">${fmt2(r.score)}</text>`;
  });
  return `${s}</svg>`;
}

/** Horizontal construct score bars, as in the reference design. */
export function scoreBarsHtml(rows) {
  return rows.map((r) => `
    <div class="sbar">
      <div class="sbar-head">
        <span class="sbar-name">${esc(r.name)}</span>
        <span class="sbar-score mono">${fmt2(r.score)}<small> / 5</small></span>
      </div>
      <div class="bar"><i data-w="${((r.score / 5) * 100).toFixed(2)}"></i></div>
      <div class="sbar-foot"><span class="chip ${bandClass(r.band)}">${esc(r.band)}</span><span class="muted small mono">weight ${Math.round(r.weight * 100)}%</span></div>
    </div>`).join('');
}

// Bars are drawn with a CSS variable so they animate and stay CSP-safe.
export function hydrateBars(root) {
  requestAnimationFrame(() => {
    root.querySelectorAll('.bar > i[data-w]').forEach((i) => i.style.setProperty('--w', `${i.dataset.w}%`));
  });
}

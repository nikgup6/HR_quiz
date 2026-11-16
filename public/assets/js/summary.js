// Consolidated executive summary for the panel insight report.
// Builds a short (3–5 sentence), rule-based narrative from the candidate's 25 ratings
// and the construct scores produced by evaluate() in model.js.

import { ITEMS, RATING_SCALE, fmt2 } from './model.js';

// Short behavioural-indicator phrases for each of the 25 statements (item 1..25).
const INDICATORS = [
  're-prioritising when plans change',
  'diagnosing setbacks and restoring progress',
  'balancing urgency with quality under pressure',
  'applying lessons from setbacks to future plans',
  'flagging setbacks early',
  'deliberately learning unfamiliar domains',
  'seeking specific, challenging feedback',
  'identifying and closing capability gaps',
  'testing new approaches',
  "sharing expertise and building others' capability",
  'starting work before every dependency is clear',
  'making assumptions and risks visible',
  'separating reversible from high-stakes decisions',
  'using small pilots to reduce uncertainty',
  'setting owners and checkpoints under uncertainty',
  'owning gaps outside their formal scope',
  'acting without waiting for detailed instruction',
  'escalating risks with a recommendation',
  'closing loops and confirming outcomes',
  'keeping momentum within controls',
  'questioning outdated practices',
  'understanding why a control exists',
  'building evidence-based alternatives',
  'piloting improvements before wider adoption',
  'revising views on new evidence',
];

// What the panel should explore when a construct is a development area.
const EXPLORE = {
  agility: 'a real setback and how they recovered',
  growth: 'feedback that changed how they work',
  ambiguity: 'how they separate facts from assumptions under uncertainty',
  action: 'unprompted ownership and follow-through to closure',
  statusquo: 'evidence-led challenge that respects existing controls',
};

const STRONG = 3.4; // lower bound of the "Strong" band

const label = (v) => RATING_SCALE.find((r) => r.value === v)?.label || '';
const q = (s) => `“${s}”`;

function list(parts) {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

const scoreTag = (r) => `${r.name} (${fmt2(r.score)})`;
const cite = (items) => list(items.map((i) => q(INDICATORS[i.n - 1])));

// Pick up to `n` items across the given constructs, taking turns between
// constructs so the evidence is not drawn from a single area.
function pickItems(rows, ratings, n, highest) {
  const pools = rows.map((r) =>
    ITEMS.filter((it) => it.behaviour === r.key)
      .map((it) => ({ n: it.n, v: ratings[it.n - 1] }))
      .sort((a, b) => (highest ? b.v - a.v : a.v - b.v) || a.n - b.n));
  const out = [];
  for (let i = 0; out.length < n && pools.some((p) => p[i]); i++) {
    for (const p of pools) if (p[i] && out.length < n) out.push(p[i]);
  }
  return out;
}

/**
 * @param {(number|null)[]} ratings  index 0 = item 1
 * @param {object} result            output of evaluate(ratings)
 * @param {string} name              candidate name
 * @returns {string[]} sentences
 */
export function executiveSummary(ratings, result, name) {
  if (!result.complete) {
    return ['The executive summary will be generated once all 25 statements have been rated.'];
  }

  const first = (name || 'The candidate').trim().split(/\s+/)[0];
  const rows = result.rows;
  const sorted = [...rows].sort((a, b) => b.score - a.score);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];
  const s = [];

  // 1 — overall profile
  s.push(`${first}'s overall self-assessed profile is ${result.overallBand} (${fmt2(result.overall)} / 5).`);

  if (top.score === bottom.score) {
    // Every construct scored identically: no relative strengths or gaps to name.
    s.push(`All five constructs are rated equally (${fmt2(top.score)}), so self-ratings alone do not separate strengths from development needs.`);
    s.push('In the interview, probe Navigating Ambiguity and Bias for Action for concrete evidence of judgement and follow-through.');
    return s;
  }

  // Strengths: constructs in the Strong/Exemplary band (top two), else the single highest.
  let strengths = sorted.filter((r) => r.score >= STRONG && r.score > bottom.score).slice(0, 2);
  const relativeStrength = !strengths.length;
  if (relativeStrength) strengths = [top];

  // Development: constructs below Strong (lowest two), else the single lowest.
  let devs = [...sorted].reverse().filter((r) => r.score < STRONG && r.score < top.score && !strengths.includes(r)).slice(0, 2);
  const relativeDev = !devs.length;
  if (relativeDev) devs = [bottom];

  // 2 — key strengths and why (indicator evidence)
  const sItems = pickItems(strengths, ratings, 2, true);
  s.push(`${relativeStrength ? 'Relative strength' : 'Key strengths'}: ${list(strengths.map(scoreTag))}, backed by ${relativeStrength ? 'its highest' : 'high'} ratings on ${cite(sItems)}.`);

  // 3 — most important development opportunities
  const dItems = pickItems(devs, ratings, 2, false);
  s.push(`${relativeDev ? 'Relative development area' : 'Development areas'}: ${list(devs.map(scoreTag))}, with lower ratings on ${cite(dItems)}.`);

  // 4 — areas for further exploration in interview
  s.push(`In the interview, probe ${list(devs.map((r) => EXPLORE[r.key]))}.`);

  // 5 — optional flag (inconsistency or uniformly high ratings)
  const uneven = rows.find((r) => {
    const vals = ITEMS.filter((it) => it.behaviour === r.key).map((it) => ratings[it.n - 1]);
    return Math.max(...vals) - Math.min(...vals) >= 3;
  });
  if (uneven) {
    s.push(`Ratings within ${uneven.name} are uneven, so check consistency across situations.`);
  } else if (ratings.every((v) => v >= 4)) {
    s.push(`All statements are rated ${q(label(4))} or above, so validate depth with specific examples.`);
  }

  return s;
}

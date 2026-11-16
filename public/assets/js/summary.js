// Consolidated executive summary for the panel insight report.
// Builds a 5–6 sentence, rule-based narrative from the candidate's 25 ratings
// and the construct scores produced by evaluate() in model.js.

import { BEHAVIOURS, ITEMS, RATING_SCALE, fmt2 } from './model.js';

// Short behavioural-indicator phrases for each of the 25 statements (item 1..25).
const INDICATORS = [
  're-prioritising when plans or dependencies change',
  'diagnosing setbacks and restoring progress',
  'balancing urgency with quality under pressure',
  'applying lessons from setbacks to future plans',
  'flagging setbacks early with a realistic recovery path',
  'deliberately learning unfamiliar domains',
  'seeking specific, challenging feedback',
  'identifying and closing capability gaps',
  'testing new approaches and updating strategy on evidence',
  "sharing expertise and building others' capability",
  'starting bounded work before every dependency is resolved',
  'making assumptions, constraints and risks visible',
  'separating reversible decisions from high-consequence commitments',
  'using clarification and small pilots to reduce uncertainty',
  'setting owners, checkpoints and decision criteria under uncertainty',
  'owning gaps outside their formal scope',
  'acting without waiting for detailed instruction',
  'escalating risks with facts, options and a recommendation',
  'closing loops and confirming outcomes',
  'sustaining momentum within approvals and controls',
  'questioning practices that no longer serve their purpose',
  "understanding a control's original purpose before changing it",
  'building alternatives from evidence and stakeholder input',
  'piloting improvements before wider adoption',
  'revising recommendations when new evidence emerges',
];

// What the panel should explore when a construct is a development area.
const EXPLORE = {
  agility: 'how they have recovered from a real setback, what they changed and whether the learning carried forward',
  growth: 'a specific piece of feedback, what they did differently and what observably improved',
  ambiguity: 'how they separated facts from assumptions, assessed risk and created checkpoints when information was incomplete',
  action: 'an example of unprompted ownership, how they escalated risks and how they verified closure',
  statusquo: 'a practice they challenged, the evidence behind it and how they respected the original controls',
};

const STRONG = 3.4; // lower bound of the "Strong" band

const label = (v) => RATING_SCALE.find((r) => r.value === v)?.label || '';
const q = (s) => `“${s}”`;

function list(parts) {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

function scoreTag(r) {
  return `${r.name} (${fmt2(r.score)}, ${r.band})`;
}

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

function ratingRange(items, highest) {
  const vals = items.map((i) => i.v);
  const edge = highest ? Math.min(...vals) : Math.max(...vals);
  const same = vals.every((v) => v === edge);
  return same ? `all rated ${q(label(edge))}` : `rated ${q(label(edge))} or ${highest ? 'above' : 'below'}`;
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
  const spread = top.score - bottom.score;
  const s = [];

  // 1 — overall profile
  const shape = spread < 0.4 ? 'fairly even across the five constructs'
    : spread < 1.2 ? 'moderately differentiated'
    : 'clearly differentiated';
  const range = spread === 0 ? `with every construct at ${fmt2(top.score)}`
    : `ranging from ${fmt2(bottom.score)} in ${bottom.name} to ${fmt2(top.score)} in ${top.name}`;
  s.push(`${first}'s overall self-assessed profile is ${result.overallBand} (${fmt2(result.overall)} / 5) and ${shape}, ${range}.`);

  if (spread === 0) {
    // Every construct scored identically: no relative strengths or gaps to name.
    const items = pickItems(rows, ratings, 3, true);
    s.push(`All five constructs — Agility & Resilience, Growth Mindset, Navigating Ambiguity, Bias for Action and Challenges Status Quo — are rated at the same level, so self-ratings alone do not separate strengths from development needs.`);
    s.push(`Behavioural indicators such as ${list(items.map((i) => q(INDICATORS[i.n - 1])))} were ${ratingRange(items, true).replace(/^all /, '')}, which reflects how the candidate sees their typical behaviour.`);
    s.push(`The interview should therefore establish where the candidate's real evidence is deepest and where it is thinnest, using the same structured question for each construct.`);
    s.push('In particular, probe Navigating Ambiguity and Bias for Action for concrete evidence of judgement, risk awareness and follow-through.');
    s.push('Treat this summary as a set of interview hypotheses, not as evidence of competence or a hiring signal.');
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

  // 2 — key strengths
  s.push(relativeStrength
    ? `No construct reaches the Strong band, but ${scoreTag(top)} is the candidate's clearest relative strength.`
    : `The candidate's key ${strengths.length > 1 ? 'strengths are' : 'strength is'} ${list(strengths.map(scoreTag))}.`);

  // 3 — why they are strengths (indicator evidence)
  const sItems = pickItems(strengths, ratings, 3, true);
  const core = BEHAVIOURS.find((b) => b.key === strengths[0].key).boundaryCore.replace(/\.$/, '');
  s.push(`${strengths.length > 1 ? 'These stand' : 'This stands'} out because the candidate rated behavioural indicators such as ${list(sItems.map((i) => q(INDICATORS[i.n - 1])))} ${relativeStrength ? 'most favourably' : 'highly'} (${ratingRange(sItems, true)}), signalling self-reported confidence in ${core.charAt(0).toLowerCase()}${core.slice(1)}.`);

  // 4 — most important development opportunities
  const dItems = pickItems(devs, ratings, 3, false);
  s.push(relativeDev
    ? `All constructs fall in the Strong band or above, so the main development opportunity is relative: ${scoreTag(bottom)}, where comparatively lower ratings on ${list(dItems.map((i) => q(INDICATORS[i.n - 1])))} (${ratingRange(dItems, false)}) suggest less consistent demonstration.`
    : `The most important development ${devs.length > 1 ? 'opportunities are' : 'opportunity is'} ${list(devs.map(scoreTag))}, where lower ratings on ${list(dItems.map((i) => q(INDICATORS[i.n - 1])))} (${ratingRange(dItems, false)}) suggest these behaviours are demonstrated less consistently.`);

  // 5 — areas for further exploration in interview
  s.push(`In the interview, explore ${devs.map((r, i) => `${i ? 'for ' : ''}${r.name}, ${i ? 'ask about' : 'by asking about'} ${EXPLORE[r.key]}`).join('; ')}.`);

  // 6 — additional flag (inconsistency or uniformly high ratings), else guardrail
  const uneven = rows
    .map((r) => {
      const its = ITEMS.filter((it) => it.behaviour === r.key).map((it) => ({ n: it.n, v: ratings[it.n - 1] }));
      const hi = its.reduce((a, b) => (b.v > a.v ? b : a));
      const lo = its.reduce((a, b) => (b.v < a.v ? b : a));
      return { r, hi, lo, gap: hi.v - lo.v };
    })
    .filter((x) => x.gap >= 3)
    .sort((a, b) => b.gap - a.gap)[0];
  const allHigh = ratings.every((v) => v >= 4);

  if (uneven) {
    s.push(`Ratings within ${uneven.r.name} are uneven — ${q(label(uneven.hi.v))} on ${INDICATORS[uneven.hi.n - 1]} but ${q(label(uneven.lo.v))} on ${INDICATORS[uneven.lo.n - 1]} — so also test whether this behaviour holds across different situations.`);
  } else if (allHigh) {
    s.push('Because every statement was rated "Often True" or above, the panel should also validate depth with specific, evidence-backed examples rather than accept self-reported confidence at face value.');
  } else {
    s.push('Treat these points as interview hypotheses to verify with specific examples, personal contribution and outcomes, not as a hiring signal.');
  }

  return s;
}

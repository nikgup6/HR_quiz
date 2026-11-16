// Checks model.js against values cached in the source workbook
// (example candidate in "2 Self Assessment" D12:D36), plus band edges.
import assert from 'node:assert/strict';
import { evaluate, band } from '../public/assets/js/model.js';

const example = [4,5,4,4,4, 3,3,4,3,4, 3,3,1,5,5, 5,5,5,2,5, 5,5,5,5,5];
const r = evaluate(example);

const expected = [
  ['Agility & Resilience', 4.2, 'Exemplary', 'Self-rating: 4.20/5 (Exemplary). High self-rating suggests confidence in adapting. Verify judgement, sustainable recovery and learning across demanding situations.', 'Validate depth and transfer across situations; test judgement, impact and any relevant controls.'],
  ['Growth Mindset', 3.4, 'Strong', 'Self-rating: 3.40/5 (Strong). Self-rating suggests a positive learning orientation. Verify feedback-to-action and observable improvement.', 'Validate the self-rating with a specific example, personal contribution and observable outcome.'],
  ['Navigating Ambiguity', 3.4, 'Strong', 'Self-rating: 3.40/5 (Strong). Self-rating suggests workable comfort with uncertainty. Verify risk assessment, clarification and checkpoints.', 'Validate the self-rating with a specific example, personal contribution and observable outcome.'],
  ['Bias for Action', 4.4, 'Exemplary', 'Self-rating: 4.40/5 (Exemplary). High self-rating suggests confidence in initiative. Verify responsible action, authority boundaries and measurable follow-through.', 'Validate depth and transfer across situations; test judgement, impact and any relevant controls.'],
  ['Challenges Status Quo', 5, 'Exemplary', 'Self-rating: 5.00/5 (Exemplary). High self-rating suggests confidence in challenging established approaches. Verify constructive challenge, testing and respect for controls.', 'Validate depth and transfer across situations; test judgement, impact and any relevant controls.'],
];
expected.forEach(([name, score, b, interp, rec], i) => {
  const row = r.rows[i];
  assert.equal(row.name, name);
  assert.ok(Math.abs(row.score - score) < 1e-12, `${name} score ${row.score}`);
  assert.equal(row.band, b);
  assert.equal(row.interpretation, interp);
  assert.equal(row.recommendation, rec);
  assert.equal(row.completion, 5);
});
assert.ok(Math.abs(r.overall - 4.08) < 1e-12, `overall ${r.overall}`);
assert.equal(r.overallBand, 'Strong');
assert.equal(r.completion, '25 / 25');
assert.equal(r.strongestText, 'Challenges Status Quo (5.00 / 5)');
assert.equal(r.priorityText, 'Growth Mindset (3.40 / 5) — explore in interview');

// Band thresholds (K6 formula)
assert.equal(band(0), 'Not scored');
assert.equal(band(1), 'Emerging');
assert.equal(band(1.8), 'Developing');
assert.equal(band(2.6), 'Consistent');
assert.equal(band(3.4), 'Strong');
assert.equal(band(4.2), 'Exemplary');

// Incomplete set
const partial = evaluate([5, ...Array(24).fill(null)]);
assert.equal(partial.overallBand, 'Incomplete');
assert.equal(partial.strongestText, 'Awaiting completion');
assert.equal(partial.rows[1].interpretation, 'Awaiting ratings. Complete the five items to generate an interpretation.');

// Ties resolve to first behaviour in sheet order (INDEX/MATCH)
const flat = evaluate(Array(25).fill(3));
assert.equal(flat.strongestText, 'Agility & Resilience (3.00 / 5)');
assert.equal(flat.priorityText, 'Agility & Resilience (3.00 / 5) — explore in interview');

console.log('Scoring matches the workbook: all checks passed.');

// Floating-point edge: mathematically 1.8 must band as "Developing", as LibreOffice/Excel do.
const edge = evaluate([1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,2, 1,1,1,1,2, 5,5,5,4,4]);
assert.equal(edge.overall, 1.8);
assert.equal(edge.overallBand, 'Developing');
console.log('Float edge case matches spreadsheet recalculation.');

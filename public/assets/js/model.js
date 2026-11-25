// Zinnov Growth Mindset & Resilience Inventory
// Content and scoring logic, transcribed from the source workbook
// ("1 Behaviours", "2 Self Assessment", "3 Panel Report").
// Shared by the browser pages and the /api functions so every score is
// computed by exactly one implementation.

export const INSTRUMENT = {
  title: 'Zinnov Growth Mindset & Resilience Inventory',
  subtitle: 'Five observable GCC behaviours - reference, weighting and panel guidance',
  selfTitle: 'Candidate self-assessment',
  selfInstruction:
    'Rate how consistently each statement reflects your workplace behaviour. Complete all 25 questions.',
  reportTitle: 'Panel insight report',
  reportSubtitle:
    'Growth Mindset & Resilience Inventory — self-assessment profile, panel insights and structured interview guide',
  governanceNote:
    'Governance note: These proposed definitions and indicators describe observable workplace behaviour. They support structured reflection and interview hypotheses; they are not validated norms and must not be used as an automatic hire/reject decision. Complete SME review, candidate cognitive interviews and pilot psychometrics before operational deployment.',
  useNote: 'Provisional descriptive bands; use for interview hypotheses, not automated selection.',
  panelRatingGuidance:
    "Complete the 1–5 panel rating only after the structured interview. Rate demonstrated, job-related evidence against the rubric in Tab 4; do not copy or average the candidate's self-rating. Panel members should rate independently before discussing differences.",
  panelRatingScale:
    '1 = No evidence | 2 = Limited evidence | 3 = Adequate evidence | 4 = Strong evidence | 5 = Highly compelling evidence. Use only evidence relevant to the role and level.',
  panelRecommendationDefault:
    'PENDING INTERVIEW — This report automatically identifies self-assessment patterns and interview hypotheses. Complete panel evidence and ratings after the structured interview; do not infer a hiring decision from self-ratings.',
  decisionRationaleGuide:
    "Complete after the interview. Summarise the candidate's personal contribution, decision reasoning, outcome, evidence strength, role relevance, panel rating rationale and unresolved gaps. Do not infer a hiring recommendation from self-assessment alone.",
  guardrails:
    "INTERPRETATION & DECISION GUARDRAILS: Scores, bands, behaviour interpretations, suggested interview focus and strongest/lowest self-rated behaviours update from the candidate's 25 responses. Self-assessment reflects the candidate's perception, not verified competence. Panel evidence and panel ratings remain manual and must be based on the structured interview. Do not average self-ratings and panel ratings or use this report as the sole hiring decision tool.",
  workflow:
    'WORKFLOW: Complete candidate details and 25 ratings → review score profile and panel hypotheses → conduct the same structured questions for comparable candidates → record evidence → assign independent panel ratings → discuss discrepancies → document rationale → export this report as PDF.',
  panelNotesTemplate:
    "Situation / context:\nCandidate's role:\nActions and reasoning:\nStakeholders / risks:\nOutcome / impact:\nLearning / evidence gaps:",
};

// Sheet "2 Self Assessment" F18:G22
export const RATING_SCALE = [
  { value: 1, label: 'Rarely True', meaning: 'I am beginning to demonstrate this behaviour in relevant situations and am developing my understanding with support.' },
  { value: 2, label: 'Occasionally True', meaning: 'I demonstrate this behaviour in some relevant situations and am gradually building consistency.' },
  { value: 3, label: 'Sometimes True', meaning: 'I demonstrate this behaviour in relevant situations with reasonable independence and occasional guidance.' },
  { value: 4, label: 'Often True', meaning: 'I demonstrate this behaviour independently and effectively in most relevant situations.' },
  { value: 5, label: 'Consistently True', meaning: 'I demonstrate this behaviour reliably across varied relevant situations and can explain its positive impact.' },
];

// Sheet "3 Panel Report" B17
export const PANEL_SCALE = [
  { value: 1, label: 'No evidence' },
  { value: 2, label: 'Limited evidence' },
  { value: 3, label: 'Adequate evidence' },
  { value: 4, label: 'Strong evidence' },
  { value: 5, label: 'Highly compelling evidence' },
];

// Sheet "1 Behaviours" rows 5–9, plus the per-behaviour text used in
// "3 Panel Report" E11:E15 (interpretation) and G11:G15 (recommended probe).
export const BEHAVIOURS = [
  {
    key: 'agility',
    name: 'Agility & Resilience',
    weight: 0.2,
    definition:
      'Responds constructively when priorities, assumptions, structures or plans change; adapts the approach, recovers from setbacks, protects judgement under pressure and applies learning to strengthen future delivery.',
    showsUp: [
      'Re-prioritises when plans, dependencies or customer needs change',
      'Identifies the cause and impact of a setback without blame',
      'Communicates material risks early and proposes a workable recovery path',
      'Balances urgency, quality and sustainable delivery',
      'Applies lessons from setbacks to strengthen future plans',
    ],
    probes: [
      'Describe a significant setback and your role.',
      'What did you change in your plan or approach?',
      'Which lesson did you apply later, and with what result?',
    ],
    example:
      'A transition slips because knowledge remains at headquarters; reset sequencing, identify minimum continuity knowledge, pair ownership and establish recovery actions.',
    boundaryCore: 'Adapting, recovering and learning when reality changes.',
    boundaryNot: 'Enduring pressure indefinitely, hiding strain or treating constant availability as resilience.',
    interpretation: [
      'Explore how the candidate responds to change, setbacks and pressure; establish context and support needs.',
      'Explore consistency in adapting to change, recovering from setbacks and maintaining delivery.',
      'Self-rating suggests generally positive adaptability. Verify recovery actions, communication and learning transfer.',
      'High self-rating suggests confidence in adapting. Verify judgement, sustainable recovery and learning across demanding situations.',
    ],
    panelQuestion: 'Tell us about a setback or unexpected change. How did you respond, and what did you learn?',
    panelProbe: 'Your role • Key decision • Stakeholder update • Outcome • Later application.',
  },
  {
    key: 'growth',
    name: 'Growth Mindset',
    weight: 0.2,
    definition:
      'Demonstrates that capability can improve through deliberate learning, challenge, feedback, experimentation and reflection; applies learning to work and updates strategies when evidence shows a better approach.',
    showsUp: [
      'Learns unfamiliar domains and technology through deliberate practice',
      'Seeks specific feedback, including feedback that challenges current assumptions',
      'Identifies capability gaps and takes action to address them',
      'Tests new approaches and evaluates what works',
      'Shares learning and supports capability development in others',
    ],
    probes: [
      'Share a time you received feedback or had to learn something unfamiliar.',
      'What feedback changed your approach?',
      'How did you apply it, and what observable result followed?',
    ],
    example:
      'A leader entering a new industry runs a learning sprint, tests assumptions against live work, seeks feedback and updates the capability plan based on evidence.',
    boundaryCore: 'Learning, applying feedback and changing capability or strategy.',
    boundaryNot: 'Consuming training without application or claiming to be a fast learner without evidence.',
    interpretation: [
      'Explore openness to feedback, deliberate learning and willingness to change established approaches.',
      'Explore whether learning and feedback are applied consistently to improve work.',
      'Self-rating suggests a positive learning orientation. Verify feedback-to-action and observable improvement.',
      'High self-rating suggests confidence in learning. Verify sustained behaviour change and evidence of improvement.',
    ],
    panelQuestion: 'What feedback changed how you worked? What did you do differently, and what improved?',
    panelProbe: 'Feedback received • Initial response • Practice taken • Evidence of improvement.',
  },
  {
    key: 'ambiguity',
    name: 'Navigating Ambiguity',
    weight: 0.2,
    definition:
      'Makes responsible progress when goals, data, roles, decision rights or processes are incomplete; distinguishes facts from assumptions, assesses risk, creates working structure and reduces uncertainty through clarification, experiments and checkpoints.',
    showsUp: [
      'Separates what is known, unknown and assumed',
      'Makes constraints, dependencies and risks visible',
      'Distinguishes reversible decisions from high-consequence commitments',
      'Seeks clarification from the right decision-makers when needed',
      'Creates provisional owners, milestones and review points',
    ],
    probes: [
      'With a strategic goal and minimal direction, how did you start?',
      'How did you distinguish facts from assumptions and structure the approach?',
      'What clarity and result did you create?',
    ],
    example:
      'With an evolving GCC charter, define provisional owners, document assumptions and start a bounded pilot with governance reviews and clear decision points.',
    boundaryCore: 'Creating responsible movement and clarity without full information.',
    boundaryNot: 'Acting without boundaries or risk awareness, or waiting passively for perfect clarity.',
    interpretation: [
      'Explore how the candidate distinguishes facts from assumptions, manages risk and seeks clarity.',
      'This is a useful interview area to explore: test judgement and structure when information is incomplete.',
      'Self-rating suggests workable comfort with uncertainty. Verify risk assessment, clarification and checkpoints.',
      'High self-rating suggests confidence under uncertainty. Verify sound decisions, explicit assumptions and appropriate controls.',
    ],
    panelQuestion:
      'Describe a time you worked with unclear instructions or incomplete information. How did you decide what to do?',
    panelProbe: 'Known/unknown • Risk • Clarification • Decision • Checkpoint • Outcome.',
  },
  {
    key: 'action',
    name: 'Bias for Action',
    weight: 0.2,
    definition:
      'Converts awareness into timely, responsible action; owns outcomes, fixes what is within reach, clarifies ownership, escalates material risks early and sustains momentum without bypassing controls.',
    showsUp: [
      'Acts on important problems within their remit rather than waiting unnecessarily',
      'Clarifies ownership and next steps across hand-offs',
      'Escalates with facts, options and a recommendation',
      'Coordinates stakeholders and removes practical blockers',
      'Follows actions through to verified closure while respecting policy and controls',
    ],
    probes: [
      'Describe a critical gap you took ownership of, even if it sat outside your immediate scope.',
      'What did you do without prompting?',
      'How did you drive it end to end and verify the impact?',
    ],
    example:
      'When joiners lack access, convene owners, introduce a minimum Day-1 checklist and pilot it while a longer-term technology solution is developed.',
    boundaryCore: 'Timely ownership, accountable execution and follow-through.',
    boundaryNot: 'Speed at the expense of controls, stakeholders or quality.',
    interpretation: [
      'Explore ownership, timely action, escalation and follow-through on practical problems.',
      'Explore whether the candidate takes initiative and follows actions through reliably.',
      'Self-rating suggests a positive action orientation. Verify ownership, stakeholder coordination and closure.',
      'High self-rating suggests confidence in initiative. Verify responsible action, authority boundaries and measurable follow-through.',
    ],
    panelQuestion:
      'Tell us about a problem you took ownership of without being prompted. What action did you take, and what was the result?',
    panelProbe: 'Initiative • Approval/authority • Stakeholders • Risk • Closure.',
  },
  {
    key: 'statusquo',
    name: 'Challenges Status Quo',
    weight: 0.2,
    definition:
      'Questions established approaches when evidence shows they no longer serve the intended outcome; understands the original purpose and controls, proposes practical alternatives, tests change and remains open to challenge.',
    showsUp: [
      'Identifies a specific inefficiency, risk or unmet need',
      'Understands why the existing process or control exists',
      'Uses evidence and stakeholder input to frame the issue',
      'Proposes a feasible alternative and tests it proportionately',
      'Evaluates results and adapts or withdraws the proposal when evidence changes',
    ],
    probes: [
      'Describe an entrenched practice you challenged.',
      'What evidence showed that it needed to change, and what was its original purpose?',
      'What alternative did you test, and what result followed?',
    ],
    example:
      'Map the control objective in a slow approval process, remove redundant hand-offs and pilot risk-based delegated approvals with audit visibility.',
    boundaryCore: 'Evidence-led, constructive improvement of an established system.',
    boundaryNot: 'Criticism or novelty for its own sake, or weakening necessary controls.',
    interpretation: [
      'Explore constructive questioning, use of evidence and understanding of existing process controls.',
      'Explore whether the candidate can identify improvement opportunities and propose practical alternatives.',
      'Self-rating suggests some confidence in improvement. Verify evidence-led challenge and measured outcomes.',
      'High self-rating suggests confidence in challenging established approaches. Verify constructive challenge, testing and respect for controls.',
    ],
    panelQuestion: 'Describe a process you challenged. What evidence prompted the change, and what happened?',
    panelProbe: 'Problem evidence • Original purpose • Alternative tested • Stakeholder input • Impact.',
  },
];

// Sheet "2 Self Assessment" A12:C36 — order matters (item 1..25).
export const ITEMS = [
  ['agility', 'When priorities or dependencies change, I re-prioritise and adjust my plan while keeping delivery focused.'],
  ['agility', 'After a setback, I identify the cause and take practical steps to restore progress.'],
  ['agility', 'Under pressure, I balance urgency with quality and sustainable ways of working.'],
  ['agility', 'I apply lessons from setbacks to strengthen future plans or ways of working.'],
  ['agility', 'I communicate material setbacks early and suggest a realistic recovery path.'],
  ['growth', 'I deliberately learn unfamiliar domains, technologies or contexts when the work demands it.'],
  ['growth', 'I actively seek specific feedback, including feedback that challenges my current approach.'],
  ['growth', 'I identify capability gaps and take deliberate steps to address them.'],
  ['growth', 'I test new approaches and update my strategy when evidence shows a better way.'],
  ['growth', 'I share expertise and help others build capability rather than protecting what I know.'],
  ['ambiguity', 'I begin useful, bounded work even when every dependency is not yet resolved.'],
  ['ambiguity', 'I make assumptions, constraints and risks visible when direction is incomplete.'],
  ['ambiguity', 'I distinguish reversible decisions from high-consequence commitments.'],
  ['ambiguity', 'I use clarification, small experiments or pilots to reduce uncertainty.'],
  ['ambiguity', 'I create clear owners, checkpoints and decision criteria in uncertain situations.'],
  ['action', 'I take ownership of important gaps even when they sit outside my formal scope.'],
  ['action', 'I act on what is within my control without waiting unnecessarily for detailed instruction.'],
  ['action', 'I escalate risks with facts, options and a clear recommendation.'],
  ['action', 'I close loops, confirm outcomes and make ownership visible.'],
  ['action', 'I sustain momentum while respecting approvals, policies and quality requirements.'],
  ['statusquo', 'I question established practices when evidence shows they no longer serve the intended outcome.'],
  ['statusquo', 'I understand the original purpose of a process or control before recommending a change.'],
  ['statusquo', 'I use evidence and stakeholder input to develop practical alternatives.'],
  ['statusquo', 'I test proposed improvements and evaluate their impact before wider adoption.'],
  ['statusquo', 'I revise or withdraw my recommendation when new evidence shows it is not effective.'],
].map(([behaviour, text], i) => ({ n: i + 1, behaviour, text }));

export const ITEM_COUNT = ITEMS.length;

const byKey = Object.fromEntries(BEHAVIOURS.map((b) => [b.key, b]));
export const behaviourByKey = (k) => byKey[k];

/* ---------------------------------------------------------------- scoring */

// Excel keeps 15 significant digits, so 0.36+0.36+0.36+0.36+0.36 is 1.8 there
// while IEEE arithmetic gives 1.7999999999999998. Normalise before banding.
const xl = (x) => Number(x.toPrecision(15));

// Excel TEXT(x,"0.00") — rounds half away from zero.
export function fmt2(x) {
  const r = Math.round((Math.abs(x) + Number.EPSILON) * 100) / 100;
  return (x < 0 ? -r : r).toFixed(2);
}

// "2 Self Assessment" K6:K10
export function band(score) {
  if (score === 0) return 'Not scored';
  if (score < 1.8) return 'Emerging';
  if (score < 2.6) return 'Developing';
  if (score < 3.4) return 'Consistent';
  if (score < 4.2) return 'Strong';
  return 'Exemplary';
}

export const BANDS = ['Emerging', 'Developing', 'Consistent', 'Strong', 'Exemplary'];

// "3 Panel Report" F11:F15
function recommendation(score) {
  if (score === 0) return 'Complete the self-assessment before setting an interview focus.';
  if (score < 2.6) return 'Priority probe: establish the behaviour, context, support required and learning.';
  if (score < 3.4) return 'Probe consistency, decision reasoning and a specific example with an outcome.';
  if (score < 4.2) return 'Validate the self-rating with a specific example, personal contribution and observable outcome.';
  return 'Validate depth and transfer across situations; test judgement, impact and any relevant controls.';
}

// "3 Panel Report" E11:E15
function interpretation(b, score, bandLabel) {
  if (score === 0) return 'Awaiting ratings. Complete the five items to generate an interpretation.';
  const idx = score < 2.6 ? 0 : score < 3.4 ? 1 : score < 4.2 ? 2 : 3;
  return `Self-rating: ${fmt2(score)}/5 (${bandLabel}). ${b.interpretation[idx]}`;
}

export function isValidRating(v) {
  return Number.isInteger(v) && v >= 1 && v <= 5;
}

/**
 * Evaluate 25 ratings exactly as the workbook does.
 * @param {(number|null)[]} ratings  index 0 = item 1. Blank = null.
 */
export function evaluate(ratings) {
  const rows = BEHAVIOURS.map((b) => {
    // AVERAGEIF($B$12:$B$36, behaviour, $D$12:$D$36) — blanks ignored, 0 if none.
    const vals = ITEMS.filter((it) => it.behaviour === b.key)
      .map((it) => ratings[it.n - 1])
      .filter((v) => typeof v === 'number');
    let sum = 0;
    for (const v of vals) sum += v;
    const score = vals.length ? xl(sum / vals.length) : 0;
    const bandLabel = band(score);
    return {
      key: b.key,
      name: b.name,
      score,
      weight: b.weight,
      weighted: xl(score * b.weight), // J = H*I
      band: bandLabel,
      completion: vals.filter((v) => v >= 1).length, // COUNTIFS(...,">=1")
      interpretation: interpretation(b, score, bandLabel),
      recommendation: recommendation(score),
      panelQuestion: b.panelQuestion,
      panelProbe: b.panelProbe,
    };
  });

  let overall = 0;
  for (const r of rows) overall += r.weighted; // SUM(J6:J10)
  overall = xl(overall);
  const answered = ratings.filter((v) => typeof v === 'number').length; // COUNT(D12:D36)
  const complete = answered >= ITEM_COUNT;

  const overallBand = !complete
    ? 'Incomplete'
    : overall < 1.8 ? 'Emerging'
    : overall < 2.6 ? 'Developing'
    : overall < 3.4 ? 'Consistent'
    : overall < 4.2 ? 'Strong'
    : 'Exemplary';

  // INDEX/MATCH(MAX|MIN, ..., 0) returns the first match in sheet order.
  let strongest = null;
  let priority = null;
  if (complete) {
    const scores = rows.map((r) => r.score);
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const s = rows[scores.indexOf(max)];
    const p = rows[scores.indexOf(min)];
    strongest = { key: s.key, name: s.name, score: max, text: `${s.name} (${fmt2(max)} / 5)` };
    priority = { key: p.key, name: p.name, score: min, text: `${p.name} (${fmt2(min)} / 5) — explore in interview` };
  }

  return {
    rows,
    overall,
    overallBand,
    answered,
    completion: `${answered} / ${ITEM_COUNT}`,
    complete,
    strongestText: strongest ? strongest.text : 'Awaiting completion',
    priorityText: priority ? priority.text : 'Awaiting completion',
    strongest,
    priority,
  };
}

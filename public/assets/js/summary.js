// Executive summary for the panel insight report: key strength, development
// area and one interview probe, in plain words (no scores, no quoted items).
// Shown only when the overall weighted score is above SUMMARY_MIN.

export const SUMMARY_MIN = 3.2;

const STRONG = 3.4; // lower bound of the "Strong" band

// What the panel should explore when a behaviour is the development area.
const EXPLORE = {
  agility: 'a real setback, how they recovered and what they changed afterwards',
  growth: 'feedback that changed how they work and what improved as a result',
  ambiguity: 'how they separate facts from assumptions and decide what to do when information is incomplete',
  action: 'a problem they owned without being asked and how they drove it to closure',
  statusquo: 'a practice they challenged, the evidence behind it and how they respected existing controls',
};

function list(parts) {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/**
 * @param {object} result  output of evaluate(ratings)
 * @returns {{strength:string, development:string, probe:string} | null}
 *          null when the summary should not be shown.
 */
export function executiveSummary(result) {
  if (!result.complete || !(result.overall > SUMMARY_MIN)) return null;

  // Ties follow the workbook's INDEX/MATCH rule (first behaviour in sheet order),
  // so the summary agrees with "Strongest" and "Priority interview hypothesis".
  const sorted = [...result.rows].sort((a, b) => b.score - a.score);
  const top = result.rows.find((r) => r.key === result.strongest.key);
  const bottom = result.rows.find((r) => r.key === result.priority.key);

  if (top.score === bottom.score) {
    return {
      strength: 'No single behaviour stands out; the candidate rated all five evenly.',
      development: 'No distinct development area from the self-assessment alone.',
      probe: `Ask about ${EXPLORE.ambiguity}, and about ${EXPLORE.action}.`,
    };
  }

  // Strengths: up to two behaviours in the Strong/Exemplary range, else the highest.
  let strengths = sorted.filter((r) => r.score >= STRONG && r.score > bottom.score);
  strengths = [top, ...strengths.filter((r) => r !== top)].filter((r) => r.score >= STRONG).slice(0, 2);
  if (!strengths.length) strengths = [top];

  // Development: up to two behaviours below Strong, else the lowest.
  let devs = [...result.rows].sort((a, b) => a.score - b.score)
    .filter((r) => r.score < STRONG && r.score < top.score && !strengths.includes(r));
  devs = [bottom, ...devs.filter((r) => r !== bottom)].filter((r) => r.score < STRONG).slice(0, 2);
  if (!devs.length) devs = [bottom];

  return {
    strength: list(strengths.map((r) => r.name)),
    development: list(devs.map((r) => r.name)),
    probe: `Ask about ${EXPLORE[devs[0].key]}.`,
  };
}

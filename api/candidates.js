import { query } from './_lib/db.js';
import { route, send, readJson, badRequest } from './_lib/http.js';
import { BEHAVIOURS } from '../public/assets/js/model.js';

const LIST_SQL = `
  SELECT id, candidate_code, name, email, phone, role_track, overall, overall_band,
         submitted_at, panel_updated_at,
         (panel->>'status') AS panel_status
    FROM submissions
   ORDER BY submitted_at DESC
   LIMIT 2000`;

const DETAIL_SQL = `
  SELECT id, candidate_code, name, email, phone, role_track, ratings, reflections,
         overall, overall_band, panel, panel_updated_at, panel_updated_by, submitted_at
    FROM submissions WHERE id = $1`;

const parse = (v) => (typeof v === 'string' ? JSON.parse(v) : v);
const STATUSES = ['pending', 'interviewed', 'closed'];

function sanitisePanel(input) {
  const panel = { notes: {}, ratings: {} };
  const src = input && typeof input === 'object' ? input : {};
  for (const b of BEHAVIOURS) {
    const note = src.notes?.[b.key];
    if (typeof note === 'string') panel.notes[b.key] = note.slice(0, 5000);
    const r = Number(src.ratings?.[b.key]);
    if (Number.isInteger(r) && r >= 1 && r <= 5) panel.ratings[b.key] = r;
  }
  if (typeof src.recommendation === 'string') panel.recommendation = src.recommendation.slice(0, 3000);
  if (typeof src.rationale === 'string') panel.rationale = src.rationale.slice(0, 8000);
  panel.status = STATUSES.includes(src.status) ? src.status : 'pending';
  return panel;
}

export default route(['GET', 'PATCH', 'DELETE'], async (req, res, session) => {
  const id = new URL(req.url, 'http://x').searchParams.get('id');

  if (req.method === 'GET' && !id) {
    const rows = await query(LIST_SQL);
    return send(res, 200, { candidates: rows });
  }
  if (!id) throw badRequest('Missing candidate id.');

  if (req.method === 'GET') {
    const [row] = await query(DETAIL_SQL, [id]);
    if (!row) return send(res, 404, { error: 'Candidate not found.' });
    for (const k of ['ratings', 'reflections', 'panel']) row[k] = parse(row[k]);
    return send(res, 200, { candidate: row });
  }

  if (req.method === 'PATCH') {
    const body = await readJson(req);
    const panel = sanitisePanel(body.panel);
    const rows = await query(
      `UPDATE submissions SET panel = $2::jsonb, panel_updated_at = now(), panel_updated_by = $3
        WHERE id = $1 RETURNING panel_updated_at, panel_updated_by`,
      [id, JSON.stringify(panel), session.name || session.email],
    );
    if (!rows.length) return send(res, 404, { error: 'Candidate not found.' });
    return send(res, 200, { ok: true, panel, ...rows[0] });
  }

  // DELETE
  const rows = await query('DELETE FROM submissions WHERE id = $1 RETURNING id', [id]);
  if (!rows.length) return send(res, 404, { error: 'Candidate not found.' });
  send(res, 200, { ok: true });
}, { auth: true });

import { randomBytes, randomUUID } from 'node:crypto';
import { query } from './_lib/db.js';
import { route, send, readJson, badRequest } from './_lib/http.js';
import { ITEM_COUNT, evaluate, isValidRating } from '../public/assets/js/model.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function candidateCode() {
  const bytes = randomBytes(6);
  let out = '';
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return `GMR-${out}`;
}

const clean = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export default route(['POST'], async (req, res) => {
  const body = await readJson(req);

  // Honeypot: real candidates never see or fill this field.
  if (body.website) return send(res, 200, { ok: true, candidateCode: candidateCode() });

  const name = clean(body.name, 120);
  const email = clean(body.email, 160).toLowerCase();
  const phone = clean(body.phone, 24);
  const roleTrack = clean(body.roleTrack, 120);

  if (name.length < 2) throw badRequest('Please enter your full name.');
  if (!EMAIL_RE.test(email)) throw badRequest('Please enter a valid email address.');
  const digits = phone.replace(/\D/g, '');
  if (!/^\+?[\d\s()-]+$/.test(phone) || digits.length < 7 || digits.length > 15) {
    throw badRequest('Please enter a valid phone number.');
  }

  const ratings = Array.isArray(body.ratings) ? body.ratings.map(Number) : [];
  if (ratings.length !== ITEM_COUNT || !ratings.every(isValidRating)) {
    throw badRequest(`All ${ITEM_COUNT} statements need a rating between 1 and 5.`);
  }

  const reflections = {};
  if (body.reflections && typeof body.reflections === 'object') {
    for (const [k, v] of Object.entries(body.reflections)) {
      const n = Number(k);
      const text = String(v ?? '').trim().slice(0, 2000);
      if (Number.isInteger(n) && n >= 1 && n <= ITEM_COUNT && text) reflections[n] = text;
    }
  }

  const result = evaluate(ratings);

  for (let attempt = 0; attempt < 3; attempt++) {
    const code = candidateCode();
    try {
      await query(
        `INSERT INTO submissions
           (id, candidate_code, name, email, phone, role_track, ratings, reflections, overall, overall_band)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10)`,
        [randomUUID(), code, name, email, phone, roleTrack, JSON.stringify(ratings), JSON.stringify(reflections),
          result.overall, result.overallBand],
      );
      return send(res, 201, { ok: true, candidateCode: code });
    } catch (err) {
      if (err.code === '23505' && attempt < 2) continue; // candidate code collision
      throw err;
    }
  }
});

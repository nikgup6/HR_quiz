import { query } from './_lib/db.js';
import { route, send, readJson, clientIp } from './_lib/http.js';
import { verifyPassword, createSessionCookie, clearSessionCookie, readSession } from './_lib/auth.js';

const MAX_FAILURES = 5;
const WINDOW_MINUTES = 15;

export default route(['GET', 'POST', 'DELETE'], async (req, res) => {
  if (req.method === 'GET') {
    const session = readSession(req);
    if (!session) return send(res, 401, { error: 'Not signed in' });
    return send(res, 200, { user: { email: session.email, name: session.name } });
  }

  if (req.method === 'DELETE') {
    return send(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie() });
  }

  const body = await readJson(req);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!email || !password) return send(res, 400, { error: 'Enter your email and password.' });

  const [{ failures }] = await query(
    `SELECT count(*)::int AS failures FROM login_attempts
      WHERE email = $1 AND attempted_at > now() - ($2 || ' minutes')::interval`,
    [email, String(WINDOW_MINUTES)],
  );
  if (failures >= MAX_FAILURES) {
    return send(res, 429, { error: `Too many attempts. Try again in ${WINDOW_MINUTES} minutes.` });
  }

  const [user] = await query('SELECT id, email, name, password_hash FROM hr_users WHERE email = $1', [email]);
  const ok = user ? await verifyPassword(password, user.password_hash) : false;

  if (!ok) {
    await query('INSERT INTO login_attempts (email, ip) VALUES ($1, $2)', [email, clientIp(req)]);
    return send(res, 401, { error: 'That email and password combination is not recognised.' });
  }

  await query('DELETE FROM login_attempts WHERE email = $1', [email]);
  send(res, 200, { user: { email: user.email, name: user.name } }, { 'Set-Cookie': createSessionCookie(user) });
});

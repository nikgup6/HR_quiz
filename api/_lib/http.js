import { readSession } from './auth.js';

export function send(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

export async function readJson(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
    if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString('utf8') || '{}');
    return req.body;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 200_000) throw Object.assign(new Error('Payload too large'), { status: 413 });
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  return (Array.isArray(fwd) ? fwd[0] : fwd || '').split(',')[0].trim() || req.socket?.remoteAddress || '';
}

// Wraps a handler: method allow-list, optional auth, JSON error responses.
export function route(methods, handler, { auth = false } = {}) {
  return async (req, res) => {
    try {
      if (!methods.includes(req.method)) {
        return send(res, 405, { error: 'Method not allowed' }, { Allow: methods.join(', ') });
      }
      let session = null;
      if (auth) {
        session = readSession(req);
        if (!session) return send(res, 401, { error: 'Please sign in to continue.' });
      }
      await handler(req, res, session);
    } catch (err) {
      if (err instanceof SyntaxError) return send(res, 400, { error: 'Malformed request body.' });
      if (err.status) return send(res, err.status, { error: err.message });
      console.error(err);
      send(res, 500, { error: 'Something went wrong on our side. Please try again.' });
    }
  };
}

export const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

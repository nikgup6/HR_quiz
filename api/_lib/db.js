// Postgres access. Production uses Neon's HTTP driver (works in Vercel
// serverless without connection pooling). `npm run dev` injects an in-process
// PGlite database through globalThis.__GMR_LOCAL_DB__ so the app runs locally
// without any cloud setup.
import { neon } from '@neondatabase/serverless';
import { hashPassword } from './auth.js';

let client;

function getClient() {
  if (client) return client;
  if (globalThis.__GMR_LOCAL_DB__) {
    const local = globalThis.__GMR_LOCAL_DB__;
    client = async (text, params = []) => (await local.query(text, params)).rows;
    return client;
  }
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error('DATABASE_URL is not configured');
  const sql = neon(url);
  client = (text, params = []) => sql.query(text, params);
  return client;
}

export async function query(text, params) {
  await ensureSchema();
  return getClient()(text, params);
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS hr_users (
     id            SERIAL PRIMARY KEY,
     email         TEXT NOT NULL UNIQUE,
     name          TEXT NOT NULL DEFAULT '',
     password_hash TEXT NOT NULL,
     created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS submissions (
     id               TEXT PRIMARY KEY,
     candidate_code   TEXT NOT NULL UNIQUE,
     name             TEXT NOT NULL,
     email            TEXT NOT NULL,
     phone            TEXT NOT NULL,
     role_track       TEXT NOT NULL DEFAULT '',
     ratings          JSONB NOT NULL,
     reflections      JSONB NOT NULL DEFAULT '{}'::jsonb,
     overall          DOUBLE PRECISION NOT NULL,
     overall_band     TEXT NOT NULL,
     panel            JSONB NOT NULL DEFAULT '{}'::jsonb,
     panel_updated_at TIMESTAMPTZ,
     panel_updated_by TEXT,
     submitted_at     TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS submissions_submitted_at_idx ON submissions (submitted_at DESC)`,
  `CREATE TABLE IF NOT EXISTS login_attempts (
     id         SERIAL PRIMARY KEY,
     email      TEXT NOT NULL,
     ip         TEXT NOT NULL DEFAULT '',
     attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS login_attempts_email_idx ON login_attempts (email, attempted_at)`,
];

let schemaReady;

export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const run = getClient();
      for (const stmt of SCHEMA) await run(stmt);
      await bootstrapAdmin(run);
    })().catch((err) => {
      schemaReady = undefined;
      throw err;
    });
  }
  return schemaReady;
}

// First deploy: create the HR account named in HR_ADMIN_EMAIL / HR_ADMIN_PASSWORD
// if it does not exist yet. Existing accounts are never modified here.
async function bootstrapAdmin(run) {
  const email = (process.env.HR_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.HR_ADMIN_PASSWORD || '';
  if (!email || !password) return;
  const existing = await run('SELECT 1 FROM hr_users WHERE email = $1', [email]);
  if (existing.length) return;
  await run(
    'INSERT INTO hr_users (email, name, password_hash) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING',
    [email, process.env.HR_ADMIN_NAME || 'HR Admin', await hashPassword(password)],
  );
}

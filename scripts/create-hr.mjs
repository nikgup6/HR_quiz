// Create or reset an HR account.
//   DATABASE_URL=postgres://... npm run create-hr -- hr@company.com "Strong-Passw0rd" "Priya Sharma"
import { neon } from '@neondatabase/serverless';
import { hashPassword } from '../api/_lib/auth.js';
import { ensureSchema } from '../api/_lib/db.js';

const [email, password, name = 'HR'] = process.argv.slice(2);
if (!email || !password) {
  console.error('Usage: npm run create-hr -- <email> <password> [name]');
  process.exit(1);
}
if (password.length < 10) {
  console.error('Use a password of at least 10 characters.');
  process.exit(1);
}
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.error('Set DATABASE_URL to your Neon connection string first.');
  process.exit(1);
}

await ensureSchema();
const sql = neon(url);
await sql.query(
  `INSERT INTO hr_users (email, name, password_hash) VALUES ($1, $2, $3)
   ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash`,
  [email.trim().toLowerCase(), name, await hashPassword(password)],
);
console.log(`HR account ready: ${email.trim().toLowerCase()}`);

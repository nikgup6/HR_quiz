import { INSTRUMENT } from './model.js';
import { $, api, esc } from './ui.js';

const params = new URLSearchParams(location.search);
// Only allow same-site HR paths as a post-login destination.
const next = /^\/hr\/[\w/?=&.-]*$/.test(params.get('next') || '') ? params.get('next') : '/hr/dashboard';

// Already signed in? Go straight through.
api('/api/auth').then(() => location.replace(next)).catch(() => {});

const steps = INSTRUMENT.workflow.replace(/^WORKFLOW:\s*/, '').replace(/\.$/, '').split(/\s*→\s*/);
$('[data-workflow]').innerHTML = steps.map((s) => `<li>${esc(s.charAt(0).toUpperCase() + s.slice(1))}</li>`).join('');

const form = $('[data-login]');
const errBox = $('[data-login-error]');
const btn = $('.login-btn', form);

$('[data-toggle-pw]').addEventListener('click', (e) => {
  const input = form.elements.password;
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  e.currentTarget.textContent = show ? 'Hide' : 'Show';
  e.currentTarget.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errBox.hidden = true;
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  if (!email || !password) {
    errBox.textContent = 'Enter your email and password.';
    errBox.hidden = false;
    return;
  }
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  try {
    await api('/api/auth', { method: 'POST', body: { email, password } });
    location.replace(next);
  } catch (err) {
    errBox.textContent = err.status ? err.message : 'Could not reach the server. Please try again.';
    errBox.hidden = false;
    btn.disabled = false;
    btn.textContent = 'Sign in';
    form.elements.password.select();
  }
});

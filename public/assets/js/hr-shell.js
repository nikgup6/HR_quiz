// Shared HR chrome: session guard, top bar, sign out.
import { $, api, esc, initials } from './ui.js';

export async function requireSession() {
  try {
    const { user } = await api('/api/auth');
    renderShell(user);
    return user;
  } catch {
    const next = encodeURIComponent(location.pathname + location.search);
    location.replace(`/hr/?next=${next}`);
    return new Promise(() => {}); // halt page boot while redirecting
  }
}

function renderShell(user) {
  const page = document.body.dataset.page;
  const link = (href, key, label) =>
    `<a href="${href}"${page === key ? ' aria-current="page"' : ''}>${label}</a>`;
  $('[data-shell]').innerHTML = `
    <div class="wrap">
      <a class="brand" href="/hr/dashboard">
        <span class="brand-mark">Zinnov<span>.</span></span>
        <span class="brand-sub">Panel workspace</span>
      </a>
      <nav class="nav" aria-label="Primary">
        ${link('/hr/dashboard', 'dashboard', 'Candidates')}
        ${link('/hr/framework', 'framework', 'Framework')}
      </nav>
      <div class="spacer"></div>
      <div class="who">
        <span class="who-name">${esc(user.name || user.email)}</span>
        <span class="avatar" title="${esc(user.email)}">${esc(initials(user.name || user.email))}</span>
        <button class="btn btn-quiet btn-sm" type="button" data-signout>Sign out</button>
      </div>
    </div>`;
  $('[data-signout]').addEventListener('click', async () => {
    await api('/api/auth', { method: 'DELETE' }).catch(() => {});
    location.replace('/hr/');
  });
}

// apps/mcp-oauth-consent/consent.js
//
// OAuth 2.1 consent page for the Vector MCP server. Supabase Auth redirects
// here with ?authorization_id=...; the user signs in (or up), reviews the
// requesting client, and approves or denies.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.4';

// Local dev defaults. For a cloud deploy, swap these for your project's URL and
// publishable (anon) key, and update connect-src in vercel.json to match.
const SUPABASE_URL = 'http://127.0.0.1:55221';
const SUPABASE_ANON_KEY = '<SUPABASE_ANON_KEY>';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const $ = (id) => document.getElementById(id);
const authorizationId = new URLSearchParams(location.search).get('authorization_id');

function show(section) {
  for (const id of ['login', 'consent']) $(id).hidden = id !== section;
}
function setStatus(text) {
  $('status').textContent = text ?? '';
}
function setBusy(busy) {
  for (const id of ['signin-btn', 'signup-btn', 'approve-btn', 'deny-btn']) $(id).disabled = busy;
}
function redirectTo(url) {
  const target = new URL(url);
  if (target.protocol !== 'https:' && target.protocol !== 'http:') {
    throw new Error(`refusing to redirect to a ${target.protocol} URL`);
  }
  location.href = target.href;
}

async function loadConsent() {
  setStatus('Loading…');
  const { data: sessionData } = await supabase.auth.getSession();
  $('who-email').textContent = sessionData.session?.user?.email ?? 'unknown';
  const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
  if (error) {
    setStatus(`Could not load the request: ${error.message}. Restart the connection from your MCP client.`);
    show(null);
    return;
  }
  // Already-consented requests come back as a bare redirect.
  if (!('authorization_id' in data)) {
    redirectTo(data.redirect_url);
    return;
  }
  setStatus('');
  $('client-name').textContent = data.client?.name ?? 'An application';
  const list = $('scopes');
  const scopes = (data.scope ?? '').split(' ').filter(Boolean);
  list.replaceChildren();
  for (const s of scopes.length ? scopes : ['Access your account']) {
    const li = document.createElement('li');
    li.textContent = s;
    list.appendChild(li);
  }
  show('consent');
}

async function decide(decision) {
  $('consent-error').textContent = '';
  setBusy(true);
  const { data, error } =
    decision === 'approve'
      ? await supabase.auth.oauth.approveAuthorization(authorizationId, { skipBrowserRedirect: true })
      : await supabase.auth.oauth.denyAuthorization(authorizationId, { skipBrowserRedirect: true });
  if (error) {
    setBusy(false);
    $('consent-error').textContent = error.message;
    return;
  }
  try {
    redirectTo(data.redirect_url);
  } catch (e) {
    setBusy(false);
    $('consent-error').textContent = String(e);
  }
}

$('auth-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('auth-error').textContent = '';
  setBusy(true);
  const { error } = await supabase.auth.signInWithPassword({
    email: $('email').value,
    password: $('password').value,
  });
  setBusy(false);
  if (error) {
    $('auth-error').textContent = error.message;
    return;
  }
  show(null);
  await loadConsent();
});

$('signup-btn').addEventListener('click', async () => {
  $('auth-error').textContent = '';
  if (!$('auth-form').reportValidity()) return;
  setBusy(true);
  const { data, error } = await supabase.auth.signUp({
    email: $('email').value,
    password: $('password').value,
  });
  setBusy(false);
  if (error) {
    $('auth-error').textContent = error.message;
    return;
  }
  if (!data.session) {
    show(null);
    setStatus('Account created — confirm your email, then restart the connection from Claude.');
    return;
  }
  show(null);
  await loadConsent();
});

$('signout-link').addEventListener('click', async (event) => {
  event.preventDefault();
  await supabase.auth.signOut();
  setStatus('Sign in to continue.');
  show('login');
});

$('approve-btn').addEventListener('click', () => decide('approve'));
$('deny-btn').addEventListener('click', () => decide('deny'));

async function main() {
  if (SUPABASE_ANON_KEY.startsWith('<')) {
    setStatus('This page is not configured yet (missing publishable key).');
    return;
  }
  if (!authorizationId) {
    setStatus('Missing authorization_id — start the connection from your MCP client.');
    return;
  }
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    setStatus('Sign in to continue.');
    show('login');
    return;
  }
  await loadConsent();
}

main();

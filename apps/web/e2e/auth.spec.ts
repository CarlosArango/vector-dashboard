import { expect, test } from '@playwright/test';

const MAILPIT = 'http://127.0.0.1:55224';

/** Polls Mailpit for the newest message to `email` and returns the magic link. */
async function fetchMagicLink(email: string): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const list = await fetch(`${MAILPIT}/api/v1/messages?limit=5`).then((r) => r.json());
    const msg = list.messages?.find((m: { To: { Address: string }[] }) =>
      m.To?.some((t) => t.Address === email),
    );
    if (msg) {
      const full = await fetch(`${MAILPIT}/api/v1/message/${msg.ID}`).then((r) => r.json());
      const body: string = full.HTML || full.Text || '';
      const match = body.match(/https?:\/\/[^\s"'<>]*verify[^\s"'<>]*/);
      if (match) return match[0].replace(/&amp;/g, '&');
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('magic link not received');
}

test('unauthenticated users are redirected to login', async ({ page }) => {
  await page.goto('/projects');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Sign in to Vector' })).toBeVisible();
});

test('magic-link sign-in lands on the projects dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email address' }).fill('jordan@acme.co');
  await page.getByRole('button', { name: 'Continue with email' }).click();
  await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible();

  const link = await fetchMagicLink('jordan@acme.co');
  await page.goto(link);
  await expect(page).toHaveURL(/\/projects/);
  await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
  await expect(page.getByText('Atlas Web App').first()).toBeVisible();
});

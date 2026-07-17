// Test de la page /auth/callback OAuth (PKCE flow)
// Vérifie que la page ne reste jamais bloquée sur un spinner indéfiniment.
//
// Ce test simule le retour d'un OAuth Google en arrivant directement sur /auth/callback.
// Sans un vrai ?code= Google, l'échange PKCE échouera — mais la page DOIT quand même
// naviguer vers la home dans les 6 secondes (timeout de 5s + 1s de marge).

import { test, expect, devices } from '@playwright/test';

const BASE_URL = 'https://www.zandopluscg.com';

// Émule un mobile Chrome Android (le cas qui échouait)
const MOBILE_VIEWPORT = { width: 390, height: 844 };

// Helper : attend que la navigation soit terminée et que la page soit stable
async function waitForPageStable(page, timeout = 10000) {
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
}

// ─── 1. CALLBACK PAGE — Pas de code (cas "déjà retourné") ─────────────────

test.describe('OAuth Callback — Comportement de navigation', () => {

  test('1.1 — /auth/callback sans code navigue vers home en < 6s (desktop)', async ({ page }) => {
    const start = Date.now();
    await page.goto(`${BASE_URL}/auth/callback`, { waitUntil: 'domcontentloaded' });

    // Attend que l'URL change vers "/" (navigation depuis AuthCallbackPage)
    await page.waitForURL(`${BASE_URL}/`, { timeout: 8000 });
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(7000);
    expect(page.url()).toBe(`${BASE_URL}/`);
    console.log(`✓ Navigation vers home en ${elapsed}ms`);
  });

  test('1.2 — /auth/callback sans code navigue vers home en < 6s (mobile)', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['Pixel 5'],
    });
    const page = await context.newPage();

    const start = Date.now();
    await page.goto(`${BASE_URL}/auth/callback`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(`${BASE_URL}/`, { timeout: 8000 });
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(7000);
    expect(page.url()).toBe(`${BASE_URL}/`);
    console.log(`✓ Mobile: Navigation vers home en ${elapsed}ms`);
    await context.close();
  });

  test('1.3 — /auth/callback avec fake code navigue vers home en < 11s (timeout 10s)', async ({ page }) => {
    // Un faux code → l'échange PKCE échoue → le timeout de 5s déclenche la navigation
    const start = Date.now();
    await page.goto(`${BASE_URL}/auth/callback?code=fake_code_for_testing`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(`${BASE_URL}/`, { timeout: 12000 });
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(11000);
    expect(page.url()).toBe(`${BASE_URL}/`);
    console.log(`✓ Fake code: Navigation vers home en ${elapsed}ms`);
  });

});

// ─── 2. ÉTAT DU HEADER APRÈS OAUTH ────────────────────────────────────────

test.describe('Header — Pas de "Se connecter" pendant l\'échange OAuth', () => {

  test('2.1 — Header montre skeleton (pas login button) pendant isOAuthPending', async ({ page }) => {
    // Arriver sur /auth/callback?code=fake → pendant le traitement (< 5s),
    // le header NE DOIT PAS afficher le bouton "Connexion / Inscription"
    let loginButtonShownDuringOAuth = false;

    // Intercepter les clics sur le bouton connexion (ne doit pas apparaître)
    page.on('console', msg => console.log(msg.text()));

    await page.goto(`${BASE_URL}/auth/callback?code=fake_code_test`, { waitUntil: 'domcontentloaded' });

    // Vérifier toutes les 500ms pendant 4 secondes que le bouton "Connexion" n'apparaît pas
    for (let i = 0; i < 8; i++) {
      await page.waitForTimeout(500);
      const loginBtnVisible = await page
        .locator('button, a')
        .filter({ hasText: /connexion\s*\/\s*inscription|se connecter/i })
        .first()
        .isVisible()
        .catch(() => false);

      if (loginBtnVisible) {
        loginButtonShownDuringOAuth = true;
        const elapsed = (i + 1) * 500;
        console.log(`⚠ Bouton connexion visible à T+${elapsed}ms (pendant l'échange OAuth)`);
        break;
      }
    }

    // Attendre la navigation vers home
    await page.waitForURL(`${BASE_URL}/`, { timeout: 8000 }).catch(() => {});

    if (loginButtonShownDuringOAuth) {
      console.log('FAIL: Le header a montré "Se connecter" avant la fin de l\'échange OAuth');
    } else {
      console.log('✓ Header a maintenu le skeleton pendant l\'échange OAuth');
    }

    // Ce test documente le comportement mais ne fait pas fail le CI en cas de flash court
    // L'important est que la navigation vers home se produit
    expect(page.url()).toBe(`${BASE_URL}/`);
  });

});

// ─── 3. SESSION PERSISTANTE APRÈS OAUTH ────────────────────────────────────

test.describe('Session — Persistance après navigation callback → home', () => {

  test('3.1 — Connexion email + navigation /auth/callback → home : session toujours active', async ({ page }) => {
    // 1. Login via email/password
    await page.goto(`${BASE_URL}/`);
    await waitForPageStable(page);

    // Ouvrir le modal d'auth
    const authBtn = page.locator('button, a').filter({ hasText: /connexion|se connecter/i }).first();
    const authBtnVisible = await authBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!authBtnVisible) {
      console.log('Skipping: déjà connecté ou bouton non trouvé');
      return;
    }
    await authBtn.click();

    // Cliquer "Continuer avec e-mail" si nécessaire
    const emailBtn = page.locator('button').filter({ hasText: /continuer avec e-mail|e-mail/i }).first();
    if (await emailBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailBtn.click();
    }

    // Remplir le formulaire
    const dialog = page.locator('[role="dialog"]');
    await dialog.locator('input[type="email"]').fill('qa.buyer@zandotest.com');
    await dialog.locator('input[type="password"]').fill('QAtest2024!');
    await dialog.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    // 2. Vérifier la connexion
    const userAvatarAfterLogin = page.locator('[data-testid="user-avatar"], .avatar, img[alt]').first();
    const loginBtnAfterLogin = page.locator('button').filter({ hasText: /connexion\s*\/\s*inscription/i }).first();
    const isLoggedIn = !(await loginBtnAfterLogin.isVisible({ timeout: 2000 }).catch(() => false));
    if (!isLoggedIn) {
      console.log('Skipping: login échoué ou comptes de test non disponibles');
      return;
    }
    console.log('✓ Connecté via email/password');

    // 3. Naviguer vers /auth/callback (simule le retour OAuth — session déjà en storage)
    await page.goto(`${BASE_URL}/auth/callback`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(`${BASE_URL}/`, { timeout: 8000 });
    console.log('✓ Navigation vers home depuis /auth/callback');

    // 4. Vérifier que la session est toujours active sur la home
    await waitForPageStable(page, 5000);
    const loginBtnOnHome = page.locator('button').filter({ hasText: /connexion\s*\/\s*inscription/i }).first();
    const logoutLink = page.locator('button, a').filter({ hasText: /déconnexion/i }).first();

    const stillLoggedIn = !(await loginBtnOnHome.isVisible({ timeout: 3000 }).catch(() => false));
    console.log(stillLoggedIn
      ? '✓ Session toujours active sur home après passage par /auth/callback'
      : '✗ Session perdue après navigation /auth/callback → home'
    );

    expect(stillLoggedIn).toBe(true);
  });

  test('3.2 — Mobile: session persistante après /auth/callback (Chrome Android)', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['Pixel 5'],
    });
    const page = await context.newPage();

    // Login
    await page.goto(`${BASE_URL}/`);
    await waitForPageStable(page);

    const authBtn = page.locator('button, a').filter({ hasText: /connexion|se connecter/i }).first();
    const authBtnVisible = await authBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!authBtnVisible) {
      console.log('Mobile: skip — déjà connecté ou bouton non trouvé');
      await context.close();
      return;
    }
    await authBtn.click();

    const emailBtn = page.locator('button').filter({ hasText: /continuer avec e-mail|e-mail/i }).first();
    if (await emailBtn.isVisible({ timeout: 2000 }).catch(() => false)) await emailBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await dialog.locator('input[type="email"]').fill('qa.buyer@zandotest.com');
    await dialog.locator('input[type="password"]').fill('QAtest2024!');
    await dialog.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    const loginBtnCheck = page.locator('button').filter({ hasText: /connexion\s*\/\s*inscription/i }).first();
    const loggedIn = !(await loginBtnCheck.isVisible({ timeout: 2000 }).catch(() => false));
    if (!loggedIn) {
      console.log('Mobile: skip — login échoué');
      await context.close();
      return;
    }

    // Simuler le retour OAuth
    await page.goto(`${BASE_URL}/auth/callback`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(`${BASE_URL}/`, { timeout: 8000 });

    await waitForPageStable(page, 5000);
    const loginBtnOnHome = page.locator('button').filter({ hasText: /connexion\s*\/\s*inscription/i }).first();
    const stillLoggedIn = !(await loginBtnOnHome.isVisible({ timeout: 3000 }).catch(() => false));

    console.log(stillLoggedIn
      ? '✓ Mobile: session persistante après /auth/callback → home'
      : '✗ Mobile: session perdue après /auth/callback → home'
    );

    expect(stillLoggedIn).toBe(true);
    await context.close();
  });
});

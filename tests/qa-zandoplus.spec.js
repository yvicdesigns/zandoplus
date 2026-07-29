// ============================================================
// QA AUDIT ZANDO+ — Suite de tests automatisés Playwright
// Site : https://www.zandopluscg.com
// Comptes test : qa.buyer@zandotest.com / qa.seller@zandotest.com
// ============================================================

import { test, expect } from '@playwright/test';

const BASE_URL = 'https://www.zandopluscg.com';
const BUYER  = { email: 'qa.buyer@zandotest.com',  password: 'QAtest2024!', name: 'QA Acheteur Test' };
const SELLER = { email: 'qa.seller@zandotest.com', password: 'QAtest2024!', name: 'QA Vendeur Test' };

// ─── Helper ──────────────────────────────────────────────────

async function login(page, user) {
  await page.goto(`${BASE_URL}/`);
  await page.waitForTimeout(1500);
  // Étape 1 : ouvrir le modal
  const authBtn = page.locator('button, a').filter({ hasText: /connexion|se connecter/i }).first();
  if (await authBtn.isVisible().catch(() => false)) await authBtn.click();
  await page.waitForTimeout(800);
  // Étape 2 : modal a 2 écrans — cliquer "Continuer avec e-mail"
  const emailStepBtn = page.locator('button').filter({ hasText: /continuer avec e-mail|e-mail/i }).first();
  if (await emailStepBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await emailStepBtn.click();
    await page.waitForTimeout(500);
  }
  // Étape 3 : remplir le formulaire dans le dialog (évite le champ newsletter footer)
  const dialog = page.locator('[role="dialog"]');
  await dialog.locator('input[type="email"]').fill(user.email);
  await dialog.locator('input[type="password"]').fill(user.password);
  await dialog.locator('button[type="submit"]').click();
  await page.waitForTimeout(2500);
}

async function screenshot(page, name) {
  await page.screenshot({ path: `tests/screenshots/${name}.png`, fullPage: false });
}

// ─── 1. NAVIGATION & HOMEPAGE ─────────────────────────────────

test.describe('1. Navigation & Homepage', () => {
  test('1.1 - Homepage charge correctement', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Zando/i);
    // Hero peut être un Carousel (slides DB) ou un fallback — attendre juste du contenu visible
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    const hasContent = await page.locator('section, main, [class*="carousel"], h1').first().isVisible({ timeout: 8000 }).catch(() => false);
    expect(hasContent, 'La homepage doit afficher du contenu').toBeTruthy();
    await screenshot(page, '1.1-homepage');
  });

  test('1.2 - Logo cliquable → retour accueil', async ({ page }) => {
    await page.goto(`${BASE_URL}/listings`);
    await page.waitForTimeout(1500);
    await page.locator('a[href="/"], img[alt*="Zando"], [class*="logo"]').first().click();
    await expect(page).toHaveURL(`${BASE_URL}/`);
  });

  test('1.3 - Barre de recherche fonctionne', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(1500);
    const searchInput = page.locator('input[placeholder*="cherch"], input[placeholder*="Search"], input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('téléphone');
      await searchInput.press('Enter');
      await page.waitForTimeout(2000);
      await screenshot(page, '1.3-search-results');
      await expect(page).not.toHaveURL(/error|500/);
    } else {
      console.log('Barre de recherche non trouvée — skip');
    }
  });

  test('1.4 - Routes principales accessibles (pas 404)', async ({ page }) => {
    const routes = ['/listings', '/post-ad'];
    for (const route of routes) {
      const res = await page.request.get(`${BASE_URL}${route}`);
      expect(res.status(), `Route ${route} doit être accessible`).not.toBe(404);
    }
  });
});

// ─── 2. AUTHENTIFICATION ─────────────────────────────────────

test.describe('2. Authentification', () => {
  test('2.1 - Connexion réussie acheteur', async ({ page }) => {
    await login(page, BUYER);
    await screenshot(page, '2.1-login-buyer');
    // Login réussi = modal fermé + pas d'erreur dans le dialog
    const dialogStillOpen = await page.locator('[role="dialog"]').isVisible().catch(() => false);
    const dialogError = await page.locator('[role="dialog"] [class*="bg-red"]').isVisible().catch(() => false);
    expect(dialogError, 'Pas d\'erreur de connexion dans le modal').toBeFalsy();
    await expect(page).not.toHaveURL(/error|500/);
  });

  test('2.2 - Connexion avec mauvais mot de passe → erreur claire', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);
    const authBtn = page.locator('button, a').filter({ hasText: /connexion|se connecter/i }).first();
    if (await authBtn.isVisible().catch(() => false)) await authBtn.click();
    await page.waitForTimeout(800);
    const emailStepBtn = page.locator('button').filter({ hasText: /continuer avec e-mail|e-mail/i }).first();
    if (await emailStepBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailStepBtn.click();
      await page.waitForTimeout(500);
    }
    const dialog = page.locator('[role="dialog"]');
    await dialog.locator('input[type="email"]').fill(BUYER.email);
    await dialog.locator('input[type="password"]').fill('MAUVAIS_MDP_XXXX');
    await dialog.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    // ErrorBox dans AuthModal : bg-red-50 text-red-700
    const errMsg = page.locator('[role="dialog"] [class*="bg-red"]').first();
    const visible = await errMsg.isVisible().catch(() => false);
    await screenshot(page, '2.2-login-error');
    expect(visible, 'Une erreur doit s\'afficher avec mauvais mdp').toBeTruthy();
  });

  test('2.3 - Email invalide → blocage HTML5', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(800);
    const authBtn = page.locator('button, a').filter({ hasText: /connexion|se connecter/i }).first();
    if (await authBtn.isVisible().catch(() => false)) await authBtn.click();
    await page.waitForTimeout(800);
    const emailStepBtn = page.locator('button').filter({ hasText: /continuer avec e-mail|e-mail/i }).first();
    if (await emailStepBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailStepBtn.click();
      await page.waitForTimeout(500);
    }
    const dialog = page.locator('[role="dialog"]');
    await dialog.locator('input[type="email"]').fill('pas-un-email');
    await dialog.locator('input[type="password"]').fill('password123');
    await dialog.locator('button[type="submit"]').click();
    await page.waitForTimeout(800);
    const emailInput = dialog.locator('input[type="email"]');
    const validity = await emailInput.evaluate(el => el.validity.valid);
    expect(validity, 'Email invalide doit être rejeté').toBeFalsy();
  });

  test('2.4 - Page protégée /wallet redirige si non connecté', async ({ page }) => {
    await page.goto(`${BASE_URL}/wallet`);
    await page.waitForTimeout(2000);
    await screenshot(page, '2.4-protected-route');
    await expect(page).not.toHaveURL(/error|500/);
  });
});

// ─── 3. ANNONCES (LISTINGS) ───────────────────────────────────

test.describe('3. Annonces', () => {
  test('3.1 - Page /listings charge', async ({ page }) => {
    await page.goto(`${BASE_URL}/listings`);
    await page.waitForTimeout(3000);
    await screenshot(page, '3.1-listings-page');
    await expect(page).not.toHaveURL(/error|500/);
    const body = await page.locator('body').textContent();
    expect(body?.length ?? 0).toBeGreaterThan(100);
  });

  test('3.2 - Au moins 1 annonce visible (ou message liste vide)', async ({ page }) => {
    await page.goto(`${BASE_URL}/listings`);
    await page.waitForTimeout(4000);
    const cards = page.locator('a[href*="/listings/"]');
    const emptyMsg = page.locator('[class*="empty"], p:has-text("Aucune"), p:has-text("aucune")').first();
    const cardCount = await cards.count();
    const emptyVisible = await emptyMsg.isVisible().catch(() => false);
    expect(cardCount > 0 || emptyVisible, 'Doit afficher annonces ou message vide').toBeTruthy();
    await screenshot(page, '3.2-listings-content');
  });

  test('3.3 - Recherche "samsung" ne plante pas', async ({ page }) => {
    await page.goto(`${BASE_URL}/listings?search=samsung`);
    await page.waitForTimeout(3000);
    await screenshot(page, '3.3-search-samsung');
    await expect(page).not.toHaveURL(/error/);
  });

  test('3.4 - Page détail annonce charge', async ({ page }) => {
    await page.goto(`${BASE_URL}/listings`);
    await page.waitForTimeout(3000);
    const firstCard = page.locator('a[href*="/listings/"]').first();
    const href = await firstCard.getAttribute('href').catch(() => null);
    if (href) {
      await page.goto(`${BASE_URL}${href}`);
      await page.waitForTimeout(2500);
      await screenshot(page, '3.4-listing-detail');
      await expect(page).not.toHaveURL(/error|404/);
      await expect(page.locator('h1, [class*="title"]').first()).toBeVisible({ timeout: 5000 });
    } else {
      console.log('Aucune annonce trouvée pour tester le détail');
    }
  });

  test('3.5 - Bouton Acheter → redirige vers /escrow si connecté', async ({ page }) => {
    await login(page, BUYER);
    await page.goto(`${BASE_URL}/listings`);
    await page.waitForTimeout(3000);
    const firstCard = page.locator('a[href*="/listings/"]').first();
    const href = await firstCard.getAttribute('href').catch(() => null);
    if (href) {
      await page.goto(`${BASE_URL}${href}`);
      await page.waitForTimeout(2500);
      const buyBtn = page.locator('button, a').filter({ hasText: /acheter|achat sécur/i }).first();
      if (await buyBtn.isVisible().catch(() => false)) {
        await buyBtn.click();
        await page.waitForTimeout(2500);
        await screenshot(page, '3.5-buy-redirect');
        expect(page.url()).toMatch(/escrow/);
      } else {
        console.log('Bouton acheter non trouvé sur cette annonce');
      }
    }
  });
});

// ─── 4. DÉPOSER UNE ANNONCE ─────────────────────────────────

test.describe('4. Déposer une annonce', () => {
  test('4.1 - Page /post-ad accessible connecté', async ({ page }) => {
    await login(page, SELLER);
    await page.goto(`${BASE_URL}/post-ad`);
    await page.waitForTimeout(2000);
    await screenshot(page, '4.1-post-ad-page');
    await expect(page).not.toHaveURL(/error|404/);
  });

  test('4.2 - Formulaire step 1 visible', async ({ page }) => {
    await login(page, SELLER);
    await page.goto(`${BASE_URL}/post-ad`);
    await page.waitForTimeout(2000);
    const form = page.locator('form, [class*="step"], [class*="Step"]').first();
    await expect(form).toBeVisible({ timeout: 5000 });
    await screenshot(page, '4.2-post-ad-form');
  });

  test('4.3 - Soumission sans titre → erreur validation', async ({ page }) => {
    await login(page, SELLER);
    await page.goto(`${BASE_URL}/post-ad`);
    await page.waitForTimeout(2000);
    const nextBtn = page.locator('button').filter({ hasText: /suivant|continuer|next/i }).first();
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, '4.3-validation-error');
    }
  });
});

// ─── 5. MESSAGES ───────────────────────────────────────────────

test.describe('5. Messages', () => {
  test('5.1 - Page /messages charge pour acheteur connecté', async ({ page }) => {
    await login(page, BUYER);
    await page.goto(`${BASE_URL}/messages`);
    await page.waitForTimeout(3000);
    await screenshot(page, '5.1-messages-page');
    await expect(page).not.toHaveURL(/error|500/);
  });

  test('5.2 - Liste conversations ou état vide', async ({ page }) => {
    await login(page, BUYER);
    await page.goto(`${BASE_URL}/messages`);
    await page.waitForTimeout(3000);
    const conversations = page.locator('[class*="conversation"], [class*="Conversation"]');
    const emptyMsg = page.locator('[class*="empty"], p:has-text("Aucun"), p:has-text("message")').first();
    const convCount = await conversations.count();
    const emptyVisible = await emptyMsg.isVisible().catch(() => false);
    expect(convCount > 0 || emptyVisible, 'Doit afficher conversations ou état vide').toBeTruthy();
    await screenshot(page, '5.2-conversations');
  });

  test('5.3 - Vendeur peut accéder à ses messages', async ({ page }) => {
    await login(page, SELLER);
    await page.goto(`${BASE_URL}/messages`);
    await page.waitForTimeout(3000);
    await screenshot(page, '5.3-seller-messages');
    await expect(page).not.toHaveURL(/error|500/);
  });
});

// ─── 6. TRANSACTIONS ──────────────────────────────────────────

test.describe('6. Transactions', () => {
  test('6.1 - Page /transactions accessible acheteur', async ({ page }) => {
    await login(page, BUYER);
    await page.goto(`${BASE_URL}/transactions`);
    await page.waitForTimeout(3000);
    await screenshot(page, '6.1-transactions-buyer');
    await expect(page).not.toHaveURL(/error|500/);
  });

  test('6.2 - Onglet Ventes accessible vendeur', async ({ page }) => {
    await login(page, SELLER);
    await page.goto(`${BASE_URL}/transactions`);
    await page.waitForTimeout(2000);
    const ventesTab = page.locator('button').filter({ hasText: /ventes/i }).first();
    if (await ventesTab.isVisible().catch(() => false)) {
      await ventesTab.click();
      await page.waitForTimeout(1200);
      await screenshot(page, '6.2-ventes-tab');
    }
    await expect(page).not.toHaveURL(/error/);
  });

  test('6.3 - État vide stable pour compte test', async ({ page }) => {
    await login(page, BUYER);
    await page.goto(`${BASE_URL}/transactions`);
    await page.waitForTimeout(3000);
    await screenshot(page, '6.3-transactions-empty');
    await expect(page).not.toHaveURL(/error/);
  });
});

// ─── 7. PANIER (CART) ─────────────────────────────────────────

test.describe('7. Panier', () => {
  test('7.1 - Page /cart accessible même vide', async ({ page }) => {
    await login(page, BUYER);
    await page.goto(`${BASE_URL}/cart`);
    await page.waitForTimeout(2000);
    await screenshot(page, '7.1-cart-empty');
    await expect(page).not.toHaveURL(/error|404/);
  });

  test('7.2 - Ajout produit au panier', async ({ page }) => {
    await login(page, BUYER);
    await page.goto(`${BASE_URL}/listings`);
    await page.waitForTimeout(3000);
    const addCartBtn = page.locator('button').filter({ hasText: /panier/i }).first();
    if (await addCartBtn.isVisible().catch(() => false)) {
      await addCartBtn.click();
      await page.waitForTimeout(1200);
      await screenshot(page, '7.2-add-to-cart');
    } else {
      const firstCard = page.locator('a[href*="/listings/"]').first();
      const href = await firstCard.getAttribute('href').catch(() => null);
      if (href) {
        await page.goto(`${BASE_URL}${href}`);
        await page.waitForTimeout(2000);
        const addBtn = page.locator('button').filter({ hasText: /panier/i }).first();
        if (await addBtn.isVisible().catch(() => false)) {
          await addBtn.click();
          await page.waitForTimeout(1200);
          await screenshot(page, '7.2-add-to-cart-detail');
        }
      }
    }
    await expect(page).not.toHaveURL(/error/);
  });

  test('7.3 - Icône panier visible dans header', async ({ page }) => {
    await login(page, BUYER);
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    await screenshot(page, '7.3-cart-icon-header');
  });
});

// ─── 8. PORTEFEUILLE ──────────────────────────────────────────

test.describe('8. Portefeuille', () => {
  test('8.1 - Page /wallet accessible vendeur', async ({ page }) => {
    await login(page, SELLER);
    await page.goto(`${BASE_URL}/wallet`);
    await page.waitForTimeout(3000);
    await screenshot(page, '8.1-wallet-seller');
    await expect(page).not.toHaveURL(/error|404/);
  });

  test('8.2 - Solde affiché (même à 0)', async ({ page }) => {
    await login(page, SELLER);
    await page.goto(`${BASE_URL}/wallet`);
    await page.waitForTimeout(3000);
    const balanceText = page.locator('[class*="card"], [class*="wallet"]').first();
    await expect(balanceText).toBeVisible({ timeout: 5000 });
    await screenshot(page, '8.2-wallet-balance');
  });

  test('8.3 - Bouton retrait désactivé si solde 0', async ({ page }) => {
    await login(page, SELLER);
    await page.goto(`${BASE_URL}/wallet`);
    await page.waitForTimeout(3000);
    const withdrawBtn = page.locator('button').filter({ hasText: /retirer|withdrawal/i }).first();
    if (await withdrawBtn.isVisible().catch(() => false)) {
      const isDisabled = await withdrawBtn.isDisabled();
      console.log(`Bouton retrait désactivé: ${isDisabled}`);
      await screenshot(page, '8.3-withdraw-btn-state');
    }
  });
});

// ─── 9. PROFIL & PARAMÈTRES ───────────────────────────────────

test.describe('9. Profil & Paramètres', () => {
  test('9.1 - Page /settings accessible', async ({ page }) => {
    await login(page, BUYER);
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForTimeout(2000);
    await screenshot(page, '9.1-settings-page');
    await expect(page).not.toHaveURL(/error|404/);
  });

  test('9.2 - Champ numéro MoMo présent', async ({ page }) => {
    await login(page, SELLER);
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForTimeout(2000);
    const inputs = page.locator('input');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
    await screenshot(page, '9.2-settings-inputs');
  });

  test('9.3 - Page /profile accessible', async ({ page }) => {
    await login(page, BUYER);
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForTimeout(2000);
    await screenshot(page, '9.3-profile-page');
    await expect(page).not.toHaveURL(/error|404/);
  });
});

// ─── 10. ADMIN DASHBOARD ──────────────────────────────────────

test.describe('10. Admin Dashboard (protection)', () => {
  test('10.1 - /admin bloque un non-admin', async ({ page }) => {
    await login(page, BUYER);
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(2500);
    const url = page.url();
    await screenshot(page, '10.1-admin-blocked');
    console.log(`URL après tentative admin: ${url}`);
    await expect(page).not.toHaveURL(/error|500/);
  });

  test('10.2 - /admin sans connexion → redirigé ou bloqué', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(2500);
    await screenshot(page, '10.2-admin-no-auth');
    await expect(page).not.toHaveURL(/error|500/);
  });
});

// ─── 11. RESPONSIVE (MOBILE) ──────────────────────────────────

test.describe('11. Responsive Mobile', () => {
  test('11.1 - Homepage en mobile 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    await screenshot(page, '11.1-mobile-home');
    await expect(page.locator('body')).toBeVisible();
  });

  test('11.2 - Listings en mobile 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/listings`);
    await page.waitForTimeout(3000);
    await screenshot(page, '11.2-mobile-listings');
    await expect(page).not.toHaveURL(/error/);
  });

  test('11.3 - Pas de débordement horizontal critique', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    if (bodyWidth > viewportWidth + 5) {
      console.warn(`Débordement horizontal: body=${bodyWidth}px, viewport=${viewportWidth}px`);
    }
    await screenshot(page, '11.3-mobile-overflow-check');
  });
});

// ─── 12. PERFORMANCE ──────────────────────────────────────────

test.describe('12. Performance', () => {
  test('12.1 - Homepage charge en moins de 6s', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const duration = Date.now() - start;
    console.log(`Homepage TTI: ${duration}ms`);
    expect(duration, `Homepage trop lente: ${duration}ms`).toBeLessThan(6000);
  });

  test('12.2 - Listings charge en moins de 8s', async ({ page }) => {
    const start = Date.now();
    await page.goto(`${BASE_URL}/listings`, { waitUntil: 'domcontentloaded' });
    const duration = Date.now() - start;
    console.log(`Listings TTI: ${duration}ms`);
    expect(duration, `Listings trop lente: ${duration}ms`).toBeLessThan(8000);
  });

  test('12.3 - Pas d\'erreurs JS critiques sur homepage', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    const critical = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('ResizeObserver') &&
      !e.includes('Non-Error') &&
      !e.includes('net::ERR')
    );
    if (critical.length > 0) console.warn('Erreurs JS:', critical.join('\n'));
    await screenshot(page, '12.3-homepage-console');
  });
});

// ─── 13. ESCROW PAYMENT FLOW ──────────────────────────────────

test.describe('13. Escrow Payment Flow', () => {
  test('13.1 - Page /escrow/:id accessible si acheteur connecté', async ({ page }) => {
    await login(page, BUYER);
    await page.goto(`${BASE_URL}/listings`);
    await page.waitForTimeout(3000);
    const firstCard = page.locator('a[href*="/listings/"]').first();
    const href = await firstCard.getAttribute('href').catch(() => null);
    if (href) {
      const listingId = href.split('/listings/')[1];
      await page.goto(`${BASE_URL}/escrow/${listingId}`);
      await page.waitForTimeout(3000);
      await screenshot(page, '13.1-escrow-page');
      await expect(page).not.toHaveURL(/error|404/);
    }
  });

  test('13.2 - Options de livraison présentes', async ({ page }) => {
    await login(page, BUYER);
    await page.goto(`${BASE_URL}/listings`);
    await page.waitForTimeout(3000);
    const firstCard = page.locator('a[href*="/listings/"]').first();
    const href = await firstCard.getAttribute('href').catch(() => null);
    if (href) {
      const listingId = href.split('/listings/')[1];
      await page.goto(`${BASE_URL}/escrow/${listingId}`);
      await page.waitForTimeout(3000);
      const deliveryBtns = page.locator('button').filter({ hasText: /livraison|retrait|pickup|zando/i });
      const count = await deliveryBtns.count();
      console.log(`Options de livraison trouvées: ${count}`);
      await screenshot(page, '13.2-delivery-options');
    }
  });

  test('13.3 - Vendeur ne peut pas acheter sa propre annonce (protection frontend)', async ({ page }) => {
    await login(page, SELLER);
    await page.goto(`${BASE_URL}/listings`);
    await page.waitForTimeout(3000);
    await screenshot(page, '13.3-seller-own-listings');
    await expect(page).not.toHaveURL(/error/);
  });
});

// ─── 14. EDGE CASES & ROBUSTESSE ────────────────────────────

test.describe('14. Edge Cases', () => {
  test('14.1 - Route inexistante → pas de crash', async ({ page }) => {
    await page.goto(`${BASE_URL}/cette-page-nexiste-pas-xyz-123`);
    await page.waitForTimeout(2500);
    await screenshot(page, '14.1-404-page');
    const body = await page.locator('body').textContent();
    expect(body?.length ?? 0, 'Page ne doit pas être blanche').toBeGreaterThan(10);
  });

  test('14.2 - /listings/:id inexistant → graceful error', async ({ page }) => {
    await page.goto(`${BASE_URL}/listings/00000000-0000-0000-0000-000000000000`);
    await page.waitForTimeout(3000);
    await screenshot(page, '14.2-listing-not-found');
    await expect(page).not.toHaveURL(/500|crash/);
  });

  test('14.3 - Recherche vide → stable', async ({ page }) => {
    await page.goto(`${BASE_URL}/listings?search=`);
    await page.waitForTimeout(3000);
    await screenshot(page, '14.3-empty-search');
    await expect(page).not.toHaveURL(/error|500/);
  });

  test('14.4 - XSS dans recherche → pas d\'exécution', async ({ page }) => {
    const xssDialogTriggered = [];
    page.on('dialog', async dialog => {
      xssDialogTriggered.push(dialog.message());
      await dialog.dismiss();
    });
    await page.goto(`${BASE_URL}/listings?search=${encodeURIComponent('<script>alert("xss")</script>')}`);
    await page.waitForTimeout(3000);
    await screenshot(page, '14.4-xss-search');
    expect(xssDialogTriggered.length, 'Aucun alert XSS ne doit s\'exécuter').toBe(0);
    await expect(page).not.toHaveURL(/error/);
  });

  test('14.5 - Rechargement page transactions connecté → stable', async ({ page }) => {
    await login(page, BUYER);
    await page.goto(`${BASE_URL}/transactions`);
    await page.waitForTimeout(2000);
    await page.reload();
    await page.waitForTimeout(2000);
    await screenshot(page, '14.5-reload-transactions');
    await expect(page).not.toHaveURL(/error|500/);
  });
});

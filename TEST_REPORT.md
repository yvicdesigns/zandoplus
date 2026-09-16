# Rapport de tests automatisés — Zando+ (Maestro)

**Date** : 16/09/2026
**Objectif** : valider les parcours critiques de la version 1.6.0 avant soumission App Store / Play Store, suite au gros lot de correctifs de la semaine (COD, pagination, images, etc.).
**Environnement** : Simulateur iPhone 17 (iOS 26.5), build Debug local installé directement sur le simulateur, backend = production (aucun environnement de test séparé n'existe).
**Compte utilisé** : compte QA dédié (`webmaster@zandopluscg.com`), le même que celui déjà fourni à Apple pour la revue App Store.
**Portée** : parcours critiques uniquement (option choisie), pas les 52 routes de l'app — voir "Hors périmètre" en bas.

## Résultat global : 6/6 flows réussis ✅

| # | Flow | Résultat | Durée |
|---|------|----------|-------|
| 01 | Accueil et navigation principale | ✅ Pass | 26s |
| 02 | Recherche et fiche annonce | ✅ Pass | 35s |
| 03 | Favoris (ajout/retrait) | ✅ Pass | 51s |
| 04 | Publication d'annonce — validation des champs | ✅ Pass | 1m 08s |
| 05 | Checkout — COD + Achat Sécurisé | ✅ Pass | 1m 15s |
| 06 | Profil et déconnexion | ✅ Pass | 1m 04s |

## Détail par flow

### 01 — Accueil et navigation
Chargement de l'accueil, barre de recherche visible, les 4 onglets de la navigation basse (Accueil / Annonce / Portefeuille / Compte) présents et fonctionnels dans les deux sens.

### 02 — Recherche et fiche annonce
Recherche texte fonctionne, résultats affichés, ouverture d'une fiche produit réussie avec prix et bouton d'achat visibles.

### 03 — Favoris
Connexion → ajout aux favoris → toast "Ajouté aux favoris!" confirmé → retrait → toast "Retiré des favoris" confirmé. La fonctionnalité livrée le 16/09 fonctionne correctement de bout en bout, y compris le retrait (pas seulement l'ajout).

### 04 — Publication d'annonce : validation
Soumission du formulaire vide bloquée correctement, avec les bons messages d'erreur ("La catégorie est requise.", "Au moins une photo est requise.", toast "Champs Incomplets ou Invalides"). Le garde-fou anti-publication-vide fonctionne.

### 05 — Checkout : COD + Achat Sécurisé
**Le test le plus important de cette suite.** A permis de vérifier concrètement que le bug COD corrigé le 16/09 reste corrigé :
- Écran "Payer à la livraison" atteint avec succès
- Calcul du total affiché correctement : `100 000 FCFA (article) + 1 500 FCFA (livraison) = 101 500 FCFA`, exactement comme attendu
- Écran "Acheter maintenant" (Achat Sécurisé) atteint avec succès

Le test s'arrête volontairement avant "Confirmer ma commande" pour ne créer aucune vraie commande sur une vraie annonce.

### 06 — Profil et déconnexion
Accès au profil, déconnexion effective, redirection vers l'accueil confirmée.

## Constats découverts pendant la construction des tests

Ces éléments ne sont pas des échecs de test (tous les flows passent), mais des observations réelles remontées pendant la préparation, qui valent la peine d'être connues :

### 1. Lacune d'accessibilité — bouton menu (hamburger)
Le bouton menu en haut à gauche (icône trois traits) n'a **aucun libellé d'accessibilité** (pas de `aria-label` ni texte). Un lecteur d'écran (VoiceOver) ne peut pas l'identifier. Même problème pour le bouton "+" flottant de la barre de navigation basse. Impact réel : un utilisateur malvoyant utilisant VoiceOver ne peut pas savoir ce que fait ces boutons. Recommandation : ajouter `aria-label="Menu"` et `aria-label="Publier une annonce"` sur ces deux boutons.

### 2. Le COD dépend de la ville de l'ANNONCE, pas de l'acheteur
Confirmé en testant : le bouton "Payer à la livraison" n'apparaît que si `delivery_city_config.cod_enabled = true` pour la ville où se trouve l'**annonce** (pas celle de l'acheteur). Actuellement seule **Brazzaville** a le COD activé (Pointe-Noire, Nkayi, Dolisie l'ont désactivé). Ce n'est pas un bug — c'est la configuration admin actuelle — mais bon à garder en tête : un acheteur à Pointe-Noire ne verra jamais l'option COD sur une annonce de Pointe-Noire, seulement sur celles de Brazzaville.

### 3. Universal Links non fiables sur Simulateur iOS
Les deep links (`https://www.zandopluscg.com/listings/...`) ouverts depuis l'extérieur de l'app tombent sur Safari plutôt que dans l'app native, sur le Simulateur. C'est une limitation connue d'Apple sur Simulateur (pas un bug de l'app) — à re-tester sur un vrai appareil ou via TestFlight pour confirmer que ça fonctionne correctement en conditions réelles.

### 4. Navigation "retour" (back) peu fiable
Le geste "retour" ne fonctionne pas de façon prévisible dans cette app web encapsulée (pas de vraie pile de navigation native). À garder en tête si un bouton "retour" physique/geste doit un jour être ajouté à l'UX.

## Hors périmètre (décision prise avec l'utilisateur)

Cette suite couvre les parcours critiques modifiés cette semaine. Elle ne couvre **pas** :
- Les ~15 onglets de l'admin
- La vente de produits numériques
- Le suivi de boutique
- Le badge Entreprise (flux de paiement de vérification)
- Le paiement Mobile Money jusqu'au bout (aucune vraie transaction créée)
- L'app Android (tests faits uniquement sur simulateur iOS)

## Fichiers de la suite

- `.maestro/_login.yaml` — sous-flux de connexion réutilisé par les tests qui en ont besoin
- `.maestro/01_home_navigation.yaml` à `06_profile_and_logout.yaml` — les 6 flows
- `run-tests.sh` — lance tous les flows dans l'ordre et génère les rapports JUnit
- `.maestro/results/*.xml` — rapports JUnit par flow
- Captures d'écran de chaque étape : `~/.maestro/tests/<horodatage>/`

# Zando+ — Brief UI Kit

## Présentation du projet

**Zando+** est la première place de marché en ligne du Congo-Brazzaville.  
Elle permet aux particuliers et aux professionnels d'acheter, vendre et livrer des produits et services à travers le pays.

**Slogan :** *Achetez, Vendez, Simplement.*  
**URL :** [www.zandopluscg.com](https://www.zandopluscg.com)  
**Audience :** Congolais francophones, 15–55 ans, mobile-first  
**Plateformes cibles :** Application web responsive · PWA installable · App mobile iOS & Android

---

## 1. Identité visuelle

### Logo
- Symbole textuel **"Z+"** dans un carré arrondi vert
- Variante texte : **Zando+** (le "+" est distinctif, toujours en vert)
- Usage : fond clair (logo vert), fond sombre (logo blanc), monochrome possible

### Couleurs officielles

| Rôle | Nom token | Valeur HEX | HSL |
|------|-----------|------------|-----|
| Couleur principale | `custom-green-500` | `#00843D` | 148° 100% 26% |
| Vert foncé (hover/actif) | `custom-green-600` | `#006B35` | 148° 100% 21% |
| Accent jaune (CTA, badges) | `accent-yellow` | `#FFC400` | 46° 100% 50% |
| Fond clair | — | `#F7F7F3` | neutre légèrement chaud |
| Texte principal | — | `#111111` | quasi-noir |
| Texte secondaire | — | `#555555` | gris moyen |
| Bordure/Séparateur | — | `#E4E4DF` | gris très clair |
| Blanc | — | `#FFFFFF` | blanc pur |
| Erreur | — | `#D93025` | rouge |
| Avertissement | — | `#E8710A` | orange |
| Succès | — | `#1A7F3C` | vert sombre |

> **Note :** Le vert `#00843D` est la couleur nationale du Congo et la couleur identitaire de Zando+. Elle doit dominer l'interface.

### Typographie

| Rôle | Police | Poids utilisés |
|------|--------|----------------|
| Corps de texte | **Inter** (variable) | 400, 500 |
| Titres / Headings | **Inter** (variable) | 600, 700, 800 |
| Prix / Chiffres | **Inter** (tabular nums) | 600, 700 |
| Taille de base | 14px (mobile) / 15px (desktop) | — |

> Police de fallback : `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

---

## 2. Catégories de produits

| Slug | Nom affiché | Type | Sous-catégories |
|------|-------------|------|-----------------|
| `electronics` | Électronique | Produit | Téléphones, Ordinateurs portables, Tablettes, Appareils photo, Audio, Jeux vidéo, Accessoires |
| `phones-tablets` | Téléphones & Tablettes | Produit | — |
| `vehicles` | Véhicules | Produit | Voitures, Motos, Camions, Bus, Vélos, Pièces & Accessoires |
| `real-estate` | Immobilier | Produit | Appartements, Maisons, Terrains, Commerces, Locations de vacances |
| `fashion` | Mode | Produit | Vêtements, Chaussures, Sacs, Accessoires, Bijoux, Montres |
| `maison-meubles` | Maison & Meubles | Produit | — |
| `jobs` | Emplois | Offre d'emploi | Plein temps, Temps partiel, Contrat, Stage, Freelance, À distance |
| `services` | Services | Service | Services à domicile, Services pro, Beauté & Bien-être, Éducation, Événements, Réparation |
| `loisirs-sports` | Loisirs & Sports | Produit | — |
| `bebes-enfants` | Bébés & Enfants | Produit | — |
| `animaux` | Animaux | Produit | — |
| `agro-alimentaire` | Agroalimentaire | Produit | Produits agricoles, Élevage, Pêche, Boissons, Produits transformés |
| `traditional-medicine` | Médecine traditionnelle | Produit | Herbes & plantes, Potions, Traitements, Consultations |

---

## 3. Fonctionnalités principales

### Marketplace
- Publier une annonce (photos, titre, description, prix, localisation)
- Recherche et filtres (catégorie, ville, prix, état du produit)
- Vue grille / vue liste
- Annonces boostées (mise en avant payante)

### Profils vendeurs
- Page boutique personnalisée (`/seller/:slug`)
- Badge **Vendeur Certifié** (vérifié par l'équipe Zando+)
- Statistiques : ventes, avis, annonces actives
- Système d'avis clients (achat vérifié requis)

### Paiement & Transactions
- **Paiement sécurisé Escrow** : fonds bloqués jusqu'à réception confirmée
- **Paiement à la livraison (COD)** : Cash on Delivery
- **Portefeuille intégré** : recharger, retirer, historique
- **Panier** : achat multi-annonces en une commande

### Livraison
- Livraison disponible **dans la même ville uniquement**
- Activation par ville (contrôle admin : ON/OFF selon disponibilité des livreurs)
- Suivi de commande (`/suivi`)
- Prix de livraison configurable par ville

### Communication
- **Messagerie instantanée** entre acheteur et vendeur
- Notifications push (web + mobile natif)
- Notifications in-app (badge compteur)

### Comptes utilisateurs
- Inscription par email + Google OAuth
- Profil avec photo, nom, téléphone, ville
- Favoris (liste de souhaits)
- Historique des transactions
- Paramètres du compte

### Administration
- Dashboard admin : gestion annonces, utilisateurs, catégories, paramètres
- Modération des annonces
- Gestion des vendeurs certifiés
- Gestion des slides hero (carrousel page d'accueil)
- Statistiques globales
- Outils de diagnostic email & système

### PWA / Mobile
- Installable sur l'écran d'accueil (Android + iOS)
- Notifications push web
- Application native iOS & Android (via Capacitor)
- Expérience hors-ligne partielle

---

## 4. Composants UI prioritaires à créer

### Atomes
- Bouton (Primary / Secondary / Ghost / Danger — tailles SM / MD / LG)
- Badge (Nouveau · Certifié · En vedette · Vendu · État produit)
- Input / Textarea / Select / Slider de prix
- Avatar (avec indicateur en ligne)
- Chip / Tag catégorie
- Rating (étoiles)
- Loader / Skeleton

### Molécules
- Carte d'annonce (vue grille + vue liste)
- Carte vendeur / boutique
- Carte de catégorie
- Notification toast
- Barre de recherche avec filtre
- Sélecteur de ville
- Modal de connexion / inscription

### Organismes
- Header (navigation desktop + mobile)
- Mobile BottomNavBar (5 onglets : Accueil · Annonces · Publier · Messages · Profil)
- Hero slider (carrousel)
- Section catégories
- Section annonces (grille)
- Profil vendeur complet
- Formulaire de publication d'annonce
- Interface de messagerie

### Écrans complets
- Page d'accueil
- Page liste d'annonces
- Page détail annonce
- Boutique vendeur
- Messagerie
- Profil utilisateur
- Panier & paiement
- Dashboard admin

---

## 5. Principes de design

- **Mobile-first** : 90% du trafic vient du mobile
- **Accessible** : contraste fort, zones tactiles ≥ 44px
- **Rapide** : interfaces légères, pas d'animations superflues
- **Confiance** : badges de vérification visibles, prix clairs, vendeurs notés
- **Local** : valeurs visuelles qui résonnent avec l'Afrique centrale (chaleur, vivacité)
- **Bilingue possible** : interface en français, prévu pour extension anglophone

---

## 6. Contexte technique (pour l'intégration)

- **Stack front :** React 18 + Vite + Tailwind CSS
- **Design tokens Tailwind :**
  ```
  bg-custom-green-500   →  #00843D
  bg-custom-green-600   →  #006B35
  text-custom-green-500
  text-accent-yellow    →  #FFC400
  ```
- **Icônes :** Lucide React (stroke icons, taille par défaut 20px)
- **Composants de base :** Radix UI (Dialog, Select, Tabs, etc.)
- **Animations :** Framer Motion (transitions douces, 200–400ms)
- **Format images :** WebP recommandé, ratio 4:3 pour les annonces

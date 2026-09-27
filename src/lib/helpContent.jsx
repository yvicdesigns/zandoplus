import React from 'react';
import { Link } from 'react-router-dom';
import { UserCircle, Tag, ShoppingCart, ShieldCheck, Truck, Settings as SettingsIcon, BadgePercent } from 'lucide-react';

// `shareText` est la version texte simple de chaque réponse, utilisée par les boutons
// "Copier" / "Partager sur WhatsApp" du Centre d'aide (HelpCategoryPage.jsx). On l'écrit
// à la main plutôt que de l'extraire du JSX de `a` : le JSX contient des liens et des
// listes qui ne donnent pas un texte lisible une fois collé dans une conversation.
export const helpCategories = [
  {
    slug: 'compte',
    icon: UserCircle,
    title: 'Mon compte',
    description: "Créer un compte, se connecter, télécharger l'app, mot de passe.",
    questions: [
      {
        q: "Comment puis-je créer un compte sur Zando+ ?",
        a: (
          <>
            Ouvrez l'application (ou zandopluscg.com) et appuyez sur <strong>« Compte »</strong> puis <strong>« Se connecter »</strong>. Vous avez trois façons de vous inscrire :
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Continuer avec Google</strong> ou <strong>Continuer avec Apple</strong> — le plus rapide.</li>
              <li><strong>Continuer avec e-mail</strong> — onglet « Créer un compte » : nom complet, numéro WhatsApp, ville, e-mail et un mot de passe (8 caractères minimum, avec majuscule, minuscule, chiffre et symbole).</li>
            </ul>
            <p className="mt-2">Avec l'e-mail, un message de confirmation est envoyé, il faut cliquer sur le lien à l'intérieur (regardez dans les spams s'il n'arrive pas).</p>
          </>
        ),
        shareText: "Pour créer un compte Zando+ : ouvrez l'app, appuyez sur Compte puis Se connecter. Vous pouvez utiliser Continuer avec Google ou Apple (le plus rapide), ou Continuer avec e-mail en remplissant nom, numéro WhatsApp, ville, e-mail et mot de passe. Avec l'e-mail, un message de confirmation est envoyé, pensez à regarder dans les spams s'il n'arrive pas."
      },
      {
        q: "Comment télécharger l'application Zando+ ?",
        a: (
          <>
            Sur Android, ouvrez le <strong>Play Store</strong> et cherchez « Zando+ ». Sur iPhone, ouvrez l'<strong>App Store</strong> et cherchez « Zando+ ». Vous pouvez aussi utiliser le site zandopluscg.com directement depuis votre navigateur, sans rien installer.
          </>
        ),
        shareText: "Pour télécharger Zando+ : sur Android, ouvrez le Play Store et cherchez Zando+. Sur iPhone, ouvrez l'App Store et cherchez Zando+. Vous pouvez aussi utiliser zandopluscg.com directement depuis votre navigateur, sans rien installer."
      },
      {
        q: "La connexion avec Google ne fonctionne pas, que faire ?",
        a: (
          <>
            Assurez-vous d'avoir la <strong>dernière version</strong> de l'application (Play Store ou App Store, bouton « Mettre à jour »). Si le problème persiste après la mise à jour, vous pouvez créer votre compte avec <strong>« Continuer avec e-mail »</strong> en attendant, ou contactez-nous avec le modèle de votre téléphone.
          </>
        ),
        shareText: "Si la connexion avec Google ne fonctionne pas : mettez d'abord l'application à jour depuis le Play Store ou l'App Store. Si ça persiste, créez votre compte avec Continuer avec e-mail en attendant, et écrivez-nous en précisant le modèle de votre téléphone."
      },
      {
        q: "Est-ce que l'utilisation de Zando+ est gratuite ?",
        a: (
          <>
            Oui, l'inscription est gratuite et vous pouvez publier jusqu'à <strong>15 annonces actives</strong> sans rien payer. Si vous vendez davantage, vous pouvez passer{' '}
            <Link to="/pricing" className="text-custom-green-600 hover:underline font-semibold">Boutique ou Entreprise</Link>{' '}
            pour publier jusqu'à 100 ou 500 annonces. Les autres frais restent optionnels : boost d'annonces (150 FCFA/jour pour le Boost Simple, 300 FCFA/jour pour le Boost Urgent) et vérification vendeur.
          </>
        ),
        shareText: "Zando+ est gratuit : inscription gratuite, jusqu'à 15 annonces actives sans rien payer. Pour vendre davantage, il existe les paliers payants Boutique et Entreprise (jusqu'à 100 ou 500 annonces). Les autres services sont optionnels : booster une annonce (150 FCFA/jour, ou 300 FCFA/jour pour l'option Urgent) et la vérification vendeur."
      },
      {
        q: "Comment puis-je réinitialiser mon mot de passe ?",
        a: "Si vous avez oublié votre mot de passe, cliquez sur 'Se connecter', puis sur le lien 'Mot de passe oublié ?'. Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.",
        shareText: "Pour réinitialiser votre mot de passe : cliquez sur Se connecter, puis sur Mot de passe oublié. Entrez votre e-mail, un lien de réinitialisation vous sera envoyé."
      },
      {
        q: "Comment puis-je supprimer mon compte ?",
        a: (
          <>
            Pour supprimer votre compte, rendez-vous sur la page{' '}
            <Link to="/settings#danger-zone" className="text-custom-green-600 hover:underline font-semibold">
              Paramètres dans la section "Zone Dangereuse"
            </Link>
            . Attention, cette action est irréversible et entraînera la suppression définitive de toutes vos données (annonces, messages, profil, etc.).
            <div className="mt-4">
              <Link to="/settings#danger-zone" className="inline-flex items-center gap-2 bg-custom-green-600 hover:bg-custom-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                <SettingsIcon className="w-4 h-4" />
                Accéder à la Suppression du Compte
              </Link>
            </div>
          </>
        ),
        shareText: "Pour supprimer votre compte : allez dans Paramètres, section Zone Dangereuse. Attention, c'est irréversible : toutes vos données (annonces, messages, profil) sont définitivement supprimées."
      }
    ]
  },
  {
    slug: 'vendre',
    icon: Tag,
    title: 'Vendre sur Zando+',
    description: "Publier une annonce, booster, stocks, paliers vendeur, conseils.",
    questions: [
      {
        q: "Comment puis-je publier une annonce ?",
        a: "Une fois connecté, cliquez sur le bouton 'Publier une annonce'. Suivez les étapes pour ajouter un titre, une description, des photos de qualité, fixer un prix et choisir une catégorie. La publication est gratuite et illimitée jusqu'à votre plafond d'annonces.",
        shareText: "Pour publier une annonce : connectez-vous, appuyez sur Publier une annonce, puis ajoutez titre, description, photos, prix et catégorie. C'est gratuit jusqu'à votre plafond d'annonces (15 en compte gratuit)."
      },
      {
        q: "Comment booster mon annonce ?",
        a: (
          <>
            Depuis votre annonce, cliquez sur <strong>« Booster cette annonce »</strong>. Vous choisissez ensuite :
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Boost Simple</strong> — 150 FCFA/jour : badge jaune "Boosté", mis en avant dans la section dédiée de la page d'accueil.</li>
              <li><strong>Boost Urgent</strong> — 300 FCFA/jour : badge rouge "URGENT", apparaît dans le popup prioritaire et tout en haut de la page d'accueil.</li>
            </ul>
            <p className="mt-2">Vous sélectionnez le nombre de jours souhaité (de 1 à 365 jours). Le total est calculé en temps réel avant paiement. Le paiement se fait via MTN Money (Airtel Money bientôt disponible).</p>
            <p className="mt-2">Un numéro WhatsApp valide doit être enregistré sur votre compte avant de pouvoir acheter un boost — c'est ce numéro qui nous permet de vous notifier et de vous recontacter si besoin.</p>
          </>
        ),
        shareText: "Pour booster une annonce : ouvrez l'annonce, appuyez sur Booster cette annonce. Deux options : Boost Simple à 150 FCFA/jour (badge Boosté) ou Boost Urgent à 300 FCFA/jour (badge rouge URGENT, mis en avant sur l'accueil). Vous choisissez le nombre de jours, le paiement se fait par MTN Money. Un numéro WhatsApp valide doit être enregistré sur votre compte avant d'acheter un boost."
      },
      {
        q: "Est-ce que vous facturez pour la visibilité de mon annonce ?",
        a: (
          <>
            Non, publier une annonce et être vu reste <strong>gratuit</strong>. Le boost (voir question précédente) est une option facultative pour gagner encore plus de visibilité, personne n'est obligé d'y passer pour vendre.
          </>
        ),
        shareText: "Non, la visibilité normale de vos annonces est gratuite. Le boost est une option facultative pour être encore plus visible, mais rien n'est facturé automatiquement, personne n'est obligé d'y passer pour vendre."
      },
      {
        q: "Comment fonctionne la gestion des stocks ?",
        a: "Lors de la création ou de la modification de votre annonce, vous pouvez spécifier la 'Quantité en stock'. Si vous laissez ce champ vide, l'article est considéré comme unique. Lorsque la quantité atteint 0, votre annonce est automatiquement marquée comme 'Épuisé'.",
        shareText: "Pour la gestion des stocks : renseignez la Quantité en stock quand vous créez ou modifiez votre annonce. Si le champ est vide, l'article est considéré comme unique. À 0, l'annonce passe automatiquement en Épuisé."
      },
      {
        q: "Quels sont les paliers vendeur (Libre, Boutique, Entreprise) ?",
        a: (
          <>
            Tout compte vendeur démarre en <strong>Zando Libre</strong> (gratuit, jusqu'à 15 annonces actives). Deux paliers payants permettent de vendre davantage et de renforcer la confiance des acheteurs :
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Boutique</strong> — 12 000 FCFA/an : jusqu'à 100 annonces, badge "Boutique Vérifiée", page boutique dans l'annuaire.</li>
              <li><strong>Entreprise</strong> — 20 000 FCFA/an : jusqu'à 500 annonces, badge "Entreprise Vérifiée", bannière sur la page d'accueil, 1 boost de 7 jours inclus chaque mois.</li>
            </ul>
            <p className="mt-2">
              Les deux nécessitent une vérification d'identité (Carte Nationale d'Identité + selfie), traitée sous 1 à 2 jours ouvrables. Si vous voulez simplement le badge de confiance sans changer de palier, la <strong>vérification simple</strong> reste disponible à 10 000 FCFA (paiement unique, badge à vie).
            </p>
            <div className="mt-4">
              <Link to="/pricing" className="inline-flex items-center gap-2 bg-custom-green-600 hover:bg-custom-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                <BadgePercent className="w-4 h-4" />
                Voir tous les tarifs
              </Link>
            </div>
          </>
        ),
        shareText: "Les paliers vendeur Zando+ : Zando Libre (gratuit, jusqu'à 15 annonces), Boutique (12 000 FCFA/an, jusqu'à 100 annonces, badge Boutique Vérifiée) et Entreprise (20 000 FCFA/an, jusqu'à 500 annonces, badge Entreprise Vérifiée, bannière accueil, 1 boost de 7 jours inclus par mois). Boutique et Entreprise demandent une vérification d'identité (CNI + selfie), traitée en 1 à 2 jours. Il existe aussi une vérification simple à 10 000 FCFA (paiement unique) pour juste le badge de confiance."
      },
      {
        q: "Comment puis-je rendre mon annonce plus attractive ?",
        a: "Pour attirer plus d'acheteurs, utilisez des photos claires et de haute qualité, rédigez une description détaillée et honnête, et fixez un prix compétitif. Répondre rapidement aux questions des acheteurs est également un plus.",
        shareText: "Pour rendre votre annonce plus attractive : des photos claires et de qualité, une description détaillée et honnête, un prix compétitif, et répondez vite aux questions des acheteurs."
      },
      {
        q: "Conseils pour des photos réussies",
        a: "1. Nettoyez votre article. 2. Utilisez un fond neutre (un mur blanc, un drap). 3. Profitez de la lumière naturelle, évitez le flash. 4. Prenez des photos sous plusieurs angles (avant, arrière, côtés, détails). 5. Montrez les éventuels défauts pour être transparent.",
        shareText: "Conseils photos : nettoyez l'article, utilisez un fond neutre, profitez de la lumière naturelle (évitez le flash), prenez plusieurs angles, et montrez les défauts pour être honnête."
      },
      {
        q: "Comment rédiger un titre et une description qui vendent ?",
        a: "Titre : Soyez précis et incluez la marque, le modèle, la taille, et la couleur. (Ex: 'iPhone 13 Pro Max 256Go Bleu Alpin, comme neuf'). Description : Racontez l'histoire de l'article, son état, pourquoi vous le vendez. Mentionnez tous les accessoires inclus.",
        shareText: "Pour bien rédiger : titre précis avec marque, modèle, taille, couleur (ex : iPhone 13 Pro Max 256Go Bleu, comme neuf). Description : l'état de l'article, pourquoi vous le vendez, et les accessoires inclus."
      },
      {
        q: "Comment fixer le bon prix ?",
        a: "Recherchez des articles similaires sur Zando+ pour voir les prix du marché. Tenez compte de l'état de votre article, de sa rareté et de son prix d'origine. Si vous êtes pressé, un prix légèrement inférieur à la moyenne peut accélérer la vente.",
        shareText: "Pour fixer le bon prix : regardez des articles similaires sur Zando+, tenez compte de l'état et de la rareté. Si vous êtes pressé, un prix légèrement inférieur à la moyenne accélère souvent la vente."
      }
    ]
  },
  {
    slug: 'acheter',
    icon: ShoppingCart,
    title: 'Acheter sur Zando+',
    description: "Contacter un vendeur, vérifier un article, rechercher, négocier.",
    questions: [
      {
        q: "Comment puis-je contacter un vendeur ?",
        a: "Sur la page de l'annonce, vous trouverez les informations de contact du vendeur, comme son numéro de téléphone. Vous pouvez également lui envoyer un message directement via notre plateforme en cliquant sur 'Envoyer un message'. Pour les achats sécurisés, utilisez le bouton 'Achat Sécurisé Zando ✅'.",
        shareText: "Pour contacter un vendeur : sur la page de l'annonce, appuyez sur Envoyer un message pour lui écrire directement, ou utilisez le bouton Achat Sécurisé Zando pour un paiement protégé."
      },
      {
        q: "Comment puis-je être sûr de la qualité d'un article ?",
        a: "Nous vous recommandons de bien lire la description, de regarder toutes les photos et de poser des questions au vendeur. Pour les articles de valeur, utilisez l'Achat Sécurisé Zando qui protège votre argent jusqu'à ce que vous confirmiez avoir bien reçu l'article.",
        shareText: "Pour être sûr de la qualité d'un article : lisez bien la description, regardez toutes les photos, posez des questions au vendeur. Pour les articles de valeur, utilisez l'Achat Sécurisé Zando qui protège votre argent jusqu'à réception confirmée."
      },
      {
        q: "Que faire si je suspecte une annonce frauduleuse ?",
        a: "Si une annonce vous semble suspecte, veuillez la signaler immédiatement en utilisant le bouton 'Signaler cette annonce' sur la page du produit. Notre équipe examinera le signalement dans les plus brefs délais.",
        shareText: "Si une annonce vous semble frauduleuse : signalez-la avec le bouton Signaler cette annonce sur la page du produit. Notre équipe l'examine rapidement."
      },
      {
        q: "Comment faire une recherche efficace ?",
        a: "Utilisez des mots-clés précis dans la barre de recherche. N'hésitez pas à utiliser les filtres (catégorie, prix, localisation) pour affiner les résultats. Les annonces de votre ville apparaissent automatiquement en premier lorsque vous êtes connecté.",
        shareText: "Pour une recherche efficace : utilisez des mots-clés précis, et les filtres (catégorie, prix, localisation) pour affiner. Connecté, les annonces de votre ville apparaissent en premier."
      },
      {
        q: "Conseils pour une négociation réussie",
        a: "Soyez poli et respectueux. Faites une offre raisonnable basée sur les prix du marché. Expliquez pourquoi vous proposez ce prix (par exemple, si vous devez vous déplacer loin). Une bonne communication est la clé !",
        shareText: "Pour bien négocier : soyez poli, proposez une offre raisonnable basée sur le marché, expliquez votre raisonnement. Une bonne communication fait toute la différence."
      }
    ]
  },
  {
    slug: 'paiement',
    icon: ShieldCheck,
    title: 'Paiement & Sécurité',
    description: "Achat Sécurisé Zando, paiement à la livraison, commissions, transactions.",
    questions: [
      {
        q: "Qu'est-ce que l'Achat Sécurisé Zando ?",
        a: (
          <>
            L'Achat Sécurisé Zando est notre système de fonds protégés intégré. Voici comment ça fonctionne :
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Vous envoyez le paiement (MTN Money) au numéro Zando+.</li>
              <li>Vous uploadez la capture d'écran de votre paiement sur la plateforme.</li>
              <li>Zando+ bloque les fonds et notifie le vendeur pour préparer la livraison.</li>
              <li>Vous avez 48h après la déclaration de livraison par le vendeur pour confirmer la réception ou ouvrir un litige.</li>
              <li>Passé ce délai sans action de votre part, les fonds sont libérés automatiquement au vendeur. Aucun remboursement ne sera possible après ce délai.</li>
            </ol>
            <p className="mt-2">Important : aucun retour n'est accepté une fois que vous avez confirmé la réception de votre colis ou que le délai de 48h est écoulé.</p>
          </>
        ),
        shareText: "L'Achat Sécurisé Zando protège votre paiement, pas votre livraison : 1) vous payez le numéro Zando+ par MTN Money, 2) vous uploadez la capture de paiement, 3) Zando+ bloque les fonds et prévient le vendeur, 4) vous avez 48h après la déclaration de livraison pour confirmer réception ou ouvrir un litige, 5) sans action de votre part après 48h, les fonds sont libérés automatiquement au vendeur. Aucun retour n'est accepté après confirmation ou après les 48h."
      },
      {
        q: "Est-ce que Zando+ livre lui-même quand j'utilise l'Achat Sécurisé ?",
        a: (
          <>
            Pas forcément. L'Achat Sécurisé protège votre <strong>paiement</strong>, pas la livraison elle-même. C'est le vendeur qui choisit son mode de livraison sur chaque annonce : lui-même, <strong>Zando Delivery</strong> (nos livreurs, contre des frais fixes, uniquement dans les villes couvertes) ou le retrait en boutique. Regardez sur l'annonce quel mode est proposé.
          </>
        ),
        shareText: "L'Achat Sécurisé protège votre paiement, pas forcément la livraison. C'est le vendeur qui choisit sur chaque annonce comment il livre : lui-même, Zando Delivery (nos livreurs, avec des frais fixes, seulement dans les villes couvertes) ou le retrait en boutique. Regardez sur l'annonce quel mode est proposé."
      },
      {
        q: "Comment fonctionne l'Achat Sécurisé pour le vendeur ?",
        a: (
          <>
            Quand un acheteur utilise l'Achat Sécurisé Zando, vous recevez une notification. Une fois le paiement sécurisé, vous préparez et livrez l'article, puis déclarez la livraison depuis la page Mes Commandes. Une commission est déduite du montant qui vous est reversé, selon le prix de l'article :
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Moins de 10 000 FCFA : <strong>8%</strong></li>
              <li>De 10 000 à 200 000 FCFA : <strong>5%</strong></li>
              <li>Au-delà de 200 000 FCFA : plafonnée à <strong>10 000 FCFA</strong></li>
            </ul>
            <p className="mt-2">L'acheteur paie toujours le prix affiché, sans surcoût. Les fonds vous sont libérés après confirmation de réception par l'acheteur, ou automatiquement 48h après la déclaration de livraison. Si vous vendez en direct, sans passer par l'Achat Sécurisé, Zando+ ne prend aucune commission.</p>
          </>
        ),
        shareText: "Après une vente en Achat Sécurisé, vous n'avez rien à verser vous-même : notre commission est retirée automatiquement de ce qui vous est reversé. Elle dépend du prix : 8% sous 10 000 FCFA, 5% entre 10 000 et 200 000 FCFA, plafonnée à 10 000 FCFA au-delà. L'acheteur paie toujours le prix affiché, sans surcoût. Vous êtes payé après confirmation de l'acheteur, ou automatiquement 48h après avoir déclaré la livraison. En vente directe, hors Achat Sécurisé, aucune commission n'est prélevée."
      },
      {
        q: "Puis-je payer en espèces à la livraison (COD) ?",
        a: "Oui, dans les villes où l'option est activée par Zando+. Au moment de payer votre panier, si le paiement à la livraison est disponible pour votre ville, vous pouvez le choisir : vous payez en espèces au livreur à la réception, sans avancer d'argent en ligne. Si l'option n'apparaît pas, c'est qu'elle n'est pas encore activée dans votre ville — utilisez alors l'Achat Sécurisé Zando (MTN/Airtel Money).",
        shareText: "Oui, le paiement à la livraison (COD) existe dans les villes où Zando+ l'a activé : vous payez en espèces au livreur à la réception, sans rien avancer en ligne. Si l'option n'apparaît pas au paiement, elle n'est pas encore active dans votre ville, utilisez alors l'Achat Sécurisé Zando."
      },
      {
        q: "Comment suivre mes transactions ?",
        a: (
          <>
            Rendez-vous sur la page{' '}
            <Link to="/transactions" className="text-custom-green-600 hover:underline font-semibold">
              Mes Commandes
            </Link>{' '}
            (accessible depuis le menu utilisateur). Vous y retrouvez l'état de chaque achat sécurisé, les boutons d'action disponibles et l'historique complet.
          </>
        ),
        shareText: "Pour suivre vos transactions : allez sur Mes Commandes depuis le menu utilisateur. Vous y voyez l'état de chaque achat sécurisé et tout l'historique."
      },
      {
        q: "Les règles d'or pour un achat sécurisé",
        a: "1. Privilégiez les vendeurs vérifiés. 2. Ne payez jamais à l'avance par des moyens non traçables — utilisez l'Achat Sécurisé Zando ✅ qui protège votre argent jusqu'à réception. 3. Rencontrez le vendeur dans un lieu public si vous payez en main propre. 4. Vérifiez l'article en détail avant de confirmer la réception. 5. Si une offre semble trop belle pour être vraie, c'est probablement le cas.",
        shareText: "Règles d'or pour un achat sécurisé : privilégiez les vendeurs vérifiés, ne payez jamais à l'avance par un moyen non traçable (utilisez l'Achat Sécurisé Zando), rencontrez le vendeur dans un lieu public si paiement en main propre, vérifiez l'article avant de confirmer réception, et méfiez-vous des offres trop belles pour être vraies."
      }
    ]
  },
  {
    slug: 'livraison',
    icon: Truck,
    title: 'Livraison & Retours',
    description: "Zones de livraison, délais, et politique de retour.",
    questions: [
      {
        q: "Comment fonctionne la livraison sur Zando+ ?",
        a: "La livraison Zando se fait à l'intérieur d'une même ville (intra-ville) : le vendeur et l'acheteur se trouvent dans la même ville, et la remise se fait en main propre ou via un coursier local. Il n'y a pas encore d'envoi entre villes différentes sur la plateforme.",
        shareText: "La livraison Zando se fait à l'intérieur d'une même ville : vendeur et acheteur dans la même ville, remise en main propre ou par un coursier local. Il n'y a pas encore d'envoi entre villes différentes."
      },
      {
        q: "La livraison est-elle disponible dans toutes les villes ?",
        a: "Non. La livraison Zando et le paiement à la livraison (COD) sont activés ville par ville, selon la présence de notre réseau logistique. Si une annonce n'est pas dans votre ville, ou si ces options ne sont pas encore actives chez vous, un message vous l'indique clairement — ce n'est pas un bug, juste une couverture en cours d'extension.",
        shareText: "Non, la livraison Zando et le paiement à la livraison sont activés ville par ville selon notre réseau. Si l'option n'apparaît pas chez vous, c'est que la couverture n'est pas encore là, pas un bug, elle s'étend progressivement."
      },
      {
        q: "Quelle est la politique de retour ?",
        a: "Pour un Achat Sécurisé Zando : vous disposez de 48h après la déclaration de livraison par le vendeur pour vérifier l'article et confirmer la réception ou ouvrir un litige. Une fois la réception confirmée (ou le délai de 48h écoulé sans action), la transaction est considérée finalisée et aucun retour n'est accepté. Pour un paiement en main propre (hors Achat Sécurisé), les modalités de retour se négocient directement avec le vendeur avant l'achat.",
        shareText: "Politique de retour : en Achat Sécurisé, vous avez 48h après la déclaration de livraison pour vérifier et confirmer réception ou ouvrir un litige. Après confirmation ou passé ce délai, aucun retour n'est accepté. En paiement en main propre hors Achat Sécurisé, les modalités de retour se négocient directement avec le vendeur avant l'achat."
      },
      {
        q: "Que faire si mon colis n'arrive pas ou ne correspond pas à la description ?",
        a: "Si vous avez utilisé l'Achat Sécurisé Zando, ouvrez un litige depuis la page Mes Commandes avant la confirmation de réception ou avant la fin du délai de 48h — vos fonds restent bloqués tant que le litige n'est pas résolu. Passé ce délai, aucune réclamation n'est possible, d'où l'importance de vérifier l'article rapidement à la réception.",
        shareText: "Si votre colis n'arrive pas ou ne correspond pas : en Achat Sécurisé, ouvrez un litige depuis Mes Commandes avant confirmation de réception ou avant la fin des 48h, vos fonds restent bloqués tant que ce n'est pas résolu. Passé ce délai, aucune réclamation n'est possible, vérifiez donc vite à la réception."
      }
    ]
  }
];

export const getCategoryBySlug = (slug) => helpCategories.find((c) => c.slug === slug);

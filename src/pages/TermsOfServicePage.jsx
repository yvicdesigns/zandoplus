import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Gavel, UserCheck, FileText, Ban } from 'lucide-react';

const TermsOfServicePage = () => {
  const pageVariants = {
    initial: { opacity: 0, y: 30 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -30 },
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.8,
  };

  const Section = ({ icon, title, children }) => (
    <motion.div 
      className="mb-12"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-custom-green-100 rounded-lg flex items-center justify-center mr-4">
          {React.createElement(icon, { className: "w-6 h-6 text-custom-green-600" })}
        </div>
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      </div>
      <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed">
        {children}
      </div>
    </motion.div>
  );

  return (
    <>
      <Helmet>
        <title>Conditions d'Utilisation - Zando+ Congo</title>
        <meta name="description" content="Consultez les conditions d'utilisation de Zando+ Congo. En utilisant notre plateforme, vous acceptez de respecter ces règles pour garantir une communauté sûre et fiable." />
        <link rel="canonical" href="https://www.zandopluscg.com/terms" />
      </Helmet>
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        <section className="relative py-20 lg:py-24 hero-pattern">
          <div className="absolute inset-0 bg-gradient-to-br from-custom-green-600/10 via-teal-600/10 to-transparent"></div>
          <div className="container mx-auto px-4 relative z-10 text-center">
            <motion.h1 
              className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
            >
              Conditions <span className="gradient-text">d'Utilisation</span>
            </motion.h1>
            <motion.p 
              className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } }}
            >
              Règles à suivre pour une expérience juste et sécurisée pour tous.
              <br />Dernière mise à jour : 3 août 2026
            </motion.p>
          </div>
        </section>

        <div className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <p className="text-lg text-gray-700 mb-12 text-center">
              Ces Conditions d'Utilisation régissent votre accès et votre utilisation de la plateforme Zando+ Congo. En accédant ou en utilisant le service, vous acceptez d'être lié par ces conditions.
            </p>

            <Section icon={Gavel} title="1. Acceptation des conditions">
              <p>En créant un compte ou en utilisant notre plateforme, vous confirmez que vous avez lu, compris et accepté l'ensemble de ces Conditions d'Utilisation. Si vous n'êtes pas d'accord avec ces conditions, vous ne devez pas utiliser nos services.</p>
            </Section>

            <Section icon={UserCheck} title="2. Obligations de l'utilisateur">
              <p>En tant qu'utilisateur, vous vous engagez à :</p>
              <ul>
                <li>Fournir des informations exactes, actuelles et complètes lors de votre inscription et de la publication d'annonces.</li>
                <li>Maintenir la sécurité de votre mot de passe et de votre compte.</li>
                <li>Être seul responsable de toutes les activités qui se déroulent sous votre compte.</li>
                <li>Utiliser la plateforme de manière respectueuse et légale, sans harceler, abuser ou nuire à autrui.</li>
              </ul>
            </Section>

            <Section icon={Ban} title="3. Contenus et activités interdits">
              <p>Il est strictement interdit de publier tout contenu ou de s'engager dans toute activité qui :</p>
              <ul>
                <li>Est illégal, frauduleux, trompeur ou malveillant.</li>
                <li>Viole les droits d'auteur, les marques commerciales ou tout autre droit de propriété intellectuelle d'un tiers.</li>
                <li>Concerne la vente d'articles illégaux, contrefaits ou dangereux.</li>
                <li>Contient des virus ou tout autre code informatique conçu pour interrompre, détruire ou limiter la fonctionnalité de tout logiciel ou matériel informatique.</li>
              </ul>
              <p>Nous nous réservons le droit de supprimer tout contenu et de suspendre ou résilier tout compte qui enfreint ces règles, sans préavis.</p>
            </Section>

            <Section icon={FileText} title="4. Publication d'annonces">
              <p>La publication d'annonces sur Zando+ est gratuite et illimitée pour tous les utilisateurs inscrits. Il n'existe aucun abonnement obligatoire pour vendre sur la plateforme.</p>
              <p>Les vendeurs peuvent booster la visibilité de leurs annonces via des options payantes :</p>
              <ul>
                <li><strong>Boost Simple :</strong> 150 FCFA par jour. L'annonce est mise en avant dans sa catégorie avec un badge jaune.</li>
                <li><strong>Boost Urgent :</strong> 300 FCFA par jour. L'annonce apparaît en tête de page d'accueil et dans le popup prioritaire avec un badge rouge.</li>
              </ul>
              <p>La durée du boost est libre, de 1 à 365 jours. Le paiement se fait uniquement via Airtel Money ou MTN Money.</p>
            </Section>

            <Section icon={UserCheck} title="5. Vérification des vendeurs">
              <p>Les vendeurs peuvent obtenir le statut de Vendeur Vérifié en soumettant les documents suivants :</p>
              <ul>
                <li>Une pièce d'identité officielle valide (Carte Nationale d'Identité ou passeport).</li>
                <li>Un selfie tenant la pièce d'identité à la main.</li>
                <li>Un justificatif de domicile (facultatif).</li>
              </ul>
              <p>Des frais uniques de <strong>10 000 FCFA</strong> sont requis pour traiter la demande de vérification. Ce paiement n'est pas remboursable en cas de rejet du dossier. Le délai de traitement est de 1 à 2 jours ouvrables.</p>
              <p>Le statut de Vendeur Vérifié affiche un badge de confiance sur le profil et les annonces du vendeur. Zando+ se réserve le droit de révoquer ce statut en cas de comportement frauduleux avéré.</p>
            </Section>

            <Section icon={FileText} title="6. Achat sécurisé et commission">
              <p>Zando+ Congo propose un service d'achat sécurisé par fonds protégés. L'acheteur envoie le paiement à Zando+, qui bloque les fonds jusqu'à confirmation de réception du bien. Ce service fonctionne comme suit :</p>
              <ul>
                <li>Une commission de <strong>10%</strong> du montant de la transaction est prélevée sur la part reversée au vendeur. L'acheteur paie le prix affiché sans surcoût.</li>
                <li>Une fois le paiement sécurisé, le vendeur prépare et livre l'article, puis déclare la livraison depuis la page Mes Commandes.</li>
                <li>L'acheteur dispose de <strong>48 heures</strong> après la déclaration de livraison pour confirmer la réception ou ouvrir un litige.</li>
                <li>Passé ce délai de 48 heures sans action de l'acheteur, les fonds sont automatiquement libérés au vendeur. Aucun remboursement ne peut être accordé après ce délai.</li>
                <li>En cas de litige ouvert dans les 48 heures, Zando+ examine les preuves et prend une décision qui peut aboutir à la libération des fonds au vendeur ou au remboursement de l'acheteur.</li>
                <li>Aucun retour de marchandise n'est accepté une fois que l'acheteur a confirmé la réception ou que le délai de 48 heures est écoulé.</li>
                <li>Zando+ ne peut être tenu responsable en cas de défaillance des opérateurs de paiement mobile (Airtel Money, MTN Money) lors du transfert.</li>
              </ul>
            </Section>

            <Section icon={FileText} title="7. Livraison et frais">
              <p>Zando+ propose plusieurs modes de livraison selon les annonces et les villes :</p>
              <ul>
                <li><strong>Livraison Zando :</strong> Zando envoie un livreur à l'adresse de l'acheteur. Des frais de livraison s'appliquent par vendeur.</li>
                <li><strong>Livraison du vendeur :</strong> le vendeur assure lui-même la livraison selon ses propres tarifs.</li>
                <li><strong>Retrait en boutique :</strong> l'acheteur vient récupérer l'article directement chez le vendeur, sans frais.</li>
              </ul>
              <p>Pour le paiement à la livraison (COD), les frais de livraison varient selon la zone :</p>
              <ul>
                <li>Zone 1 (Proche : Poto-Poto, Moungali, Centre-ville, Plateau des 15 ans) : <strong>1 500 FCFA</strong></li>
                <li>Zone 2 (Moyen : Bacongo, Makélékélé, Ouenzé, Mikalou) : <strong>2 000 FCFA</strong></li>
                <li>Zone 3 (Éloigné : Talangaï, Mfilou, Madibou, Djiri) : <strong>3 500 FCFA</strong></li>
              </ul>
              <p>La disponibilité des modes de livraison dépend de la ville et des paramètres définis par le vendeur.</p>
            </Section>

            <Section icon={Gavel} title="8. Limitation de responsabilité">
              <p>En dehors du service d'achat sécurisé décrit à l'article 6, Zando+ Congo est une plateforme de mise en relation. Nous ne garantissons pas la qualité, la sécurité ou la légalité des articles proposés hors fonds protégés, ni la véracité des annonces.</p>
              <p>En aucun cas, Zando+ Congo ne pourra être tenu responsable des dommages directs ou indirects résultant de transactions effectuées en dehors du système d'achat sécurisé.</p>
            </Section>

            <Section icon={FileText} title="9. Modification du modèle économique">
              <p>Zando+ Congo se réserve le droit de modifier à tout moment son modèle économique, notamment les tarifs de commission, les frais de boost, les frais de vérification, les frais de livraison ou les conditions d'accès aux fonctionnalités.</p>
              <p>Toute modification significative sera communiquée aux utilisateurs par notification sur la plateforme ou par e-mail au moins <strong>15 jours</strong> avant son entrée en vigueur. La poursuite de l'utilisation de la plateforme après ce délai vaut acceptation des nouvelles conditions.</p>
            </Section>

            <p className="text-center text-gray-600 mt-12">Pour toute question concernant ces Conditions d'Utilisation, veuillez nous contacter via notre <a href="/contact" className="text-custom-green-600 font-semibold hover:underline">page de contact</a>.</p>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default TermsOfServicePage;
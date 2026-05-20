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
              <br />Dernière mise à jour : 20 mai 2026
            </motion.p>
          </div>
        </section>

        <div className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <p className="text-lg text-gray-700 mb-12 text-center">
              Ces Conditions d'Utilisation régissent votre accès et votre utilisation de la plateforme Zando+ Congo. En accédant ou en utilisant le service, vous acceptez d'être lié par ces conditions.
            </p>

            <Section icon={Gavel} title="1. Acceptation des conditions">
              <p>En créant un compte ou en utilisant notre plateforme, vous confirmez que vous avez lu, compris et accepté d'être lié par l'ensemble de ces Conditions d'Utilisation. Si vous n'êtes pas d'accord avec ces conditions, vous ne devez pas utiliser nos services.</p>
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
            
            <Section icon={FileText} title="4. Service d'Achat Sécurisé (Escrow)">
                <p>Zando+ Congo propose un service d'achat sécurisé dit "escrow" permettant à l'acheteur de déposer un paiement que Zando+ conserve jusqu'à confirmation de réception du bien acheté. Ce service est soumis aux conditions suivantes :</p>
                <ul>
                  <li>Une commission de <strong>3%</strong> du montant de la transaction est prélevée sur la part reversée au vendeur. L'acheteur paie le prix affiché sans surcoût.</li>
                  <li>L'acheteur dispose de <strong>72 heures</strong> après la déclaration de livraison par le vendeur pour confirmer la réception ou ouvrir un litige.</li>
                  <li>En cas de litige, Zando+ examine les preuves et prend une décision qui peut aboutir à la libération des fonds au vendeur ou au remboursement de l'acheteur.</li>
                  <li>Zando+ ne peut être tenu responsable en cas de défaillance des opérateurs de paiement mobile (Airtel Money, MTN Money) lors du transfert.</li>
                </ul>
            </Section>

            <Section icon={Gavel} title="5. Limitation de responsabilité">
                <p>En dehors du service d'achat sécurisé décrit à l'article 4, Zando+ Congo est une plateforme de mise en relation. Nous ne garantissons pas la qualité, la sécurité ou la légalité des articles proposés hors escrow, ni la véracité des annonces.</p>
                <p>En aucun cas, Zando+ Congo ne pourra être tenu responsable des dommages directs ou indirects résultant de transactions effectuées en dehors du système d'achat sécurisé.</p>
            </Section>

            <p className="text-center text-gray-600 mt-12">Pour toute question concernant ces Conditions d'Utilisation, veuillez nous contacter via notre <a href="/contact" className="text-custom-green-600 font-semibold hover:underline">page de contact</a>.</p>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default TermsOfServicePage;
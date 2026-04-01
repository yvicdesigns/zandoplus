import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ShieldCheck, Database, Users, Cookie, Lock, Clock, User, RefreshCw } from 'lucide-react';

const PrivacyPolicyPage = () => {
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
        <title>Politique de Confidentialité - Zando+ Congo</title>
        <meta name="description" content="Découvrez comment Zando+ Congo collecte, utilise et protège vos données personnelles. Votre confiance et votre sécurité sont notre priorité." />
        <meta property="og:title" content="Politique de Confidentialité - Zando+ Congo" />
        <meta property="og:description" content="Découvrez comment Zando+ Congo collecte, utilise et protège vos données personnelles. Votre confiance et votre sécurité sont notre priorité." />
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
              Politique de <span className="gradient-text">Confidentialité</span>
            </motion.h1>
            <motion.p 
              className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } }}
            >
              Votre confiance est notre priorité. Voici comment nous protégeons vos informations.
              <br />Dernière mise à jour : 15 juillet 2025
            </motion.p>
          </div>
        </section>

        <div className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <p className="text-lg text-gray-700 mb-12 text-center">
              Bienvenue sur Zando+ Congo (“nous”, “notre”, “nos”). Nous nous engageons à protéger votre vie privée. Cette Politique de Confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos informations lorsque vous utilisez notre plateforme.
            </p>

            <Section icon={Database} title="1. Collecte de vos informations">
              <p>Nous collectons des informations vous concernant de plusieurs manières. Les informations que nous pouvons collecter sur la plateforme incluent :</p>
              <ul>
                <li><strong>Données personnelles :</strong> Informations identifiables, telles que votre nom, adresse e-mail, numéro de téléphone, que vous fournissez volontairement lors de votre inscription.</li>
                <li><strong>Données dérivées :</strong> Informations collectées automatiquement lorsque vous accédez à la plateforme, telles que votre adresse IP, type de navigateur, pages consultées.</li>
                <li><strong>Données des annonces :</strong> Informations que vous fournissez lors de la création d’une annonce, y compris les descriptions, photos et prix.</li>
              </ul>
            </Section>

            <Section icon={ShieldCheck} title="2. Utilisation de vos informations">
              <p>Ces informations nous permettent de vous offrir une expérience fluide, efficace et personnalisée. Nous pouvons les utiliser pour :</p>
              <ul>
                <li>Créer et gérer votre compte.</li>
                <li>Faciliter la communication entre acheteurs et vendeurs.</li>
                <li>Vous envoyer des notifications concernant votre compte ou la plateforme.</li>
                <li>Prévenir les activités frauduleuses et renforcer la sécurité.</li>
                <li>Analyser l’utilisation et les tendances afin d’améliorer nos services.</li>
              </ul>
            </Section>

            <Section icon={Users} title="3. Partage de vos informations">
              <p>Nous ne partageons pas vos informations avec des tiers, sauf dans les cas suivants :</p>
              <ul>
                <li><strong>Exigences légales :</strong> Si la divulgation est nécessaire pour répondre à une procédure légale, enquêter sur une violation ou protéger nos droits et ceux d’autrui.</li>
                <li><strong>Interactions entre utilisateurs :</strong> Votre nom, photo de profil et contenu de vos annonces peuvent être visibles par d’autres utilisateurs.</li>
                <li><strong>Prestataires de services :</strong> Nous pouvons partager certaines données avec des prestataires tiers (paiement, analyse, service client) travaillant pour nous.</li>
              </ul>
            </Section>
            
            <Section icon={Cookie} title="4. Cookies et technologies de suivi">
                <p>Nous utilisons des cookies, balises web et technologies similaires pour personnaliser et améliorer votre expérience. Vous pouvez configurer votre navigateur pour refuser les cookies, mais cela peut limiter certaines fonctionnalités de la plateforme.</p>
            </Section>

            <Section icon={Lock} title="5. Sécurité de vos données">
                <p>Nous mettons en place des mesures techniques et organisationnelles raisonnables pour protéger vos données contre l’accès non autorisé, la divulgation ou la destruction. Toutefois, aucun système n’est totalement sécurisé et nous ne pouvons garantir une sécurité absolue.</p>
            </Section>

            <Section icon={Clock} title="6. Conservation des données">
                <p>Nous conservons vos informations aussi longtemps que nécessaire pour :</p>
                <ul>
                    <li>Fournir nos services.</li>
                    <li>Respecter nos obligations légales.</li>
                    <li>Résoudre les litiges et faire appliquer nos politiques.</li>
                </ul>
            </Section>

            <Section icon={User} title="7. Vos droits">
                <p>En fonction de la législation applicable, vous pouvez :</p>
                <ul>
                    <li>Accéder à vos données personnelles.</li>
                    <li>Demander leur rectification ou suppression.</li>
                    <li>Limiter ou refuser certains traitements (comme les cookies).</li>
                </ul>
                <p>Pour exercer ces droits, contactez-nous via notre <a href="/contact" className="text-custom-green-600 font-semibold hover:underline">page de contact</a>.</p>
            </Section>

            <Section icon={RefreshCw} title="8. Modifications de cette Politique">
                <p>Nous pouvons mettre à jour cette Politique de Confidentialité de temps à autre. Toute modification sera signalée par une mise à jour de la date en haut de ce document.</p>
            </Section>
            
            <p className="text-center text-gray-600 mt-12">
              <strong>9. Contact</strong>
              <br />Pour toute question ou commentaire concernant cette Politique de Confidentialité, veuillez nous contacter via notre <a href="/contact" className="text-custom-green-600 font-semibold hover:underline">page de contact</a>.
            </p>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default PrivacyPolicyPage;
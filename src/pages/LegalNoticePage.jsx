import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Building2, Server, Copyright, Scale, Mail } from 'lucide-react';

const LegalNoticePage = () => {
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
        <title>Mentions Légales - Zando+ Congo</title>
        <meta name="description" content="Mentions légales de Zando+ Congo : éditeur du site, hébergement, propriété intellectuelle et contact." />
        <link rel="canonical" href="https://www.zandopluscg.com/legal-notice" />
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
              Mentions <span className="gradient-text">Légales</span>
            </motion.h1>
            <motion.p
              className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } }}
            >
              Informations sur l'éditeur, l'hébergement et la propriété du site.
            </motion.p>
          </div>
        </section>

        <div className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <Section icon={Building2} title="Éditeur du site">
              <p>
                Le site et l'application Zando+ sont édités par <strong>Zando+ Congo</strong>, une plateforme de marketplace en ligne basée à Brazzaville, République du Congo.
              </p>
              <p>
                Contact : <a href="mailto:webmaster@zandopluscg.com" className="text-custom-green-600 font-semibold hover:underline">webmaster@zandopluscg.com</a>
              </p>
            </Section>

            <Section icon={Server} title="Hébergement">
              <p>Le site web est hébergé par :</p>
              <ul>
                <li><strong>Vercel Inc.</strong> — 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</li>
              </ul>
              <p>La base de données, l'authentification et le stockage de fichiers sont assurés par :</p>
              <ul>
                <li><strong>Supabase Inc.</strong></li>
              </ul>
            </Section>

            <Section icon={Copyright} title="Propriété intellectuelle">
              <p>
                Le nom "Zando+", son logo et l'ensemble des éléments graphiques, textuels et techniques du site (hors contenu publié par les utilisateurs) sont la propriété de Zando+ Congo. Toute reproduction non autorisée est interdite.
              </p>
              <p>
                Le contenu des annonces (textes, photos) reste la propriété de l'utilisateur qui les a publiées, qui garantit disposer des droits nécessaires pour leur diffusion sur la plateforme.
              </p>
            </Section>

            <Section icon={Scale} title="Responsabilité">
              <p>
                Les règles d'utilisation de la plateforme, la responsabilité de Zando+ Congo et les conditions du service d'achat sécurisé sont détaillées dans nos <a href="/terms" className="text-custom-green-600 font-semibold hover:underline">Conditions d'Utilisation</a>. Le traitement des données personnelles est détaillé dans notre <a href="/privacy" className="text-custom-green-600 font-semibold hover:underline">Politique de Confidentialité</a>.
              </p>
            </Section>

            <Section icon={Mail} title="Contact">
              <p>
                Pour toute question relative à ces mentions légales, contactez-nous via notre <a href="/contact" className="text-custom-green-600 font-semibold hover:underline">page de contact</a> ou par e-mail à <a href="mailto:webmaster@zandopluscg.com" className="text-custom-green-600 font-semibold hover:underline">webmaster@zandopluscg.com</a>.
              </p>
            </Section>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default LegalNoticePage;

import React, { useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LifeBuoy, ShoppingCart, Tag, UserCircle, Zap, Lightbulb, Settings as SettingsIcon } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const HelpCenterPage = () => {
  const location = useLocation();
  const sectionRefs = useRef({});

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.substring(1);
      setTimeout(() => {
        sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [location]);
  
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

  const faqs = {
    general: [
      {
        q: "Comment puis-je créer un compte sur Zando+ ?",
        a: "Pour créer un compte, cliquez sur le bouton 'S'inscrire' en haut à droite de la page d'accueil. Remplissez le formulaire avec votre nom, votre adresse e-mail et un mot de passe. Vous recevrez un e-mail de confirmation pour activer votre compte."
      },
      {
        q: "Est-ce que l'utilisation de Zando+ est gratuite ?",
        a: "Oui, l'inscription et la publication d'annonces de base sont entièrement gratuites. Nous proposons des options payantes pour mettre en avant vos annonces et obtenir plus de visibilité."
      },
      {
        q: "Comment puis-je réinitialiser mon mot de passe ?",
        a: "Si vous avez oublié votre mot de passe, cliquez sur 'Se connecter', puis sur le lien 'Mot de passe oublié ?'. Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe."
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
              <Button asChild>
                <Link to="/settings#danger-zone" className="flex items-center gap-2">
                  <SettingsIcon className="w-4 h-4" />
                  Accéder à la Suppression du Compte
                </Link>
              </Button>
            </div>
          </>
        )
      }
    ],
    buyers: [
      {
        q: "Comment puis-je contacter un vendeur ?",
        a: "Sur la page de l'annonce, vous trouverez les informations de contact du vendeur, comme son numéro de téléphone. Vous pouvez également lui envoyer un message directement via notre plateforme en cliquant sur 'Envoyer un message'."
      },
      {
        q: "Comment puis-je être sûr de la qualité d'un article ?",
        a: "Nous vous recommandons de bien lire la description, de regarder toutes les photos et de poser des questions au vendeur. Pour les articles de valeur, privilégiez une rencontre en personne dans un lieu public pour inspecter l'article avant de payer."
      },
      {
        q: "Que faire si je suspecte une annonce frauduleuse ?",
        a: "Si une annonce vous semble suspecte, veuillez la signaler immédiatement en utilisant le bouton 'Signaler cette annonce' sur la page du produit. Notre équipe examinera le signalement dans les plus brefs délais."
      }
    ],
    sellers: [
      {
        q: "Comment puis-je publier une annonce ?",
        a: "Une fois connecté, cliquez sur le bouton 'Publier une annonce'. Suivez les étapes pour ajouter un titre, une description, des photos de qualité, fixer un prix et choisir une catégorie."
      },
      {
        q: "Comment fonctionne la gestion des stocks ?",
        a: "Lors de la création ou de la modification de votre annonce, vous pouvez spécifier la 'Quantité en stock'. Si vous laissez ce champ vide, l'article est considéré comme unique. Lorsque la quantité atteint 0, votre annonce est automatiquement marquée comme 'Épuisé' pour éviter de recevoir des messages inutiles. Pensez à mettre à jour le stock après chaque vente si vous ne le suivez pas automatiquement !"
      },
      {
        q: "Comment puis-je rendre mon annonce plus attractive ?",
        a: "Pour attirer plus d'acheteurs, utilisez des photos claires et de haute qualité, rédigez une description détaillée et honnête, et fixez un prix compétitif. Répondre rapidement aux questions des acheteurs est également un plus."
      },
      {
        q: "Qu'est-ce que le statut de 'Vendeur Vérifié' ?",
        a: "Le statut de 'Vendeur Vérifié' est un badge de confiance accordé aux vendeurs qui ont fourni des documents d'identité (passeport, carte d'identité). Cela rassure les acheteurs et peut augmenter vos ventes."
      }
    ],
    tips: [
      {
        q: "Conseils pour des photos réussies",
        a: "1. Nettoyez votre article. 2. Utilisez un fond neutre (un mur blanc, un drap). 3. Profitez de la lumière naturelle, évitez le flash. 4. Prenez des photos sous plusieurs angles (avant, arrière, côtés, détails). 5. Montrez les éventuels défauts pour être transparent."
      },
      {
        q: "Comment rédiger un titre et une description qui vendent ?",
        a: "Titre : Soyez précis et incluez la marque, le modèle, la taille, et la couleur. (Ex: 'iPhone 13 Pro Max 256Go Bleu Alpin, comme neuf'). Description : Racontez l'histoire de l'article, son état, pourquoi vous le vendez. Mentionnez tous les accessoires inclus."
      },
      {
        q: "Comment fixer le bon prix ?",
        a: "Recherchez des articles similaires sur Zando+ pour voir les prix du marché. Tenez compte de l'état de votre article, de sa rareté et de son prix d'origine. Si vous êtes pressé, un prix légèrement inférieur à la moyenne peut accélérer la vente."
      }
    ],
    buyerTips: [
      {
        q: "Comment faire une recherche efficace ?",
        a: "Utilisez des mots-clés précis dans la barre de recherche. N'hésitez pas à utiliser les filtres (catégorie, prix, localisation) pour affiner les résultats et trouver exactement ce que vous cherchez plus rapidement."
      },
      {
        q: "Conseils pour une négociation réussie",
        a: "Soyez poli et respectueux. Faites une offre raisonnable basée sur les prix du marché. Expliquez pourquoi vous proposez ce prix (par exemple, si vous devez vous déplacer loin). Une bonne communication est la clé !"
      },
      {
        q: "Les règles d'or pour un achat sécurisé",
        a: "1. Privilégiez les vendeurs vérifiés. 2. Ne payez JAMAIS à l'avance, surtout par des moyens non traçables. 3. Rencontrez le vendeur dans un lieu public. 4. Vérifiez l'article en détail avant de payer. 5. Si une offre semble trop belle pour être vraie, c'est probablement le cas."
      }
    ]
  };

  const FaqSection = ({ id, icon, title, questions }) => (
    <motion.div
      id={id}
      ref={(el) => (sectionRefs.current[id] = el)}
      className="mb-12 scroll-mt-24"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-custom-green-100 rounded-lg flex items-center justify-center mr-4">
          {React.createElement(icon, { className: "w-7 h-7 text-custom-green-600" })}
        </div>
        <h2 className="text-3xl font-bold text-gray-800">{title}</h2>
      </div>
      <Accordion type="single" collapsible className="w-full" defaultValue={id === 'general' && location.hash === '#general' ? 'item-3' : undefined}>
        {questions.map((faq, index) => (
          <AccordionItem value={`item-${index}`} key={index}>
            <AccordionTrigger className="text-lg text-left font-semibold text-gray-700 hover:text-custom-green-600">{faq.q}</AccordionTrigger>
            <AccordionContent className="text-base text-gray-600 leading-relaxed">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </motion.div>
  );

  return (
    <>
      <Helmet>
        <title>Centre d'Aide - Zando+ Congo</title>
        <meta name="description" content="Trouvez des réponses à vos questions sur l'achat, la vente et la gestion de votre compte sur Zando+ Congo. Notre centre d'aide est là pour vous accompagner." />
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
              Centre <span className="gradient-text">d'Aide</span>
            </motion.h1>
            <motion.p 
              className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } }}
            >
              Besoin d'aide ? Trouvez ici les réponses à vos questions.
            </motion.p>
          </div>
        </section>

        <div className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <FaqSection id="general" icon={UserCircle} title="Questions Générales" questions={faqs.general} />
            <FaqSection id="sellers" icon={Tag} title="Pour les Vendeurs" questions={faqs.sellers} />
            <FaqSection id="buyers" icon={ShoppingCart} title="Pour les Acheteurs" questions={faqs.buyers} />
            <FaqSection id="tips" icon={Zap} title="Techniques de Vente" questions={faqs.tips} />
            <FaqSection id="buyer-tips" icon={Lightbulb} title="Astuces pour Acheteurs" questions={faqs.buyerTips} />
            
            <div className="mt-16 text-center p-8 bg-gray-50 rounded-xl border border-gray-200">
                <LifeBuoy className="w-12 h-12 text-custom-green-500 mx-auto mb-4"/>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Vous ne trouvez pas de réponse ?</h3>
                <p className="text-gray-600 mb-4">Notre équipe est là pour vous aider. Contactez-nous directement pour toute question spécifique.</p>
                <Link to="/contact" className="inline-block gradient-bg text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity">
                    Nous Contacter
                </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default HelpCenterPage;
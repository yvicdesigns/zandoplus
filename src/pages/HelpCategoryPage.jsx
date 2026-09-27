import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Copy, Check } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { getCategoryBySlug } from '@/lib/helpContent';
import HelpSupportBanner from '@/components/help/HelpSupportBanner';
import HelpContactBlock from '@/components/help/HelpContactBlock';
import { useToast } from '@/components/ui/use-toast';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// Boutons "Copier" / "Partager" sous chaque réponse — permet au vendeur/admin de
// répondre directement à un client sur WhatsApp sans retaper la réponse à la main.
// `text` est la version texte simple (shareText), jamais le JSX affiché (qui contient
// des liens et des listes illisibles une fois collés dans une conversation).
const FaqAnswerActions = ({ question, text }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  if (!text) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Impossible de copier", variant: "destructive" });
    }
  };

  const handleShare = () => {
    if (Capacitor.isNativePlatform()) {
      Share.share({ title: question, text }).catch(() => {});
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-custom-green-600 transition-colors px-2 py-1 rounded-md hover:bg-gray-50"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-custom-green-600" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copié !' : 'Copier'}
      </button>
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#25D366] transition-colors px-2 py-1 rounded-md hover:bg-gray-50"
      >
        <WhatsAppIcon />
        Partager
      </button>
    </div>
  );
};

const HelpCategoryPage = () => {
  const { topic } = useParams();
  const category = getCategoryBySlug(topic);

  if (!category) {
    return <Navigate to="/help" replace />;
  }

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

  return (
    <>
      <Helmet>
        <title>{category.title} - Centre d'Aide Zando+ Congo</title>
        <meta name="description" content={category.description} />
        <link rel="canonical" href={`https://www.zandopluscg.com/help/${category.slug}`} />
      </Helmet>
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        <section className="relative py-16 lg:py-20 hero-pattern">
          <div className="absolute inset-0 bg-gradient-to-br from-custom-green-600/10 via-teal-600/10 to-transparent"></div>
          <div className="container mx-auto px-4 relative z-10 max-w-4xl">
            <Link to="/help" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-custom-green-600 transition-colors mb-6">
              <ChevronLeft className="w-4 h-4" />
              Centre d'Aide
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-custom-green-100 rounded-xl flex items-center justify-center shrink-0">
                {React.createElement(category.icon, { className: "w-7 h-7 text-custom-green-600" })}
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold text-gray-800">{category.title}</h1>
                <p className="text-gray-600 mt-1">{category.description}</p>
              </div>
            </div>
          </div>
        </section>

        <HelpSupportBanner />

        <div className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <Accordion type="single" collapsible className="w-full">
              {category.questions.map((faq, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className="text-lg text-left font-semibold text-gray-700 hover:text-custom-green-600">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-base text-gray-600 leading-relaxed">
                    {faq.a}
                    <FaqAnswerActions question={faq.q} text={faq.shareText} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <HelpContactBlock />
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default HelpCategoryPage;

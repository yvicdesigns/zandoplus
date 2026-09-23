import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { getCategoryBySlug } from '@/lib/helpContent';
import HelpSupportBanner from '@/components/help/HelpSupportBanner';
import HelpContactBlock from '@/components/help/HelpContactBlock';

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

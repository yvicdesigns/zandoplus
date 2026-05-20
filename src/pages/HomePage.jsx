import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/customSupabaseClient';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Loader2 } from 'lucide-react';

const HeroSection = lazy(() => import('@/components/home/HeroSection'));
const ListingsSection = lazy(() => import('@/components/home/ListingsSection'));
const CategoriesSection = lazy(() => import('@/components/home/CategoriesSection'));
const StatsSection = lazy(() => import('@/components/home/StatsSection'));
const CtaSection = lazy(() => import('@/components/home/CtaSection'));

const FullPageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
    <Loader2 className="w-12 h-12 animate-spin text-custom-green-500" />
  </div>
);

const HomePage = () => {
  const [categoryCounts, setCategoryCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const { siteSettings, loading: settingsLoading } = useSiteSettings();

  useEffect(() => {
    const fetchHomePageData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_category_listing_counts');
        if (error) {
          console.error("Erreur lors de la récupération du nombre d'annonces par catégorie:", error);
        } else {
          const countsMap = data.reduce((acc, item) => {
            if (item.category_slug) {
              acc[item.category_slug] = item.listing_count;
            }
            return acc;
          }, {});
          setCategoryCounts(countsMap);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchHomePageData();
  }, []);

  const ogImage = siteSettings?.logo_url;

  if (loading || settingsLoading) {
    return <FullPageLoader />;
  }

  return (
    <>
      <Helmet>
        <title>Zando+ Congo - Achetez et Vendez au Congo Brazzaville</title>
        <meta name="description" content="La première place de marché en ligne du Congo Brazzaville. Découvrez des offres incroyables sur l'électronique, les véhicules, l'immobilier, et plus encore." />
        <link rel="canonical" href="https://www.zandopluscg.com/" />
        <meta property="og:title" content="Zando+ Congo - Achetez et Vendez au Congo Brazzaville" />
        <meta property="og:description" content="La première place de marché en ligne du Congo Brazzaville. Découvrez des offres incroyables sur l'électronique, les véhicules, l'immobilier, et plus encore." />
        <meta property="og:image" content={ogImage || 'https://www.zandopluscg.com/og-image.jpg'} />
        <meta property="og:url" content="https://www.zandopluscg.com/" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://www.zandopluscg.com/#organization",
              "name": "Zando+",
              "alternateName": "Zando Plus",
              "url": "https://www.zandopluscg.com/",
              "logo": "https://www.zandopluscg.com/icons/icon-192x192.png",
              "description": "La première place de marché en ligne du Congo Brazzaville.",
              "founder": {
                "@type": "Person",
                "name": "Tchissambou Van Yvic",
                "jobTitle": "Fondateur & CEO",
                "url": "https://www.zandopluscg.com/about"
              },
              "foundingLocation": {
                "@type": "Place",
                "name": "Brazzaville, Congo"
              },
              "areaServed": "Congo-Brazzaville",
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer support",
                "url": "https://www.zandopluscg.com/contact"
              }
            },
            {
              "@type": "WebSite",
              "@id": "https://www.zandopluscg.com/#website",
              "url": "https://www.zandopluscg.com/",
              "name": "Zando+ Congo",
              "publisher": { "@id": "https://www.zandopluscg.com/#organization" },
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://www.zandopluscg.com/listings?search={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            }
          ]
        })}</script>
      </Helmet>
      <div className="min-h-screen">
        <Suspense fallback={<FullPageLoader />}>
          <HeroSection />
          <ListingsSection />
          <CategoriesSection categoryCounts={categoryCounts} loading={loading} />
          <StatsSection />
          <CtaSection />
        </Suspense>
      </div>
    </>
  );
};

export default HomePage;
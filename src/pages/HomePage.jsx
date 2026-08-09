import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/customSupabaseClient';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Loader2 } from 'lucide-react';

const HeroSection = lazy(() => import('@/components/home/HeroSection'));
const TrustBarSection = lazy(() => import('@/components/home/TrustBarSection'));
const CategoriesSection = lazy(() => import('@/components/home/CategoriesSection'));
const ListingsSection = lazy(() => import('@/components/home/ListingsSection'));
const OffresSection = lazy(() => import('@/components/home/OffresSection'));
const AppBannerSection = lazy(() => import('@/components/home/AppBannerSection'));
const StatsSection = lazy(() => import('@/components/home/StatsSection'));
const GreenBarSection = lazy(() => import('@/components/home/GreenBarSection'));
const NewsletterSection = lazy(() => import('@/components/home/NewsletterSection'));
const CtaSection = lazy(() => import('@/components/home/CtaSection'));
const FeaturedShopsSection = lazy(() => import('@/components/shop/FeaturedShopsSection'));
const HomepageAdBanner = lazy(() => import('@/components/home/HomepageAdBanner'));
const UrgentPopup = lazy(() => import('@/components/home/UrgentPopup'));
import { UrgentSection, BoostedSection } from '@/components/home/PromoSections';

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
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 6000)
        );
        const { data, error } = await Promise.race([
          supabase.rpc('get_category_listing_counts'),
          timeout,
        ]);
        if (!error && data) {
          const countsMap = data.reduce((acc, item) => {
            if (item.category_slug) acc[item.category_slug] = item.listing_count;
            return acc;
          }, {});
          setCategoryCounts(countsMap);
        }
      } catch (e) {
        // timeout ou erreur réseau — on continue sans les counts
      } finally {
        setLoading(false);
      }
    };

    fetchHomePageData();
  }, []);

  const ogImage = siteSettings?.logo_url;

  if (settingsLoading) {
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
        <Suspense fallback={null}>
          <UrgentPopup />
        </Suspense>
        <Suspense fallback={<FullPageLoader />}>
          <HeroSection />
          <StatsSection />
          <UrgentSection />
          <CategoriesSection categoryCounts={categoryCounts} loading={loading} />
          <BoostedSection />
          <HomepageAdBanner placement="after_categories" />
          <ListingsSection />
          <OffresSection />
          <HomepageAdBanner placement="after_listings" />
          <AppBannerSection />
          <FeaturedShopsSection />
          <TrustBarSection />
          <GreenBarSection />
          <NewsletterSection />
          <CtaSection />
        </Suspense>
      </div>
    </>
  );
};

export default HomePage;
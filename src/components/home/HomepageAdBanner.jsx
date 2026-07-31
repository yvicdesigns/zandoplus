import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const HomepageAdBanner = ({ placement }) => {
  const [ads, setAds] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    supabase
      .from('homepage_ads')
      .select('*')
      .eq('placement', placement)
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${today}`)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .then(({ data }) => { if (data?.length) setAds(data); });
  }, [placement]);

  useEffect(() => {
    if (ads.length <= 1) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % ads.length), 6000);
    return () => clearInterval(t);
  }, [ads.length]);

  if (!ads.length) return null;

  const ad = ads[current];
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  if (ad.target === 'mobile' && !isMobile) return null;
  if (ad.target === 'desktop' && isMobile) return null;

  const bg = ad.bg_image_url
    ? { backgroundImage: `url(${ad.bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : ad.image_url
      ? {}
      : { backgroundColor: ad.bg_color || '#005023' };

  const content = (
    <div
      className="relative w-full rounded-2xl overflow-hidden cursor-pointer group"
      style={bg}
      onClick={() => ad.redirect_url && window.open(ad.redirect_url, '_blank', 'noopener')}
    >
      {/* Image mode */}
      {ad.image_url && !ad.ad_title && (
        <img src={ad.image_url} alt={ad.title} className="w-full h-auto object-cover max-h-[220px] sm:max-h-[180px]" />
      )}

      {/* Builder mode */}
      {(ad.ad_title || ad.bg_image_url) && (
        <>
          {ad.bg_image_url && <div className="absolute inset-0 bg-black/30" />}
          <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-5 sm:py-6 min-h-[90px]">
            <div className="flex-1">
              {ad.ad_title && (
                <p className="font-black text-[16px] sm:text-[20px] leading-tight" style={{ color: ad.text_color || '#ffffff' }}>
                  {ad.ad_title}
                </p>
              )}
              {ad.ad_subtitle && (
                <p className="text-[12px] sm:text-[14px] mt-1 opacity-80" style={{ color: ad.text_color || '#ffffff' }}>
                  {ad.ad_subtitle}
                </p>
              )}
            </div>
            {ad.btn_text && (
              <div
                className="ml-4 px-5 py-2.5 rounded-xl text-[13px] font-bold flex-shrink-0 group-hover:opacity-90 transition-opacity"
                style={{ backgroundColor: ad.btn_color || '#ffffff', color: ad.btn_text_color || '#005023' }}
              >
                {ad.btn_text} →
              </div>
            )}
          </div>
        </>
      )}

      {/* Indicateur multiple pubs */}
      {ads.length > 1 && (
        <div className="absolute bottom-2 right-3 flex gap-1">
          {ads.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === current ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`} />
          ))}
        </div>
      )}

      {/* Badge "Sponsorisé" discret */}
      <span className="absolute top-2 left-2 text-[9px] font-semibold text-white/60 bg-black/20 px-1.5 py-0.5 rounded">
        Sponsorisé
      </span>
    </div>
  );

  return (
    <section className="bg-page-bg py-2 sm:py-3">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        {content}
      </div>
    </section>
  );
};

export default HomepageAdBanner;

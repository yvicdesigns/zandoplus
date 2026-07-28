import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const HeroSection = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    supabase
      .from('hero_slides')
      .select('*')
      .eq('is_active', true)
      .order('order', { ascending: true })
      .then(({ data }) => { if (data) setSlides(data); })
      .finally(() => setLoading(false));
  }, []);

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % Math.max(slides.length, 1)), 5000);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length > 1) startTimer();
    return () => clearInterval(timerRef.current);
  }, [slides.length, startTimer]);

  const goTo = (i) => { setCurrent(i); startTimer(); };
  const prev = () => goTo((current - 1 + slides.length) % slides.length);
  const next = () => goTo((current + 1) % slides.length);

  const slide = slides[current] ?? null;

  /* Textes depuis le slide Supabase, fallback = artifact */
  const ctaLabel      = slide?.cta_text           || 'Découvrir les offres';
  const ctaLink       = slide?.cta_link           || '/listings';
  const secLabel      = slide?.secondary_cta_text || 'Voir les nouveautés';
  const secondaryLink = slide?.secondary_cta_link || '/listings?sort=newest';
  const titleLine     = slide?.text_content?.[0]?.spans?.map(s => s.text).join('') || null;
  const subtitleLine  = slide?.text_content?.[1]?.spans?.map(s => s.text).join('') || null;

  /* Côté droit : image du slide OU décor */
  const hasImage = !!slide?.image_url;

  if (loading) return (
    <section className="bg-page-bg pt-4 pb-2">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="h-[340px] rounded-2xl bg-card-bg border border-gray-100 animate-pulse" />
      </div>
    </section>
  );

  return (
    <section className="bg-page-bg pt-4 pb-2">
      <div className="max-w-[1280px] mx-auto px-6 relative">

        {/* ── CARTE HÉRO (fond blanc) ── */}
        <div className="bg-card-bg rounded-2xl overflow-hidden relative flex items-center min-h-[340px] px-10 py-8">

          {/* ── GAUCHE ── */}
          <div className="flex-1 max-w-[480px] pr-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4 }}
              >
                {/* Badge jaune */}
                <span className="inline-block bg-accent-yellow text-gray-900 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-5">
                  Offres du mois
                </span>

                {/* Titre depuis Supabase ou fallback artifact */}
                <h1 className="text-[40px] font-black leading-[1.08] text-gray-900 mb-3">
                  {titleLine
                    ? <span dangerouslySetInnerHTML={{ __html: titleLine }} />
                    : <>Achetez malin,<br /><span className="text-custom-green-500">économisez plus !</span></>
                  }
                </h1>

                {/* Sous-titre */}
                <p className="text-[14px] text-gray-500 leading-relaxed mb-7">
                  {subtitleLine || <>Des milliers de produits de qualité<br />à des prix imbattables.</>}
                </p>

                {/* CTAs — textes + liens depuis Supabase */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Link to={ctaLink}>
                    <button className="h-[46px] px-6 bg-custom-green-500 text-white font-bold text-[14px] rounded-xl hover:bg-custom-green-600 transition-colors">
                      {ctaLabel} &nbsp;→
                    </button>
                  </Link>
                  <Link to={secondaryLink}>
                    <button className="h-[46px] px-6 bg-card-bg text-custom-green-500 font-bold text-[14px] rounded-xl border-2 border-custom-green-500 hover:bg-custom-green-50 transition-colors">
                      {secLabel}
                    </button>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── DROITE ── */}
          <div className="hidden lg:flex w-[380px] shrink-0 items-end justify-center relative self-stretch py-4">
            {hasImage ? (
              /* Image du slide affichée à droite */
              <img src={slide.image_url} alt="" className="relative z-10 h-full max-h-[280px] object-contain" />
            ) : (
              <>
                {/* Cercle jaune décoratif */}
                <div
                  className="absolute bottom-[-24px] right-[-24px] w-[300px] h-[300px] rounded-full"
                  style={{ background: '#fbc401', opacity: 0.2 }}
                />
                {/* Produits flottants */}
                <div className="absolute top-6 right-14 w-[88px] h-[88px] bg-white rounded-2xl shadow-md flex items-center justify-center text-[40px]">🎧</div>
                <div className="absolute top-[115px] right-2 w-[76px] h-[76px] bg-white rounded-2xl shadow-md flex items-center justify-center text-[34px]">⌚</div>
                <div className="absolute bottom-14 right-4 w-[76px] h-[76px] bg-white rounded-2xl shadow-md flex items-center justify-center text-[32px]">👟</div>
                {/* Cercle promo */}
                <div className="relative z-10 mb-6 w-[190px] h-[190px] bg-custom-green-500 rounded-full flex flex-col items-center justify-center text-center px-5 border-4 border-white/20 shadow-lg">
                  <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">Bons plans</span>
                  <span className="text-[11px] font-bold text-white uppercase mt-0.5">du mois</span>
                  <span className="text-[10px] text-white/70 mt-1">Jusqu'à</span>
                  <span className="text-[48px] font-black text-accent-yellow leading-none">-50%</span>
                  <span className="text-[9px] text-white/70 uppercase tracking-wider mt-1 leading-tight">Sur une sélection<br />de produits</span>
                </div>
              </>
            )}
          </div>

          {/* ── Dots (bas centre) ── */}
          {slides.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === current ? 'w-6 bg-custom-green-500' : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Flèches (OUTSIDE la carte) ── */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={next}
              className="absolute right-[-16px] top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </>
        )}
      </div>
    </section>
  );
};

export default HeroSection;

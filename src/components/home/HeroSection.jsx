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
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const { data, error } = await supabase
          .from('hero_slides')
          .select('*')
          .eq('is_active', true)
          .order('order', { ascending: true });
        if (!error && data) setSlides(data);
      } catch (err) {
        console.error('Hero slides error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSlides();
  }, []);

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % Math.max(slides.length, 1));
    }, 5000);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length > 1) startTimer();
    return () => clearInterval(timerRef.current);
  }, [slides.length, startTimer]);

  const goTo = (idx) => {
    setCurrent(idx);
    startTimer();
  };
  const prev = () => goTo((current - 1 + slides.length) % slides.length);
  const next = () => goTo((current + 1) % slides.length);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/listings?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  /* ── helpers pour extraire titre / sous-titre depuis text_content ── */
  const getTitle = (slide) => {
    const lines = slide?.text_content;
    if (!lines?.length) return null;
    return lines[0]?.spans?.map(s => s.text).join('') || null;
  };
  const getSubtitle = (slide) => {
    const lines = slide?.text_content;
    if (!lines || lines.length < 2) return null;
    return lines[1]?.spans?.map(s => s.text).join('') || null;
  };

  /* ── Fallback static (pas de slides) ── */
  const slide = slides[current] ?? null;
  const bgColor = slide?.background_color || '#005023';
  const title = slide ? getTitle(slide) : null;
  const subtitle = slide ? getSubtitle(slide) : null;

  return (
    <section className="bg-page-bg pt-4 pb-2">
      <div className="max-w-[1280px] mx-auto px-6">
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ backgroundColor: bgColor, minHeight: 340 }}
        >
          {/* ── Fond image du slide ── */}
          {slide?.image_url && (
            <img
              src={slide.image_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {slide?.overlay_enabled && (
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: slide.overlay_color
                  ? `${slide.overlay_color}${Math.round((slide.overlay_opacity ?? 0.4) * 255).toString(16).padStart(2,'0')}`
                  : 'rgba(0,0,0,0.4)',
              }}
            />
          )}

          {/* ── Layout split : gauche + droite ── */}
          <div className="relative z-10 flex items-center min-h-[340px] px-10 py-10">

            {/* ── GAUCHE ── */}
            <div className="flex-1 max-w-[480px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.45 }}
                >
                  {/* Badge */}
                  <span className="inline-block bg-accent-yellow text-gray-900 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                    Offres du mois
                  </span>

                  {/* Titre */}
                  <h1 className="text-[38px] font-black leading-[1.08] text-white mb-3">
                    {title
                      ? <span dangerouslySetInnerHTML={{ __html: title }} />
                      : <>Achetez malin,<br /><span className="text-accent-yellow">économisez plus !</span></>
                    }
                  </h1>

                  {/* Sous-titre */}
                  <p className="text-[14px] text-white/75 leading-relaxed mb-7">
                    {subtitle || 'Des milliers de produits de qualité à des prix imbattables.'}
                  </p>

                  {/* CTAs */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {slide?.cta_text && slide?.cta_link ? (
                      <Link to={slide.cta_link}>
                        <button className="h-[46px] px-6 bg-accent-yellow text-gray-900 font-bold text-[14px] rounded-xl hover:opacity-90 transition-opacity">
                          {slide.cta_text} &nbsp;→
                        </button>
                      </Link>
                    ) : (
                      <Link to="/listings">
                        <button className="h-[46px] px-6 bg-accent-yellow text-gray-900 font-bold text-[14px] rounded-xl hover:opacity-90 transition-opacity">
                          Découvrir les offres &nbsp;→
                        </button>
                      </Link>
                    )}
                    {slide?.secondary_cta_text && slide?.secondary_cta_link ? (
                      <Link to={slide.secondary_cta_link}>
                        <button className="h-[46px] px-6 bg-white/15 text-white font-semibold text-[14px] rounded-xl border border-white/30 hover:bg-white/25 transition-colors">
                          {slide.secondary_cta_text}
                        </button>
                      </Link>
                    ) : (
                      <Link to="/listings?sort=newest">
                        <button className="h-[46px] px-6 bg-white/15 text-white font-semibold text-[14px] rounded-xl border border-white/30 hover:bg-white/25 transition-colors">
                          Voir les nouveautés
                        </button>
                      </Link>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── DROITE ── */}
            <div className="hidden lg:flex w-[360px] flex-shrink-0 items-end justify-center relative self-stretch">
              {/* Cercle décoratif jaune */}
              <div
                className="absolute bottom-[-20px] right-[-20px] w-[300px] h-[300px] rounded-full"
                style={{ background: '#fbc401', opacity: 0.18 }}
              />

              {/* Produits flottants */}
              <div className="absolute top-5 right-12 w-[86px] h-[86px] bg-card-bg rounded-2xl shadow-lg flex items-center justify-center text-[38px]">🎧</div>
              <div className="absolute bottom-12 right-2 w-[76px] h-[76px] bg-card-bg rounded-2xl shadow-lg flex items-center justify-center text-[34px]">👟</div>
              <div className="absolute top-[110px] right-2 w-[72px] h-[72px] bg-card-bg rounded-2xl shadow-lg flex items-center justify-center text-[32px]">⌚</div>

              {/* Cercle promo */}
              <div className="relative z-10 mb-8 w-[190px] h-[190px] bg-custom-green-500/90 rounded-full flex flex-col items-center justify-center text-center px-5 border-4 border-white/20">
                <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">Bons plans</span>
                <span className="text-[11px] font-bold text-white uppercase mt-0.5">du mois</span>
                <span className="text-[10px] text-white/70 mt-1">Jusqu'à</span>
                <span className="text-[44px] font-black text-accent-yellow leading-none">-50%</span>
                <span className="text-[9px] text-white/70 uppercase tracking-wider mt-1 leading-tight">Sur une sélection<br/>de produits</span>
              </div>
            </div>
          </div>

          {/* ── Flèches navigation ── */}
          {slides.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/20 hover:bg-white/35 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/20 hover:bg-white/35 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </>
          )}

          {/* ── Points de navigation ── */}
          {slides.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === current
                      ? 'w-6 bg-white'
                      : 'w-2 bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

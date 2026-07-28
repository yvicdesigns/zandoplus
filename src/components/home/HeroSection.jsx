import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselDots } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import { cn } from '@/lib/utils';

const hexToRgba = (hex, alpha) => {
  if (!hex || typeof hex !== 'string' || hex.length < 4) hex = '#000000';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const textAlignClasses = {
  left:   'items-start text-left',
  center: 'items-center text-center',
  right:  'items-end text-right',
};

const HeroSection = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [api, setApi] = useState(null);
  const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: false }));
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSlides = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('hero_slides')
          .select('*')
          .eq('is_active', true)
          .order('order', { ascending: true });
        if (error) throw error;
        setSlides(data);
      } catch (err) {
        console.error('Error fetching hero slides:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSlides();
  }, []);

  const handleFocus = useCallback(() => {
    api?.plugins()?.autoplay?.stop();
  }, [api]);

  const handleBlur = useCallback(() => {
    api?.plugins()?.autoplay?.play();
  }, [api]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/listings?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getSpanStyle = (span) => ({
    color:      span.color      || '#FFFFFF',
    fontSize:   span.size       || '1rem',
    fontWeight: span.weight === 'bold' ? '700' : '400',
    fontStyle:  span.style  === 'italic' ? 'italic' : 'normal',
  });

  /* ── Loading ── */
  if (loading) {
    return (
      <section className="bg-page-bg py-4">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="h-[460px] rounded-2xl bg-card-bg border border-gray-100 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-custom-green-500" />
          </div>
        </div>
      </section>
    );
  }

  /* ── Fallback (aucun slide) ── */
  if (slides.length === 0) {
    return (
      <section className="bg-page-bg py-4">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="h-[460px] rounded-2xl bg-custom-green-500 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl font-black text-white leading-tight"
            >
              Bienvenue sur Zando<span className="text-accent-yellow">+</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-[15px] text-white/80 max-w-lg"
            >
              La première place de marché en ligne du Congo Brazzaville.
            </motion.p>
            <motion.form
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              onSubmit={handleSearchSubmit}
              className="flex w-full max-w-xl mt-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Que recherchez-vous ?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 h-[50px] text-[14px] bg-white rounded-l-xl border-0 outline-none text-gray-800 placeholder:text-gray-400"
                />
              </div>
              <button
                type="submit"
                className="h-[50px] px-7 bg-accent-yellow text-gray-900 font-bold text-[14px] rounded-r-xl hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                Rechercher
              </button>
            </motion.form>
          </div>
        </div>
      </section>
    );
  }

  /* ── Carousel slides ── */
  return (
    <section className="bg-page-bg py-4">
      <div className="max-w-[1280px] mx-auto px-6">
        <Carousel
          setApi={setApi}
          className="w-full rounded-2xl overflow-hidden"
          plugins={[plugin.current]}
          opts={{ loop: true }}
        >
          <CarouselContent>
            {slides.map((slide) => (
              <CarouselItem key={slide.id}>
                <div
                  className="relative h-[460px] w-full"
                  style={{ backgroundColor: slide.image_url ? 'transparent' : (slide.background_color || '#005023') }}
                >
                  {slide.image_url && (
                    <img
                      src={slide.image_url}
                      alt={slide.text_content?.[0]?.spans?.[0]?.text || 'Slide hero'}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  {slide.overlay_enabled && (
                    <div
                      className="absolute inset-0"
                      style={{ backgroundColor: hexToRgba(slide.overlay_color, slide.overlay_opacity) }}
                    />
                  )}

                  <div className={cn(
                    'relative z-10 h-full flex flex-col justify-center px-10 pb-8',
                    textAlignClasses[slide.text_align] || 'items-center text-center'
                  )}>
                    {/* Texte dynamique */}
                    <motion.div
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7 }}
                      className="max-w-2xl w-full"
                    >
                      {slide.text_content?.map((line, lineIndex) => (
                        <p key={lineIndex} className="mb-1 md:mb-2 leading-tight">
                          {line.spans?.map((span, spanIndex) => (
                            <span key={spanIndex} className="break-words" style={getSpanStyle(span)}>
                              {span.text}
                            </span>
                          ))}
                        </p>
                      ))}
                    </motion.div>

                    {/* Boutons CTA */}
                    <motion.div
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, delay: 0.2 }}
                      className="flex flex-wrap gap-3 mt-5"
                    >
                      {slide.cta_text && slide.cta_link && (
                        <Link to={slide.cta_link}>
                          <button className="h-[46px] px-7 bg-accent-yellow text-gray-900 font-bold text-[14px] rounded-xl hover:opacity-90 transition-opacity">
                            {slide.cta_text}
                          </button>
                        </Link>
                      )}
                      {slide.secondary_cta_text && slide.secondary_cta_link && (
                        <Link to={slide.secondary_cta_link}>
                          <button className="h-[46px] px-7 bg-white/20 text-white font-semibold text-[14px] rounded-xl border border-white/40 hover:bg-white/30 transition-colors">
                            {slide.secondary_cta_text}
                          </button>
                        </Link>
                      )}
                    </motion.div>

                    {/* Barre de recherche */}
                    {slide.show_search_bar && (
                      <motion.form
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.35 }}
                        onSubmit={handleSearchSubmit}
                        className="flex w-full max-w-xl mt-6"
                      >
                        <div className="relative flex-1">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Que recherchez-vous ?"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            className="w-full pl-12 pr-4 h-[50px] text-[14px] bg-white rounded-l-xl border-0 outline-none text-gray-800 placeholder:text-gray-400"
                          />
                        </div>
                        <button
                          type="submit"
                          className="h-[50px] px-7 bg-accent-yellow text-gray-900 font-bold text-[14px] rounded-r-xl hover:opacity-90 transition-opacity whitespace-nowrap"
                        >
                          Rechercher
                        </button>
                      </motion.form>
                    )}
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious className="bg-white/20 hover:bg-white/40 border-none text-white left-4 backdrop-blur-sm" />
          <CarouselNext className="bg-white/20 hover:bg-white/40 border-none text-white right-4 backdrop-blur-sm" />
          <CarouselDots />
        </Carousel>
      </div>
    </section>
  );
};

export default HeroSection;

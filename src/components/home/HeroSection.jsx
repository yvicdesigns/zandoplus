import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/customSupabaseClient';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselDots } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import { cn } from '@/lib/utils';

const hexToRgba = (hex, alpha) => {
  if (!hex || typeof hex !== 'string' || hex.length < 4) {
    hex = '#000000';
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const textAlignClasses = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
};

const HeroSection = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
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
      } catch (error) {
        console.error("Error fetching hero slides:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSlides();
  }, []);

  const getSpanStyle = (span) => {
    return {
      color: span.color || '#FFFFFF',
      fontSize: span.size || '1rem',
      fontWeight: span.weight === 'bold' ? '700' : '400',
      fontStyle: span.style === 'italic' ? 'italic' : 'normal',
    };
  };
  
  const handleFocus = useCallback(() => {
    if (api && api.plugins() && api.plugins().autoplay) {
      api.plugins().autoplay.stop();
    }
  }, [api]);

  const handleBlur = useCallback(() => {
    if (api && api.plugins() && api.plugins().autoplay) {
      api.plugins().autoplay.play();
    }
  }, [api]);
  
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/listings?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (loading) {
    return (
      <section className="relative h-[80vh] lg:h-[80vh] flex items-center justify-center bg-gray-100">
        <Loader2 className="w-12 h-12 animate-spin text-custom-green-500" />
      </section>
    );
  }

  if (slides.length === 0) {
    return (
        <section className="relative py-20 lg:py-32 hero-pattern overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-custom-green-600/10 via-teal-600/10 to-transparent"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6"
            >
              Bienvenue sur Zando+
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-base md:text-lg text-gray-600 mb-8 leading-relaxed"
            >
              La première place de marché du Congo Brazzaville.
            </motion.p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <Carousel
      setApi={setApi}
      className="w-full"
      plugins={[plugin.current]}
      opts={{ loop: true }}
    >
      <CarouselContent>
        {slides.map((slide) => (
          <CarouselItem key={slide.id}>
            <div 
              className="relative h-[80vh] lg:h-[80vh] w-full"
              style={{ backgroundColor: slide.image_url ? 'transparent' : slide.background_color }}
            >
              {slide.image_url && (
                <img src={slide.image_url} alt={slide.text_content?.[0]?.spans?.[0]?.text || 'Hero image'} className="absolute inset-0 w-full h-full object-cover" />
              )}
              {slide.overlay_enabled && (
                <div 
                  className="absolute inset-0"
                  style={{ backgroundColor: hexToRgba(slide.overlay_color, slide.overlay_opacity) }}
                ></div>
              )}
              <div className={cn("relative z-10 h-full flex flex-col justify-center p-4 pb-14 sm:pb-4 container mx-auto", textAlignClasses[slide.text_align] || 'items-center text-center')}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="max-w-4xl w-full"
                >
                  {slide.text_content && slide.text_content.map((line, lineIndex) => (
                    <p key={lineIndex} className="mb-1 md:mb-2" style={{ lineHeight: 1.2 }}>
                      {line.spans && line.spans.map((span, spanIndex) => (
                        <span 
                          key={spanIndex}
                          className="break-words"
                          style={getSpanStyle(span)}
                        >
                          {span.text}
                        </span>
                      ))}
                    </p>
                  ))}
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center mt-4"
                >
                  {slide.cta_text && slide.cta_link && (
                    <Link to={slide.cta_link}>
                      <Button size="lg" className="gradient-bg hover:opacity-90 rounded-full px-8 py-3 text-base">
                        {slide.cta_text}
                      </Button>
                    </Link>
                  )}
                  {slide.secondary_cta_text && slide.secondary_cta_link && (
                    <Link to={slide.secondary_cta_link} className="hidden sm:block">
                      <Button
                        size="lg"
                        variant="outline"
                        className="rounded-full px-8 py-3 text-base bg-white text-custom-green-500 border-custom-green-500 hover:bg-custom-green-50"
                      >
                        {slide.secondary_cta_text}
                      </Button>
                    </Link>
                  )}
                </motion.div>

                {slide.show_search_bar && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="max-w-2xl w-full mt-8 relative z-20"
                  >
                    <form onSubmit={handleSearchSubmit}>
                      {/* Mobile: input + button stacked — Desktop: button inside input */}
                      <div className="flex flex-col sm:hidden gap-2">
                        <div className="relative">
                          <Input
                            type="text"
                            placeholder="Que recherchez-vous ?"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 h-10 text-sm rounded-full border-2 border-white/30 focus:border-white bg-white/90 text-gray-800 placeholder-gray-500"
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                          />
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                        </div>
                        <Button type="submit" className="w-full h-9 rounded-full text-sm gradient-bg hover:opacity-90">
                          <Search className="w-3.5 h-3.5 mr-1.5" />
                          Rechercher
                        </Button>
                      </div>

                      {/* Desktop: button inside input */}
                      <div className="relative hidden sm:block">
                        <Input
                          type="text"
                          placeholder="Que recherchez-vous aujourd'hui ?"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-12 pr-36 py-4 h-14 text-base rounded-full border-2 border-white/30 focus:border-white bg-white/20 text-black placeholder-gray-600"
                          onFocus={handleFocus}
                          onBlur={handleBlur}
                        />
                        <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-800 w-6 h-6" />
                        <Button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full px-6 h-10 text-base gradient-bg hover:opacity-90">
                          Rechercher
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="bg-white/30 hover:bg-white/50 border-none text-white left-4" />
      <CarouselNext className="bg-white/30 hover:bg-white/50 border-none text-white right-4" />
      <CarouselDots />
    </Carousel>
  );
};

export default HeroSection;
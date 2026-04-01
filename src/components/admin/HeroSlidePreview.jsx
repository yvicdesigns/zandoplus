import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

const hexToRgba = (hex, alpha) => {
  if (!hex || typeof hex !== 'string' || hex.length < 4) {
    hex = '#000000';
  }
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const textAlignClasses = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
};

const HeroSlidePreview = ({ slideData, imageUrl }) => {

  const getSpanStyle = (span) => {
    return {
      color: span.color || '#FFFFFF',
      fontSize: span.size || '1rem',
      fontWeight: span.weight === 'bold' ? '700' : '400',
      fontStyle: span.style === 'italic' ? 'italic' : 'normal',
    };
  };

  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow-lg border bg-gray-100">
      <div 
        className="relative h-full w-full"
        style={{ backgroundColor: !imageUrl ? slideData.background_color : 'transparent' }}
      >
        {imageUrl && (
          <img src={imageUrl} alt="Aperçu de la bannière" className="absolute inset-0 w-full h-full object-cover" />
        )}
        {slideData.overlay_enabled && (
          <div 
            className="absolute inset-0"
            style={{ backgroundColor: hexToRgba(slideData.overlay_color, slideData.overlay_opacity) }}
          ></div>
        )}
        <div className={cn("relative z-10 h-full flex flex-col justify-center p-4", textAlignClasses[slideData.text_align] || 'items-center text-center')}>
          <div className="max-w-4xl w-full">
            {slideData.text_content && slideData.text_content.map((line, lineIndex) => (
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
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
            {slideData.cta_text && (
              <Button size="sm" className="gradient-bg hover:opacity-90 rounded-full px-4 py-2 text-xs">
                {slideData.cta_text}
              </Button>
            )}
            {slideData.secondary_cta_text && (
               <Button 
                size="sm" 
                variant="outline" 
                className="rounded-full px-4 py-2 text-xs bg-white text-custom-green-500 border-custom-green-500 hover:bg-custom-green-50"
              >
                {slideData.secondary_cta_text}
              </Button>
            )}
          </div>

          {slideData.show_search_bar && (
            <div className="max-w-md w-full mt-6">
              <div className="relative">
                <Input
                  type="text"
                  name="search"
                  placeholder="Que recherchez-vous... ?"
                  className="w-full pl-10 pr-24 py-2 h-10 text-sm rounded-full border-2 border-white/30 focus:border-white bg-white/20 text-white placeholder-white/80"
                  readOnly
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white w-4 h-4" />
                <Button type="button" className="absolute right-1 top-1/2 transform -translate-y-1/2 rounded-full px-4 h-8 text-xs gradient-bg hover:opacity-90">
                  Rechercher
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroSlidePreview;
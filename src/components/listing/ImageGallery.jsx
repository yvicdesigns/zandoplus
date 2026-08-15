import React, { useState } from 'react';
import { Heart, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

const ImageGallery = ({ listing, isFavorite, toggleFavorite }) => {
  const [current, setCurrent] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  if (!listing) return null;

  const images = listing.images?.length > 0
    ? listing.images
    : ['https://via.placeholder.com/800x600?text=Image+Indisponible'];

  const prev = (e) => { e?.stopPropagation(); setCurrent(c => (c === 0 ? images.length - 1 : c - 1)); };
  const next = (e) => { e?.stopPropagation(); setCurrent(c => (c === images.length - 1 ? 0 : c + 1)); };

  return (
    <>
      <div className="flex gap-3">
        {/* Thumbnails — colonne gauche */}
        {images.length > 1 && (
          <div className="flex flex-col gap-2 w-[72px] flex-shrink-0">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-[72px] h-[72px] rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-white ${
                  i === current
                    ? 'border-custom-green-500 shadow-sm'
                    : 'border-gray-200 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-contain p-1" />
              </button>
            ))}
          </div>
        )}

        {/* Image principale */}
        <div
          className="flex-1 relative bg-white rounded-2xl overflow-hidden cursor-zoom-in border border-gray-100"
          style={{ aspectRatio: '1 / 1' }}
          onClick={() => setZoomOpen(true)}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={current}
              src={images[current]}
              alt={listing.title}
              className="w-full h-full object-contain p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            />
          </AnimatePresence>

          {/* Bouton favori */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleFavorite(); }}
            className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform z-10"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>

          {/* Flèches navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full shadow flex items-center justify-center hover:bg-white transition-colors z-10"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full shadow flex items-center justify-center hover:bg-white transition-colors z-10"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </>
          )}

          {/* Compteur */}
          {images.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-[11px] font-medium px-2.5 py-1 rounded-full z-10">
              {current + 1} / {images.length}
            </div>
          )}
        </div>
      </div>

      {/* Modal zoom */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent
          className="max-w-none w-screen h-screen bg-black/90 border-none p-4 flex items-center justify-center [&>button:last-of-type]:hidden"
          onClick={() => setZoomOpen(false)}
        >
          <motion.img
            key={current}
            src={images[current]}
            alt={listing.title}
            className="max-h-full max-w-full object-contain"
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          {images.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                <ChevronLeft className="w-7 h-7 text-white" />
              </button>
              <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                <ChevronRight className="w-7 h-7 text-white" />
              </button>
            </>
          )}
          <button
            onClick={() => setZoomOpen(false)}
            className="absolute top-[calc(1rem+env(safe-area-inset-top))] right-4 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-7 h-7 text-white" />
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageGallery;

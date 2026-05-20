import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Share2, ChevronLeft, ChevronRight, X, Link as LinkIcon, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ListingBadges from '@/components/common/ListingBadges';
import { Dialog, DialogContent, DialogTrigger, DialogOverlay } from "@/components/ui/dialog";
import { motion, AnimatePresence } from 'framer-motion';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const ImageGallery = ({ listing, isFavorite, toggleFavorite }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomModalOpen, setZoomModalOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleClick = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target)) setShareOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!listing) return null;

  const imageList = listing.images && listing.images.length > 0 ? listing.images : ['https://via.placeholder.com/800x600?text=Image+Indisponible'];
  const url = window.location.href;
  const shareText = `${listing.title} — ${listing.price?.toLocaleString()} ${listing.currency || 'FCFA'} sur Zando+`;

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev === imageList.length - 1 ? 0 : prev + 1));
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev === 0 ? imageList.length - 1 : prev - 1));
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + url)}`, '_blank');
    setShareOpen(false);
  };

  const handleFacebook = (e) => {
    e.stopPropagation();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    setShareOpen(false);
  };

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => { setCopied(false); setShareOpen(false); }, 1500);
    } catch {
      toast({ title: "Impossible de copier", variant: "destructive" });
    }
  };

  return (
    <>
      <Card className="overflow-hidden border-0 shadow-lg relative">
        <Dialog open={isZoomModalOpen} onOpenChange={setZoomModalOpen}>
          <DialogTrigger asChild>
            <div className="relative cursor-zoom-in">
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                <img className="w-full h-full object-contain" alt={listing.title} src={imageList[currentImageIndex]} />
              </div>

              {imageList.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {imageList.length}
                </div>
              )}
            </div>
          </DialogTrigger>
          <AnimatePresence>
            {isZoomModalOpen && (
              <DialogContent 
                className="max-w-none w-screen h-screen bg-black/80 border-none shadow-none p-4 flex flex-col justify-center items-center"
                onClick={() => setZoomModalOpen(false)}
              >
                <motion.img
                  key={imageList[currentImageIndex]}
                  src={imageList[currentImageIndex]}
                  alt={listing.title}
                  className="max-h-full max-w-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                />
                
                {imageList.length > 1 && (
                  <>
                    <Button size="icon" variant="ghost" onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 h-14 w-14 bg-black/30 text-white rounded-full hover:bg-black/50 transition-colors">
                      <ChevronLeft className="w-8 h-8" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 h-14 w-14 bg-black/30 text-white rounded-full hover:bg-black/50 transition-colors">
                      <ChevronRight className="w-8 h-8" />
                    </Button>
                  </>
                )}
                 <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setZoomModalOpen(false); }} className="absolute top-4 right-4 h-14 w-14 bg-black/30 text-white rounded-full hover:bg-black/50 transition-colors">
                   <X className="w-8 h-8" />
                 </Button>
                 
                {imageList.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-base">
                        {currentImageIndex + 1} / {imageList.length}
                    </div>
                )}
              </DialogContent>
            )}
          </AnimatePresence>
        </Dialog>
        
        {imageList.length > 1 && (
             <Button size="icon" variant="ghost" onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </Button>
        )}
        {imageList.length > 1 && (
             <Button size="icon" variant="ghost" onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors">
              <ChevronRight className="w-6 h-6" />
            </Button>
        )}

        <div className="absolute top-4 left-4 z-10">
          <ListingBadges listing={listing} seller={listing.seller} />
        </div>

        <div className="absolute top-4 right-4 flex space-x-2 z-10">
          <Button size="icon" variant="ghost" onClick={toggleFavorite} className="bg-white/90 rounded-full h-10 w-10 hover:bg-white transition-colors">
            <Heart className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'}`} />
          </Button>

          {/* Share button with dropdown */}
          <div className="relative" ref={shareRef}>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); setShareOpen(p => !p); }}
              className="bg-white/90 rounded-full h-10 w-10 hover:bg-white transition-colors"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </Button>

            {shareOpen && (
              <div className="absolute top-12 right-0 bg-white rounded-2xl shadow-xl border p-2 w-52 z-50">
                <div className="flex items-center justify-between mb-2 px-2 pt-1">
                  <span className="text-sm font-semibold text-gray-700">Partager via</span>
                  <button onClick={(e) => { e.stopPropagation(); setShareOpen(false); }} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-green-50 text-green-600 font-medium transition-colors text-sm"
                >
                  <WhatsAppIcon /> WhatsApp
                </button>
                <button
                  onClick={handleFacebook}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-blue-50 text-blue-600 font-medium transition-colors text-sm"
                >
                  <FacebookIcon /> Facebook
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition-colors text-sm"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <LinkIcon className="w-4 h-4" />}
                  {copied ? 'Lien copié !' : 'Copier le lien'}
                </button>
              </div>
            )}
          </div>
        </div>


        {imageList.length > 1 && (
          <div className="p-2 sm:p-4">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {imageList.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border-2 transition-all duration-200 bg-gray-100 ${
                    index === currentImageIndex ? 'border-custom-green-500 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img className="w-full h-full object-contain" alt={`${listing.title} - Image ${index + 1}`} src={image} />
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>
    </>
  );
};

export default ImageGallery;
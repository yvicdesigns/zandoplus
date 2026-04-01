import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Share2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ListingBadges from '@/components/common/ListingBadges';
import { Dialog, DialogContent, DialogTrigger, DialogOverlay } from "@/components/ui/dialog";
import { motion, AnimatePresence } from 'framer-motion';

const ImageGallery = ({ listing, isFavorite, toggleFavorite }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomModalOpen, setZoomModalOpen] = useState(false);
  const { toast } = useToast();
  
  if (!listing) return null;

  const imageList = listing.images && listing.images.length > 0 ? listing.images : ['https://via.placeholder.com/800x600?text=Image+Indisponible'];

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev === imageList.length - 1 ? 0 : prev + 1));
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev === 0 ? imageList.length - 1 : prev - 1));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Lien copié !", description: "Le lien de l'annonce a été copié." });
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
          <Button size="icon" variant="ghost" onClick={handleShare} className="bg-white/90 rounded-full h-10 w-10 hover:bg-white transition-colors">
            <Share2 className="w-5 h-5 text-gray-600" />
          </Button>
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
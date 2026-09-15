import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Link as LinkIcon, Check } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { useToast } from '@/components/ui/use-toast';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const PublishSuccessScreen = ({ listing, onDone }) => {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const url = `https://www.zandopluscg.com/listings/${listing.listing_slug || listing.id}`;
  const text = `Regardez ce que je viens de publier sur Zando+ : ${listing.title}`;

  const handleWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`, '_blank');
  const handleFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Impossible de copier", variant: "destructive" });
    }
  };
  const handleShareClick = () => {
    if (Capacitor.isNativePlatform()) {
      Share.share({ title: listing.title, text, url }).catch(() => {});
    } else if (typeof navigator.share === 'function') {
      navigator.share({ title: listing.title, text, url }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  return (
    <div className="text-center py-4 px-2 sm:px-6">
      <div className="w-16 h-16 bg-custom-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-9 h-9 text-custom-green-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Votre annonce est en ligne !</h2>
      <p className="text-gray-500 mb-6">Partagez-la maintenant pour avoir vos premières vues plus vite.</p>

      <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3 mb-6 text-left max-w-sm mx-auto">
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
          {listing.images?.[0] && <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-gray-900 truncate">{listing.title}</p>
          {listing.price != null && (
            <p className="text-[13px] font-black text-custom-green-600">{Number(listing.price).toLocaleString('fr-FR')} {listing.currency || 'FCFA'}</p>
          )}
        </div>
      </div>

      <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Envoyez-la à vos amis, votre famille, vos groupes
      </p>

      <div className="grid grid-cols-2 gap-2.5 max-w-sm mx-auto mb-3">
        <button onClick={handleWhatsApp} className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold text-[13px] py-3 rounded-xl hover:opacity-90 transition-opacity">
          <WhatsAppIcon /> WhatsApp
        </button>
        <button onClick={handleFacebook} className="flex items-center justify-center gap-2 bg-[#1877F2] text-white font-semibold text-[13px] py-3 rounded-xl hover:opacity-90 transition-opacity">
          <FacebookIcon /> Facebook
        </button>
      </div>

      <div className="max-w-sm mx-auto mb-8">
        <button onClick={handleShareClick} className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-semibold text-[13px] py-3 rounded-xl hover:bg-gray-50 transition-colors">
          {copied ? <Check className="w-4 h-4 text-custom-green-500" /> : <LinkIcon className="w-4 h-4" />}
          {copied ? 'Lien copié !' : "Plus d'options de partage"}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 justify-center max-w-sm mx-auto">
        <Link to={`/listings/${listing.listing_slug || listing.id}`} className="flex-1 h-11 flex items-center justify-center border border-gray-200 rounded-xl text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          Voir mon annonce
        </Link>
        <button onClick={onDone} className="flex-1 h-11 flex items-center justify-center gap-1.5 gradient-bg text-white rounded-xl text-[13px] font-semibold hover:opacity-90 transition-opacity">
          Terminé <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default PublishSuccessScreen;

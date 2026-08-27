import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { X } from 'lucide-react';

const AdBanner = ({ position = 'listings' }) => {
  const [ad, setAd]           = useState(null);
  const [closed, setClosed]   = useState(false);

  useEffect(() => {
    supabase
      .from('advertisements')
      .select('id, image_url, link_url, title')
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .limit(10)
      .then(({ data }) => {
        if (data?.length) {
          // Pick a random active ad
          setAd(data[Math.floor(Math.random() * data.length)]);
        }
      });
  }, []);

  if (!ad || closed) return null;

  const content = (
    <div className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
      <img
        src={ad.image_url}
        alt={ad.title || 'Publicité'}
        className="w-full h-24 sm:h-28 object-cover"
      />
      <span className="absolute bottom-1 left-2 text-[9px] text-white/70 bg-black/30 rounded px-1">Publicité</span>
      <button
        onClick={(e) => { e.preventDefault(); setClosed(true); }}
        className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center"
        aria-label="Fermer la publicité"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );

  return (
    <div className="my-4">
      {ad.link_url
        ? <a href={ad.link_url} target="_blank" rel="noopener noreferrer sponsored">{content}</a>
        : content
      }
    </div>
  );
};

export default AdBanner;

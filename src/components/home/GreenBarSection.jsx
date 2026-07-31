import React, { useEffect, useState, useRef } from 'react';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Link } from 'react-router-dom';

const GreenBarSection = () => {
  const [sellers, setSellers] = useState([]);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, shop_slug')
      .eq('verified', true)
      .limit(24)
      .then(({ data }) => { if (data?.length) setSellers(data); });
  }, []);

  if (!sellers.length) return null;

  // Répéter assez pour que le flux soit dense, puis doubler pour la boucle
  const MIN_ITEMS = 30;
  const times = Math.max(2, Math.ceil(MIN_ITEMS / sellers.length));
  const base = Array(times).fill(sellers).flat();
  const track = [...base, ...base];

  return (
    <section className="bg-page-bg py-5">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 mb-3 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-custom-green-600 flex-shrink-0" />
        <p className="text-gray-700 text-[12px] sm:text-[13px] font-bold tracking-wide">
          Vendeurs certifiés Zando+
        </p>
        <div className="flex-1 h-px bg-gray-200 ml-2" />
      </div>

      {/* Marquee — fade aligné sur les bords du container 1280px */}
      <div className="max-w-[1280px] mx-auto">
      <div
        className="overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
        }}
      >
        <div className="flex animate-marquee" style={{ width: 'max-content' }}>
          {track.map((seller, i) => (
            <Link
              key={`${seller.id}-${i}`}
              to={seller.shop_slug ? `/shop/${seller.shop_slug}` : `/profile/${seller.id}`}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
              style={{ paddingRight: '20px' }}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white border-2 border-gray-200 overflow-hidden flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:border-custom-green-400 transition-all duration-200">
                {seller.avatar_url ? (
                  <img
                    src={seller.avatar_url}
                    alt={seller.full_name}
                    className="w-full h-full object-cover"
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <span className="text-custom-green-600 text-[18px] font-black">
                    {(seller.full_name || '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-[9px] sm:text-[10px] font-semibold text-center max-w-[56px] truncate">
                {seller.full_name?.split(' ')[0] || 'Vendeur'}
              </p>
            </Link>
          ))}
        </div>
      </div>
      </div>
    </section>
  );
};

export default GreenBarSection;

import React, { useState, useEffect } from 'react';
import { Bell, Tag, Package } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const features = [
  { icon: Bell,    text: 'Notifications en temps réel sur vos commandes' },
  { icon: Tag,     text: 'Offres exclusives sur l\'app' },
  { icon: Package, text: 'Suivi de commande facile et rapide' },
];

const IMG_SIZE_W = { sm: 'w-[70px]', md: 'w-[100px]', lg: 'w-[130px]', xl: 'w-[160px]' };

// Zando+ est en ligne sur les deux stores — liens directs vers les fiches réelles.
const STORE_URLS = {
  android: 'https://play.google.com/store/apps/details?id=com.zando.app',
  ios: 'https://apps.apple.com/app/id6800881634',
};

/* ── Bouton store ── */
const StoreButton = ({ store }) => (
  <a href={STORE_URLS[store]} target="_blank" rel="noopener noreferrer" className="w-fit hover:opacity-80 active:opacity-60 transition-opacity">
    <img
      src={store === 'android' ? '/play-store.png' : '/app-store.png'}
      alt={store === 'android' ? 'Google Play' : 'App Store'}
      className="h-16 w-auto object-contain"
    />
  </a>
);

/* ── Carte mobile dynamique ── */
const MobileCard = ({ card }) => {
  const imgLeft = card.image_position === 'left';
  const sizeW   = IMG_SIZE_W[card.image_size] || 'w-[100px]';
  const isApp   = card.key === 'app';

  const imgBlock = card.image_url ? (
    <div className={`${sizeW} flex-shrink-0 flex items-end justify-center self-stretch overflow-hidden`}>
      <img src={card.image_url} alt="" className="w-full h-auto object-contain object-bottom"
        onError={e => { e.currentTarget.style.display = 'none'; }} />
    </div>
  ) : null;

  return (
    <div className="rounded-2xl overflow-hidden flex items-center min-h-[130px]" style={{ backgroundColor: card.bg_color }}>
      {imgLeft && imgBlock}
      <div className="flex-1 px-5 py-5 z-10">
        <p className="text-[15px] font-black uppercase leading-tight mb-1.5" style={{ color: card.text_color }}>
          {card.title}
        </p>
        <p className="text-[11px] leading-snug mb-3" style={{ color: card.text_color, opacity: 0.75 }}>
          {card.subtitle}
        </p>
        {isApp ? (
          <div className="flex flex-row gap-2">
            <StoreButton store="android" />
            <StoreButton store="ios" />
          </div>
        ) : card.btn_enabled && card.btn_text ? (
          <a href={card.btn_link || '#'}
            className="inline-block text-[11px] font-bold px-4 py-1.5 rounded-lg"
            style={{ backgroundColor: card.text_color, color: card.bg_color }}>
            {card.btn_text}
          </a>
        ) : null}
      </div>
      {!imgLeft && imgBlock}
    </div>
  );
};

/* ── Section principale ── */
const AppBannerSection = () => {
  const [cards, setCards]           = useState([]);
  const [desktopImg, setDesktopImg] = useState(null);

  useEffect(() => {
    // Cartes mobiles depuis home_cards
    supabase.from('home_cards').select('*').eq('enabled', true).order('order', { ascending: true })
      .then(({ data }) => { if (data) setCards(data); });

    // Image bannière desktop depuis site_visuals (legacy)
    supabase.from('site_visuals').select('key, image_url').eq('key', 'desktop_banner')
      .then(({ data }) => { if (data?.[0]) setDesktopImg(data[0].image_url); });
  }, []);

  return (
      <section className="py-0 sm:py-6 bg-page-bg">
        <div className="max-w-[1280px] mx-auto sm:px-6">

          {/* Mobile : cartes dynamiques */}
          {cards.length > 0 && (
            <div className="sm:hidden flex flex-col gap-3 px-4 py-6">
              {cards.map(card => (
                <MobileCard key={card.key} card={card} />
              ))}
            </div>
          )}

          {/* Desktop : bannière admin ou layout par défaut */}
          {desktopImg ? (
            <div className="hidden sm:block rounded-2xl overflow-hidden">
              <img src={desktopImg} alt="Bannière" className="w-full h-auto object-cover" />
            </div>
          ) : (
            <div className="hidden sm:flex bg-category-card rounded-2xl overflow-hidden items-stretch gap-8 pr-10">
              <div className="flex-shrink-0 flex items-end pl-4">
                <img src="/phone-coupe.png" alt="Zando+ App" className="h-[260px] w-auto object-contain object-bottom" />
              </div>
              <div className="flex-1 py-8">
                <h2 className="text-[22px] font-black text-gray-900 leading-tight">Téléchargez l'application</h2>
                <h2 className="text-[22px] font-black text-custom-green-500 leading-tight mb-2">ZANDO+</h2>
                <p className="text-[13px] text-gray-500 mb-5">Plus rapide, plus simple, plus proche de vous !</p>
                <div className="flex flex-col gap-3">
                  {features.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-custom-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-[12px] text-gray-700">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0 flex flex-row justify-center items-center gap-3">
                <StoreButton store="android" />
                <StoreButton store="ios" />
              </div>
            </div>
          )}

        </div>
      </section>
  );
};

export default AppBannerSection;

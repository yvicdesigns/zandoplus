import React, { useState, useEffect } from 'react';
import { Bell, Tag, Package, Lock, X, Clock } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const features = [
  { icon: Bell,    text: 'Notifications en temps réel sur vos commandes' },
  { icon: Tag,     text: 'Offres exclusives sur l\'app' },
  { icon: Package, text: 'Suivi de commande facile et rapide' },
];

const IMG_SIZE_W = { sm: 'w-[70px]', md: 'w-[100px]', lg: 'w-[130px]', xl: 'w-[160px]' };

/* ── Popup "Bientôt disponible" ── */
const ComingSoonPopup = ({ store, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0" onClick={onClose}>
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
    <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10" onClick={e => e.stopPropagation()}>
      <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
        <X className="w-4 h-4 text-gray-600" />
      </button>
      <div className="w-14 h-14 bg-custom-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Clock className="w-7 h-7 text-custom-green-500" />
      </div>
      <h3 className="text-[18px] font-black text-gray-900 text-center mb-2">Bientôt disponible !</h3>
      <p className="text-[13px] text-gray-500 text-center leading-relaxed">
        L'application <strong className="text-gray-800">Zando+</strong> sera très bientôt disponible sur{' '}
        <strong className="text-gray-800">{store === 'android' ? 'Google Play' : 'l\'App Store'}</strong>.
      </p>
      <p className="text-[12px] text-custom-green-600 text-center mt-3 font-semibold">Restez connecté, ça arrive vite !</p>
      <button onClick={onClose} className="mt-5 w-full h-11 bg-custom-green-500 hover:bg-custom-green-600 text-white font-bold text-[14px] rounded-xl transition-colors">
        OK, j'attends !
      </button>
    </div>
  </div>
);

/* ── Bouton store ── */
const StoreButton = ({ store, onOpenPopup }) => (
  <button onClick={() => onOpenPopup(store)} className="w-fit hover:opacity-80 active:opacity-60 transition-opacity">
    <img
      src={store === 'android' ? '/play-store.png' : '/app-store.png'}
      alt={store === 'android' ? 'Google Play' : 'App Store'}
      className="h-16 w-auto object-contain"
    />
  </button>
);

/* ── Carte mobile dynamique ── */
const MobileCard = ({ card, onOpenPopup }) => {
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
            <StoreButton store="android" onOpenPopup={onOpenPopup} />
            <StoreButton store="ios"     onOpenPopup={onOpenPopup} />
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
  const [popupStore, setPopupStore] = useState(null);

  useEffect(() => {
    // Cartes mobiles depuis home_cards
    supabase.from('home_cards').select('*').eq('enabled', true).order('order', { ascending: true })
      .then(({ data }) => { if (data) setCards(data); });

    // Image bannière desktop depuis site_visuals (legacy)
    supabase.from('site_visuals').select('key, image_url').eq('key', 'desktop_banner')
      .then(({ data }) => { if (data?.[0]) setDesktopImg(data[0].image_url); });
  }, []);

  return (
    <>
      <section className="py-0 sm:py-6 bg-page-bg">
        <div className="max-w-[1280px] mx-auto sm:px-6">

          {/* Mobile : cartes dynamiques */}
          {cards.length > 0 && (
            <div className="sm:hidden flex flex-col gap-3 px-4 py-6">
              {cards.map(card => (
                <MobileCard key={card.key} card={card} onOpenPopup={setPopupStore} />
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
                <button onClick={() => setPopupStore('android')} className="hover:opacity-80 active:opacity-60 transition-opacity">
                  <img src="/play-store.png" alt="Google Play" className="h-16 w-auto object-contain" />
                </button>
                <button onClick={() => setPopupStore('ios')} className="hover:opacity-80 active:opacity-60 transition-opacity">
                  <img src="/app-store.png" alt="App Store" className="h-16 w-auto object-contain" />
                </button>
              </div>
            </div>
          )}

        </div>
      </section>

      {popupStore && <ComingSoonPopup store={popupStore} onClose={() => setPopupStore(null)} />}
    </>
  );
};

export default AppBannerSection;

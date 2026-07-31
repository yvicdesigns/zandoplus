import React, { useState, useEffect } from 'react';
import { Bell, Tag, Package, Lock, Truck, X, Clock } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const features = [
  { icon: Bell,    text: 'Notifications en temps réel sur vos commandes' },
  { icon: Tag,     text: 'Offres exclusives sur l\'app' },
  { icon: Package, text: 'Suivi de commande facile et rapide' },
];

/* ── Popup "Bientôt disponible" ── */
const ComingSoonPopup = ({ store, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0" onClick={onClose}>
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
    <div
      className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10"
      onClick={e => e.stopPropagation()}
    >
      {/* Close */}
      <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
        <X className="w-4 h-4 text-gray-600" />
      </button>

      {/* Icône */}
      <div className="w-14 h-14 bg-custom-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Clock className="w-7 h-7 text-custom-green-500" />
      </div>

      <h3 className="text-[18px] font-black text-gray-900 text-center mb-2">
        Bientôt disponible !
      </h3>
      <p className="text-[13px] text-gray-500 text-center leading-relaxed">
        L'application <strong className="text-gray-800">Zando+</strong> sera très bientôt disponible sur{' '}
        <strong className="text-gray-800">{store === 'android' ? 'Google Play' : 'l\'App Store'}</strong>.
      </p>
      <p className="text-[12px] text-custom-green-600 text-center mt-3 font-semibold">
        Restez connecté, ça arrive vite !
      </p>

      <button
        onClick={onClose}
        className="mt-5 w-full h-11 bg-custom-green-500 hover:bg-custom-green-600 text-white font-bold text-[14px] rounded-xl transition-colors"
      >
        OK, j'attends !
      </button>
    </div>
  </div>
);

/* ── Bouton store cliquable ── */
const StoreButton = ({ store, label, subLabel, onOpenPopup, className = '' }) => (
  <button
    onClick={() => onOpenPopup(store)}
    className={`flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 w-fit hover:bg-white/20 transition-colors ${className}`}
  >
    <span className="text-white text-[13px]">{store === 'android' ? '▶' : ''}</span>
    <div>
      <p className="text-white/60 text-[8px] leading-none">{subLabel}</p>
      <p className="text-white text-[11px] font-bold leading-tight">{label}</p>
    </div>
  </button>
);

/* ── Cartes mobile ── */
const MobileCards = ({ banners, onOpenPopup }) => {
  const deliveryImg = banners?.card_delivery?.image_url || '/camion.png';
  const appImg      = banners?.card_app?.image_url      || '/telephone2.png';

  return (
    <div className="sm:hidden flex flex-col gap-3 px-4 py-6">

      {/* Carte 1 — Livraison */}
      <div className="bg-custom-green-700 rounded-2xl overflow-hidden flex items-center min-h-[130px] relative">
        <div className="flex-1 px-5 py-5 z-10">
          <p className="text-white text-[15px] font-black uppercase leading-tight mb-1.5">
            Livraison rapide<br />partout au Congo
          </p>
          <p className="text-white/70 text-[11px] leading-snug mb-3">
            À Brazzaville, Pointe-Noire<br />et dans toutes les villes.
          </p>
          <a href="/help" className="inline-block bg-white text-custom-green-700 text-[11px] font-bold px-4 py-1.5 rounded-lg">
            En savoir plus
          </a>
        </div>
        <div className="w-[130px] flex-shrink-0 flex items-end justify-center self-stretch">
          <img
            src={deliveryImg}
            alt="Livraison"
            className="w-full h-auto object-contain object-bottom"
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      </div>

      {/* Carte 2 — Paiements */}
      <div className="bg-accent-yellow rounded-2xl overflow-hidden flex items-center min-h-[130px]">
        <div className="flex-1 px-5 py-5">
          <p className="text-gray-900 text-[15px] font-black uppercase leading-tight mb-1.5">
            Paiements<br />sécurisés
          </p>
          <p className="text-gray-700 text-[11px] leading-snug mb-3">
            Achetez en toute tranquillité avec<br />nos moyens de paiement fiables.
          </p>
          <div className="flex items-center gap-2">
            <span className="bg-white text-[10px] font-black text-blue-700 px-2.5 py-1 rounded-md tracking-wide">VISA</span>
            <span className="bg-white text-[10px] font-black text-red-600 px-2 py-1 rounded-md">MC</span>
            <span className="bg-white text-[10px] font-black text-yellow-600 px-2 py-1 rounded-md">MTN</span>
          </div>
        </div>
        <div className="w-[100px] flex-shrink-0 flex items-center justify-center self-stretch">
          <Lock className="w-16 h-16 text-gray-900/20" strokeWidth={1.5} />
        </div>
      </div>

      {/* Carte 3 — App */}
      <div className="bg-gray-900 rounded-2xl overflow-hidden flex items-center min-h-[130px]">
        <div className="flex-1 px-5 py-5">
          <p className="text-white text-[15px] font-black uppercase leading-tight mb-1.5">
            Téléchargez<br />l'App Zando+
          </p>
          <p className="text-white/60 text-[11px] leading-snug mb-3">
            Plus rapide, plus simple,<br />plus proche de vous !
          </p>
          <div className="flex flex-col gap-2">
            <StoreButton store="android" label="Google Play"    subLabel="DISPONIBLE SUR"    onOpenPopup={onOpenPopup} />
            <StoreButton store="ios"     label="l'App Store"    subLabel="Télécharger dans"   onOpenPopup={onOpenPopup} />
          </div>
        </div>
        <div className="w-[110px] flex-shrink-0 flex items-end justify-center self-stretch overflow-hidden">
          <img
            src={appImg}
            alt="App Zando+"
            className="w-full h-auto object-contain object-bottom max-h-[150px]"
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      </div>

    </div>
  );
};

/* ── Section principale ── */
const AppBannerSection = () => {
  const [banners, setBanners] = useState(null);
  const [popupStore, setPopupStore] = useState(null);

  useEffect(() => {
    const tryFetch = (table) =>
      supabase.from(table).select('key, image_url').in('key', ['card_delivery', 'card_app', 'desktop_banner']);

    tryFetch('site_visuals').then(async ({ data, error }) => {
      const rows = data || (error ? (await tryFetch('banners')).data : null);
      if (rows) {
        const map = {};
        rows.forEach(b => { map[b.key] = b; });
        setBanners(map);
      }
    });
  }, []);

  const desktopBannerImg = banners?.desktop_banner?.image_url;

  return (
    <>
      <section className="py-0 sm:py-6 bg-page-bg">
        <div className="max-w-[1280px] mx-auto sm:px-6">

          {/* Mobile : 3 cartes */}
          <MobileCards banners={banners} onOpenPopup={setPopupStore} />

          {/* Desktop : banner original ou image admin */}
          {desktopBannerImg ? (
            <div className="hidden sm:block rounded-2xl overflow-hidden">
              <img src={desktopBannerImg} alt="Bannière" className="w-full h-auto object-cover" />
            </div>
          ) : (
            <div className="hidden sm:flex bg-category-card rounded-2xl overflow-hidden items-stretch gap-8 pr-10">

              {/* Téléphone coupé */}
              <div className="flex-shrink-0 flex items-end pl-4">
                <img
                  src="/phone-coupe.png"
                  alt="Zando+ App"
                  className="h-[260px] w-auto object-contain object-bottom"
                />
              </div>

              {/* Texte + features */}
              <div className="flex-1 py-8">
                <h2 className="text-[22px] font-black text-gray-900 leading-tight">
                  Téléchargez l'application
                </h2>
                <h2 className="text-[22px] font-black text-custom-green-500 leading-tight mb-2">
                  ZANDO+
                </h2>
                <p className="text-[13px] text-gray-500 mb-5">
                  Plus rapide, plus simple, plus proche de vous !
                </p>
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

              {/* Boutons stores desktop */}
              <div className="flex-shrink-0 flex flex-col justify-center gap-3">
                <button
                  onClick={() => setPopupStore('android')}
                  className="w-[155px] bg-gray-900 text-white rounded-xl px-4 py-2.5 flex items-center gap-3 hover:bg-gray-800 transition-colors"
                >
                  <span className="text-[20px] leading-none">▶</span>
                  <div>
                    <p className="text-[9px] opacity-70 leading-none">DISPONIBLE SUR</p>
                    <p className="text-[13px] font-bold leading-tight mt-0.5">Google Play</p>
                  </div>
                </button>
                <button
                  onClick={() => setPopupStore('ios')}
                  className="w-[155px] bg-gray-900 text-white rounded-xl px-4 py-2.5 flex items-center gap-3 hover:bg-gray-800 transition-colors"
                >
                  <span className="text-[20px] leading-none"></span>
                  <div>
                    <p className="text-[9px] opacity-70 leading-none">Télécharger dans</p>
                    <p className="text-[13px] font-bold leading-tight mt-0.5">l'App Store</p>
                  </div>
                </button>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto mb-1 shadow-sm text-[28px]">
                    ▦
                  </div>
                  <p className="text-[10px] text-gray-400">Scannez pour télécharger</p>
                </div>
              </div>

            </div>
          )}

        </div>
      </section>

      {/* Popup "Bientôt disponible" */}
      {popupStore && <ComingSoonPopup store={popupStore} onClose={() => setPopupStore(null)} />}
    </>
  );
};

export default AppBannerSection;

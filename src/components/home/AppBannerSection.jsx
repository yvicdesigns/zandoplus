import React from 'react';
import { Bell, Tag, Package } from 'lucide-react';

const features = [
  { icon: Bell,    text: 'Notifications en temps réel sur vos commandes' },
  { icon: Tag,     text: 'Offres exclusives sur l\'app' },
  { icon: Package, text: 'Suivi de commande facile et rapide' },
];

const AppBannerSection = () => (
  <section className="py-6 bg-page-bg">
    <div className="max-w-[1280px] mx-auto px-6">
      <div className="bg-category-card rounded-2xl px-10 py-8 flex items-center gap-10">

        {/* Mockup téléphone */}
        <div className="flex-shrink-0 w-[110px] h-[190px] bg-custom-green-500 rounded-[22px] flex flex-col items-center justify-center relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-custom-green-400 to-custom-green-600 opacity-60" />
          <div className="relative z-10 text-center px-3">
            <p className="text-white font-black text-[22px] leading-none">
              Zando<span className="text-accent-yellow">+</span>
            </p>
            <span className="mt-2 inline-block bg-accent-yellow text-[#1a1200] text-[8px] font-black px-2 py-0.5 rounded">
              BONS PLANS
            </span>
            <p className="text-white/60 text-[8px] mt-2 leading-tight">
              Catégories populaires
            </p>
          </div>
        </div>

        {/* Texte + features */}
        <div className="flex-1">
          <h2 className="text-[24px] font-black text-gray-900 leading-tight mb-1">
            Téléchargez l'application
          </h2>
          <h2 className="text-[24px] font-black text-custom-green-500 leading-tight mb-2">
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

        {/* Boutons stores + QR */}
        <div className="flex-shrink-0 flex flex-col items-center gap-3">
          <a
            href="https://play.google.com/store"
            target="_blank"
            rel="noopener noreferrer"
            className="w-[155px] bg-gray-900 text-white rounded-xl px-4 py-2.5 flex items-center gap-3 hover:bg-gray-800 transition-colors"
          >
            <span className="text-[20px] leading-none">▶</span>
            <div>
              <p className="text-[9px] opacity-70 leading-none">DISPONIBLE SUR</p>
              <p className="text-[13px] font-bold leading-tight mt-0.5">Google Play</p>
            </div>
          </a>
          <a
            href="https://apps.apple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-[155px] bg-gray-900 text-white rounded-xl px-4 py-2.5 flex items-center gap-3 hover:bg-gray-800 transition-colors"
          >
            <span className="text-[20px] leading-none"></span>
            <div>
              <p className="text-[9px] opacity-70 leading-none">Télécharger dans</p>
              <p className="text-[13px] font-bold leading-tight mt-0.5">l'App Store</p>
            </div>
          </a>
          <div className="text-center">
            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto mb-1 shadow-sm text-[28px]">
              ▦
            </div>
            <p className="text-[10px] text-gray-400">Scannez pour télécharger</p>
          </div>
        </div>

      </div>
    </div>
  </section>
);

export default AppBannerSection;

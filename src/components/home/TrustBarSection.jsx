import React from 'react';

const allItems = [
  { icon: '/icons/bag-sac.png',  title: 'Des milliers',              desc: 'de produits à portée de clic',    mobileTitle: 'Produits' },
  { icon: '/icons/car.png',      title: 'Livraison rapide',          desc: 'à Brazzaville et partout au Congo', mobileTitle: 'Livraison' },
  { icon: '/icons/security.png', title: 'Paiements 100% sécurisés',  desc: 'Achetez en toute confiance',      mobileTitle: 'Sécurisé' },
  { icon: '/icons/casque.png',   title: 'Service client disponible', desc: 'Nous sommes là pour vous',        mobileTitle: 'Support' },
  { icon: '/icons/health.png',   title: 'Produits de qualité',       desc: 'Sélectionnés avec soin pour vous', mobileTitle: 'Qualité' },
];

/* Sur mobile on affiche seulement 4 items */
const mobileItems = allItems.slice(1); // enlève "Des milliers", garde les 4 suivants

const TrustBarSection = () => (
  <div className="pb-4 bg-page-bg">
    <div className="max-w-[1280px] mx-auto px-6 sm:px-6">

      {/* ── DESKTOP (sm+) : layout original ── */}
      <div className="hidden sm:flex bg-card-bg border border-gray-200 rounded-xl px-6 py-4 items-center justify-between">
        {allItems.map((item, i) => (
          <React.Fragment key={item.title}>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-14 h-14 bg-custom-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <img src={item.icon} alt="" className="w-9 h-9 object-contain" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-gray-900 leading-tight">{item.title}</p>
                <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{item.desc}</p>
              </div>
            </div>
            {i < allItems.length - 1 && (
              <div className="w-px h-11 bg-gray-200 flex-shrink-0 mx-2" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── MOBILE : 4 items compacts en grille ── */}
      <div className="sm:hidden bg-card-bg border-2 border-gray-200 rounded-2xl px-2 py-3">
        <div className="flex items-center justify-between">
          {mobileItems.map((item, i) => (
            <React.Fragment key={item.mobileTitle}>
              <div className="flex flex-col items-center text-center gap-1 flex-1">
                <div className="w-10 h-10 bg-custom-green-500 rounded-full flex items-center justify-center">
                  <img src={item.icon} alt="" className="w-5 h-5 object-contain" />
                </div>
                <p className="text-[10px] font-semibold text-gray-800 leading-tight">{item.mobileTitle}</p>
              </div>
              {i < mobileItems.length - 1 && (
                <div className="w-px h-10 bg-gray-200 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

    </div>
  </div>
);

export default TrustBarSection;

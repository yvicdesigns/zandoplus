import React from 'react';

const items = [
  { icon: '/icons/bag-sac.png',  title: 'Des milliers',              desc: 'de produits à portée de clic' },
  { icon: '/icons/car.png',      title: 'Livraison rapide',          desc: 'à Brazzaville et partout au Congo' },
  { icon: '/icons/security.png', title: 'Paiements 100% sécurisés',  desc: 'Achetez en toute confiance' },
  { icon: '/icons/casque.png',   title: 'Service client disponible', desc: 'Nous sommes là pour vous' },
  { icon: '/icons/health.png',   title: 'Produits de qualité',       desc: 'Sélectionnés avec soin pour vous' },
];

const TrustBarSection = () => (
  <div className="pb-4 bg-page-bg">
    <div className="max-w-[1280px] mx-auto px-6">
      <div className="bg-card-bg border border-gray-200 rounded-xl px-6 py-4 flex items-center justify-between">
        {items.map((item, i) => (
          <React.Fragment key={item.title}>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 bg-custom-green-500 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img src={item.icon} alt="" className="w-10 h-10 object-contain" style={{ mixBlendMode: 'screen' }} />
              </div>
              <div>
                <p className="text-[12px] font-bold text-gray-900 leading-tight">{item.title}</p>
                <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{item.desc}</p>
              </div>
            </div>
            {i < items.length - 1 && (
              <div className="w-px h-11 bg-gray-200 flex-shrink-0 mx-2" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  </div>
);

export default TrustBarSection;

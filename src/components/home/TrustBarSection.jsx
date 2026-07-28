import React from 'react';
import { ShoppingBag, Truck, Shield, Headphones, Star } from 'lucide-react';

const items = [
  { icon: ShoppingBag, title: 'Des milliers', desc: 'de produits à portée de clic' },
  { icon: Truck,       title: 'Livraison rapide', desc: 'à Brazzaville et partout au Congo' },
  { icon: Shield,      title: 'Paiements 100% sécurisés', desc: 'Achetez en toute confiance' },
  { icon: Headphones,  title: 'Service client disponible', desc: 'Nous sommes là pour vous' },
  { icon: Star,        title: 'Produits de qualité', desc: 'Sélectionnés avec soin pour vous' },
];

const TrustBarSection = () => (
  <div className="pb-4 bg-page-bg">
    <div className="max-w-[1280px] mx-auto px-6">
      <div className="bg-card-bg border border-gray-200 rounded-xl px-6 py-4 flex items-center justify-between">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <React.Fragment key={item.title}>
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-custom-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-custom-green-500" />
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
          );
        })}
      </div>
    </div>
  </div>
);

export default TrustBarSection;

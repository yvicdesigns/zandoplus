import React from 'react';
import { Truck, MapPin, Headphones, Users } from 'lucide-react';

const items = [
  { icon: Truck,       title: 'Livraison dans tout le Congo',  desc: 'Brazzaville, Pointe-Noire et dans toutes les villes' },
  { icon: MapPin,      title: 'Suivi en temps réel',           desc: 'de votre commande — À chaque étape' },
  { icon: Headphones,  title: 'Support disponible 7j/7',       desc: 'de 8h à 20h — Par téléphone ou WhatsApp' },
  { icon: Users,       title: 'Plus de 10 000 clients',        desc: 'nous font confiance — Rejoignez la communauté !' },
];

const GreenBarSection = () => (
  <section className="bg-custom-green-500 py-8">
    <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between gap-4">
      {items.map(({ icon: Icon, title, desc }, i) => (
        <React.Fragment key={title}>
          <div className="flex items-center gap-4 flex-1">
            <div className="w-11 h-11 border-2 border-white/30 rounded-full flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-white leading-tight">{title}</p>
              <p className="text-[11px] text-white/70 leading-snug mt-0.5">{desc}</p>
            </div>
          </div>
          {i < items.length - 1 && (
            <div className="w-px h-12 bg-white/20 flex-shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  </section>
);

export default GreenBarSection;
